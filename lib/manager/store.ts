import 'server-only'

/**
 * Where the manager password lives.
 *
 * An Upstash Redis store, reached over its REST API with plain `fetch` — no
 * client library, so there's nothing to keep in step with the runtime. The
 * repo is public, which is why the password can't simply be committed
 * alongside the content.
 *
 * Vercel injects different variable names depending on whether the store was
 * added as "Upstash for Redis" or the older "Vercel KV", so both are accepted
 * rather than making the setup depend on which button was clicked.
 */
const REST_URL =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.REDIS_REST_API_URL

const REST_TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.REDIS_REST_API_TOKEN

const PASSWORD_KEY = 'manager:password'
const ATTEMPTS_PREFIX = 'manager:attempts:'

/** Sentinel written when the password is deliberately removed. */
const DISABLED = 'disabled'

export class StoreUnreachableError extends Error {
  constructor(cause: string) {
    super(`The password store could not be reached: ${cause}`)
    this.name = 'StoreUnreachableError'
  }
}

export function storeConfigured(): boolean {
  return Boolean(REST_URL && REST_TOKEN)
}

/**
 * Run one Redis command.
 *
 * Throws StoreUnreachableError on any transport or protocol failure so callers
 * can tell "the store says there's no password" apart from "the store didn't
 * answer" — the first opens the gate, the second must never do so.
 */
async function redis<T>(command: (string | number)[]): Promise<T> {
  if (!storeConfigured()) throw new StoreUnreachableError('no store is configured')

  let res: Response
  try {
    res = await fetch(REST_URL!, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      cache: 'no-store',
    })
  } catch (err) {
    throw new StoreUnreachableError(err instanceof Error ? err.message : 'request failed')
  }

  if (!res.ok) throw new StoreUnreachableError(`HTTP ${res.status}`)

  let json: { result?: T; error?: string }
  try {
    json = await res.json()
  } catch {
    throw new StoreUnreachableError('response was not JSON')
  }

  if (json.error) throw new StoreUnreachableError(json.error)
  return json.result as T
}

export type PasswordState =
  /** No store configured yet — the gate stays open so setup isn't a lockout. */
  | { kind: 'unconfigured' }
  /** Store works, nothing set. Falls back to MANAGER_PASSWORD if present. */
  | { kind: 'none' }
  /** Protection was explicitly removed from the account screen. */
  | { kind: 'disabled' }
  | { kind: 'set'; hash: string }

export async function readPasswordState(): Promise<PasswordState> {
  if (!storeConfigured()) return { kind: 'unconfigured' }

  const value = await redis<string | null>(['GET', PASSWORD_KEY])
  if (value === null || value === undefined || value === '') return { kind: 'none' }
  if (value === DISABLED) return { kind: 'disabled' }
  return { kind: 'set', hash: value }
}

export async function writePassword(hash: string): Promise<void> {
  await redis(['SET', PASSWORD_KEY, hash])
}

export async function disablePassword(): Promise<void> {
  await redis(['SET', PASSWORD_KEY, DISABLED])
}

/**
 * Count a failed login and report how many have happened in the window.
 *
 * The TTL is only applied on the first failure of a window, so a burst of
 * attempts can't keep pushing the expiry out and dodge the lockout.
 */
export async function recordFailure(ip: string, windowSeconds: number): Promise<number> {
  const key = ATTEMPTS_PREFIX + ip
  const count = await redis<number>(['INCR', key])
  if (count === 1) await redis(['EXPIRE', key, windowSeconds])
  return count
}

export async function failureCount(ip: string): Promise<number> {
  const value = await redis<string | number | null>(['GET', ATTEMPTS_PREFIX + ip])
  return value === null || value === undefined ? 0 : Number(value)
}

export async function clearFailures(ip: string): Promise<void> {
  await redis(['DEL', ATTEMPTS_PREFIX + ip])
}
