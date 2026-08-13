import 'server-only'

import { cookies } from 'next/headers'

import { hashPassword, safeEqual, signSession, verifyPassword, verifySession } from './crypto'
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
    const state = await readPasswordState()

    switch (state.kind) {
      case 'unconfigured':
        return { protection: 'open', reason: 'unconfigured' }
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

  if (storeConfigured()) {
    const failures = await failureCount(ip)
    if (failures >= MAX_ATTEMPTS) {
      return { ok: false, error: 'Too many attempts. Try again in 15 minutes.' }
    }
  }

  const matched = await passwordMatches(password, status.source)

  if (!matched) {
    let remaining: number | undefined
    if (storeConfigured()) {
      const count = await recordFailure(ip, LOCKOUT_WINDOW_SECONDS)
      remaining = Math.max(0, MAX_ATTEMPTS - count)
    }
    return { ok: false, error: 'Incorrect password.', remaining }
  }

  if (storeConfigured()) await clearFailures(ip)
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
 * Replace the password. Requires the current one, so a session left open on a
 * borrowed machine can't be used to take the manager over.
 */
export async function changePassword(current: string, next: string): Promise<LoginResult> {
  const status = await gateStatus()

  if (status.protection === 'locked') {
    return { ok: false, error: 'The password store is unavailable. Try again shortly.' }
  }
  if (!storeConfigured()) {
    return { ok: false, error: 'No password store is configured, so the password cannot be saved.' }
  }
  if (status.protection === 'required' && !(await passwordMatches(current, status.source))) {
    return { ok: false, error: 'The current password is incorrect.' }
  }
  if (next.length < 10) {
    return { ok: false, error: 'Use at least 10 characters.' }
  }

  await writePassword(await hashPassword(next))
  return { ok: true }
}

/** Turn protection off entirely, leaving the manager open to anyone. */
export async function removePassword(current: string): Promise<LoginResult> {
  const status = await gateStatus()

  if (status.protection === 'locked') {
    return { ok: false, error: 'The password store is unavailable. Try again shortly.' }
  }
  if (!storeConfigured()) {
    return { ok: false, error: 'No password store is configured.' }
  }
  if (status.protection === 'required' && !(await passwordMatches(current, status.source))) {
    return { ok: false, error: 'The current password is incorrect.' }
  }

  await disablePassword()
  return { ok: true }
}
