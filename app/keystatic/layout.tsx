import Link from 'next/link'

import './keystatic-theme.css'

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

      {/* Painted from Keystatic's own tokens rather than the site's. The two
          carry independent light/dark settings, so a chip themed off the site
          would sit light-on-dark whenever the manager is set the other way. */}
      <div className="kst-chip">
        {unprotected && (
          <span title="Anyone with this URL can open the manager" className="kst-chip-warn">
            No password
          </span>
        )}

        <Link href="/manager/account" className="kst-chip-action">
          Account
        </Link>

        {!unprotected && (
          <form action={signOutAction}>
            <button type="submit" className="kst-chip-action">
              Sign out
            </button>
          </form>
        )}
      </div>
    </>
  )
}
