import type { Metadata } from 'next'

/**
 * Shell for the manager's own screens (sign in, account).
 *
 * Kept out of search results — these pages are a door, not content, and a
 * password prompt indexed under the site's name helps nobody.
 */
export const metadata: Metadata = {
  title: 'Manager',
  robots: { index: false, follow: false },
}

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">{children}</div>
    </main>
  )
}
