import 'server-only'

import { cookies } from 'next/headers'

import {
  hashPassword,
  safeEqual,
  sessionSecretConfigured,
  signSession,
  verifyPassword,
  verifySession,
} from './crypto'
import {
  StoreUnreachableError,
  clearFailures,
  disablePassword,
  failureCount,
  readPasswordState,
  recordFailure,
  storeConfigured,
  writePassword,
} from './store'

export const SESSION_COOKIE = 'manager_session'

/** Long enough not to be a nuisance, short enough that a stolen laptop ages out. */
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

const MAX_ATTEMPTS = 8
const LOCKOUT_WINDOW_SECONDS = 15 * 60

/**
 * Fallback attempt counter for when no store is configured.
 *
 * MANAGER_PASSWORD alone is a valid setup — a password with no Redis behind it —
 * and it used to get no rate limiting at all, because every limit went through
 * the store. In-process counting is weaker (it resets on redeploy and is per
 * instance, so a serverless fleet multiplies the allowance) but the difference
 * between that and nothing is the difference between a slow guess and an
 * unlimited one.
 */
const localFailures = new Map<string, { count: number; expires: number }>()

function localRecordFailure(ip: string): number {
  const now = Date.now()
  const entry = localFailures.get(ip)

  if (!entry || entry.expires <= now) {
    localFailures.set(ip, { count: 1, expires: now + LOCKOUT_WINDOW_SECONDS * 1000 })
    return 1
  }

  entry.count += 1
  return entry.count
}

function localFailureCount(ip: string): number {
  const entry = localFailures.get(ip)
  if (!entry) return 0
  if (entry.expires <= Date.now()) {
    localFailures.delete(ip)
    return 0
  }
  return entry.count
}

/** True when this address has spent its attempts for the window. */
async function lockedOut(ip: string): Promise<boolean> {
  const count = storeConfigured() ? await failureCount(ip) : localFailureCount(ip)
  return count >= MAX_ATTEMPTS
}

/** Count a wrong password and report how many tries are left. */
async function noteFailure(ip: string): Promise<number> {
  const count = storeConfigured()
    ? await recordFailure(ip, LOCKOUT_WINDOW_SECONDS)
    : localRecordFailure(ip)
  return Math.max(0, MAX_ATTEMPTS - count)
}

async function forgetFailures(ip: string): Promise<void> {
  if (storeConfigured()) await clearFailures(ip)
  else localFailures.delete(ip)
}

const TOO_MANY = 'Too many attempts. Try again in 15 minutes.'

/**
 * Whether the manager currently requires a password, and why.
 *
 * `open` is returned for the states that legitimately mean "nothing to check
 * against" — no store yet, or protection deliberately removed. A store that is
 * configured but *unreachable* is never open: see gateStatus().
 */
export type GateStatus =
  | { protection: 'open'; reason: 'unconfigured' | 'disabled' | 'not-set' }
  | { protection: 'required'; source: 'store' | 'env' }
  | { protection: 'locked'; reason: string }

export async function gateStatus(): Promise<GateStatus> {
  try {
    // A password with no key to sign sessions with cannot let anyone *in*: the
    // signing throws, which surfaced as a 500 on every manager route. Reporting
    // it as locked keeps the same closed door and says why.
    if (!sessionSecretConfigured() && (await passwordConfigured())) {
      return {
        protection: 'locked',
        reason: 'Set MANAGER_SESSION_SECRET (or KEYSTATIC_SECRET) so sessions can be signed.',
      }
    }

    const state = await readPasswordState()

    switch (state.kind) {
      case 'unconfigured':
        // No store — but a password in the environment still counts. Ignoring
        // it here left an owner who set MANAGER_PASSWORD without adding Redis
        // with a manager they believed was protected and wasn't, which is worse
        // than either state on its own. It cannot be *changed* from the account
        // screen with no store to write to, and that screen says so.
        return process.env.MANAGER_PASSWORD
          ? { protection: 'required', source: 'env' }
          : { protection: 'open', reason: 'unconfigured' }
      case 'disabled':
        return { protection: 'open', reason: 'disabled' }
      case 'set':
        return { protection: 'required', source: 'store' }
      case 'none':
        // Bootstrap: a password set in the environment applies until one is
        // saved from the account screen, which then takes precedence.
        return process.env.MANAGER_PASSWORD
          ? { protection: 'required', source: 'env' }
          : { protection: 'open', reason: 'not-set' }
    }
  } catch (err) {
    // The store is configured but did not answer. Opening the gate on an
    // outage would turn a blip into an exposed manager, so deny instead.
    return {
      protection: 'locked',
      reason: err instanceof StoreUnreachableError ? err.message : 'password store error',
    }
  }
}

/** Whether any password is in force, ignoring whether it can be checked. */
async function passwordConfigured(): Promise<boolean> {
  if (process.env.MANAGER_PASSWORD) return true
  const state = await readPasswordState()
  return state.kind === 'set'
}

export async function isSignedIn(): Promise<boolean> {
  const jar = await cookies()
  return verifySession(jar.get(SESSION_COOKIE)?.value)
}

export type LoginResult = { ok: true } | { ok: false; error: string; remaining?: number }

/**
 * Check a submitted password and open a session if it matches.
 *
 * Failures are counted per client IP and lock the login out for a window once
 * they pile up, so a public URL can't be ground down by guesses.
 */
export async function attemptLogin(password: string, ip: string): Promise<LoginResult> {
  const status = await gateStatus()

  if (status.protection === 'locked') {
    return { ok: false, error: 'The password store is unavailable. Try again shortly.' }
  }
  if (status.protection === 'open') {
    // Nothing to verify against — treat as already in rather than rejecting.
    await startSession()
    return { ok: true }
  }

  if (await lockedOut(ip)) return { ok: false, error: TOO_MANY }

  if (!(await passwordMatches(password, status.source))) {
    return { ok: false, error: 'Incorrect password.', remaining: await noteFailure(ip) }
  }

  await forgetFailures(ip)
  await startSession()
  return { ok: true }
}

async function passwordMatches(password: string, source: 'store' | 'env'): Promise<boolean> {
  if (source === 'env') return safeEqual(password, process.env.MANAGER_PASSWORD ?? '')

  const state = await readPasswordState()
  if (state.kind !== 'set') return false
  return verifyPassword(password, state.hash)
}

async function startSession(): Promise<void> {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, signSession(SESSION_TTL_SECONDS), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function endSession(): Promise<void> {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}

/**
 * Check the current password on behalf of the account screen.
 *
 * Both of the actions below take a password, which makes them a second door to
 * guess at — and a server action is reachable by POST whether or not the page
 * that renders its form was ever served, so the page's own redirect does not
 * protect them. They therefore repeat the two things the login route does: they
 * insist on a session, so an anonymous caller never even reaches the hash
 * comparison, and they count wrong answers into the same bucket as the login,
 * so the lockout cannot be sidestepped by knocking here instead.
 */
async function authorizeChange(current: string, ip: string): Promise<LoginResult | null> {
  const status = await gateStatus()

  if (status.protection === 'locked') {
    return { ok: false, error: 'The password store is unavailable. Try again shortly.' }
  }
  if (!storeConfigured()) {
    return { ok: false, error: 'No password store is configured, so the password cannot be saved.' }
  }

  if (status.protection === 'required') {
    if (!(await isSignedIn())) {
      return { ok: false, error: 'Sign in again before changing the password.' }
    }
    if (await lockedOut(ip)) return { ok: false, error: TOO_MANY }

    if (!(await passwordMatches(current, status.source))) {
      return {
        ok: false,
        error: 'The current password is incorrect.',
        remaining: await noteFailure(ip),
      }
    }

    await forgetFailures(ip)
  }

  return null
}

/**
 * Replace the password. Requires the current one, so a session left open on a
 * borrowed machine can't be used to take the manager over.
 */
export async function changePassword(
  current: string,
  next: string,
  ip: string,
): Promise<LoginResult> {
  const denied = await authorizeChange(current, ip)
  if (denied) return denied

  if (next.length < 10) {
    return { ok: false, error: 'Use at least 10 characters.' }
  }

  await writePassword(await hashPassword(next))
  return { ok: true }
}

/** Turn protection off entirely, leaving the manager open to anyone. */
export async function removePassword(current: string, ip: string): Promise<LoginResult> {
  const denied = await authorizeChange(current, ip)
  if (denied) return denied

  await disablePassword()
  return { ok: true }
}
