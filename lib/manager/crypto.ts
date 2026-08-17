import 'server-only'

import { createHmac, randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'

/**
 * Password hashing and session signing for the manager gate.
 *
 * Everything here runs on the server only. Nothing in this file may be
 * imported from a client component — the session secret would end up in the
 * browser bundle.
 */

/**
 * scrypt cost — the classic "interactive" parameters, roughly 100ms per verify.
 *
 * maxmem is set explicitly because Node's default ceiling is 32 MiB and scrypt
 * needs *more* than 128 * N * r bytes; at N=16384, r=8 that is exactly 16 MiB,
 * which leaves no room to raise N later without the call throwing.
 */
const N = 16384
const R = 8
const P = 1
const KEY_LEN = 64
const MAX_MEM = 64 * 1024 * 1024

/** promisify() drops scrypt's options overload, so it is wrapped by hand. */
function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key)))
  })
}

/**
 * Hash a password for storage.
 *
 * The salt is random per password and stored alongside the hash, so two
 * accounts with the same password never produce the same record. The
 * parameters travel with the hash so raising the cost later doesn't
 * invalidate existing passwords.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scryptAsync(password.normalize('NFKC'), salt, KEY_LEN, {
    N,
    r: R,
    p: P,
    maxmem: MAX_MEM,
  })

  return ['scrypt', N, R, P, salt.toString('base64url'), key.toString('base64url')].join('$')
}

/**
 * Check a password against a stored hash.
 *
 * Returns false rather than throwing on a malformed record — a corrupted
 * value in the store should lock the manager, not crash the login route.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false

  const [, n, r, p, salt, expected] = parts
  const expectedKey = Buffer.from(expected, 'base64url')
  if (expectedKey.length === 0) return false

  let actualKey: Buffer
  try {
    // Parameters come from the stored record, so hashes written with older
    // costs keep verifying after N is raised.
    actualKey = await scryptAsync(
      password.normalize('NFKC'),
      Buffer.from(salt, 'base64url'),
      expectedKey.length,
      { N: Number(n), r: Number(r), p: Number(p), maxmem: MAX_MEM },
    )
  } catch {
    return false
  }

  return timingSafeEqual(actualKey, expectedKey)
}

/**
 * Compare two strings without leaking their contents through timing.
 *
 * Both sides are hashed first so differing lengths don't throw and don't
 * reveal the length of the secret.
 */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHmac('sha256', 'compare').update(a).digest()
  const hb = createHmac('sha256', 'compare').update(b).digest()
  return timingSafeEqual(ha, hb)
}

/** Whether a session can be signed at all, for callers that must fail cleanly. */
export function sessionSecretConfigured(): boolean {
  return Boolean(process.env.MANAGER_SESSION_SECRET || process.env.KEYSTATIC_SECRET)
}

function sessionSecret(): string {
  // KEYSTATIC_SECRET is already required for the GitHub login flow, so reusing
  // it keeps the setup to one fewer variable. A dedicated value wins if set.
  const secret = process.env.MANAGER_SESSION_SECRET || process.env.KEYSTATIC_SECRET
  if (!secret) throw new Error('MANAGER_SESSION_SECRET or KEYSTATIC_SECRET must be set')
  return secret
}

type SessionPayload = { exp: number }

/** Sign a session that expires after `ttlSeconds`. */
export function signSession(ttlSeconds: number): string {
  const payload: SessionPayload = { exp: Date.now() + ttlSeconds * 1000 }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const mac = createHmac('sha256', sessionSecret()).update(body).digest('base64url')
  return `${body}.${mac}`
}

/**
 * Verify a session cookie.
 *
 * The signature is checked before the payload is parsed, so an attacker can't
 * feed arbitrary JSON to the parser, and the expiry is inside the signed
 * payload so it can't be extended by editing the cookie.
 */
export function verifySession(token: string | undefined): boolean {
  if (!token) return false

  const [body, mac] = token.split('.')
  if (!body || !mac) return false

  const expected = createHmac('sha256', sessionSecret()).update(body).digest('base64url')
  if (!safeEqual(mac, expected)) return false

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload
    return typeof payload.exp === 'number' && payload.exp > Date.now()
  } catch {
    return false
  }
}
