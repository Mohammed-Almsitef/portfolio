import Link from 'next/link'

import { gateStatus } from '@/lib/manager/auth'
import { signOutAction } from '../manager/actions'

/**
 * Adds the account controls to the manager.
 *
 * Keystatic renders a full-viewport app and its sidebar navigation only
 * accepts collection and singleton keys — there is no slot for a custom link.
 * So this rides above it as a small fixed control instead of wrapping it in a
 * bar, which would fight Keystatic's own layout.
 *
 * Bottom-right is chosen because Keystatic keeps Save at the top-right and the
 * branch picker at the bottom-left.
 */
export default async function KeystaticLayout({ children }: { children: React.ReactNode }) {
  const status = await gateStatus()
  const unprotected = status.protection === 'open'

  return (
    <>
      {children}

      <div className="fixed bottom-3 right-3 z-50 flex items-center gap-1 rounded-full border border-border bg-surface/90 px-1 py-1 text-xs shadow-lg backdrop-blur-sm">
        {unprotected && (
          <span
            title="Anyone with this URL can open the manager"
            className="rounded-full bg-rose-500/15 px-2 py-1 font-medium text-text"
          >
            No password
          </span>
        )}

        <Link
          href="/manager/account"
          className="rounded-full px-2.5 py-1 font-medium text-body transition hover:bg-elevated hover:text-text"
        >
          Account
        </Link>

        {!unprotected && (
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-full px-2.5 py-1 font-medium text-body transition hover:bg-elevated hover:text-text"
            >
              Sign out
            </button>
          </form>
        )}
      </div>
    </>
  )
}
