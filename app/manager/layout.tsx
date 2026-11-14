import type { Metadata } from 'next'

/**
 * The manager's screens (sign in, overview, account).
 *
 * Kept out of search results — these pages are a door, not content, and a
 * password prompt indexed under the site's name helps nobody.
 */
export const metadata: Metadata = {
  title: 'Manager',
  robots: { index: false, follow: false },
}

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-bg text-text">{children}</div>
}
