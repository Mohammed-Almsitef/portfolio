import Link from 'next/link'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'
import { gateStatus } from '@/lib/manager/auth'
import { signOutAction } from '../actions'
import ManagerNav from './ManagerNav'

/**
 * The frame around the manager's own pages: brand, section links, a way to
 * the live site, theme and sign-out. Content editing itself happens in
 * Keystatic at /keystatic, which keeps its own full-screen layout.
 */
export default async function ManagerAppLayout({ children }: { children: React.ReactNode }) {
  const status = await gateStatus()

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
          <Link href="/manager" className="flex shrink-0 items-center gap-2.5" aria-label="Manager overview">
            <Logo id="mgr-logo" weight="medium" className="h-7 w-auto" />
            <span className="hidden text-sm font-semibold tracking-tight sm:inline">Manager</span>
          </Link>
          <span aria-hidden="true" className="hidden h-5 w-px bg-border sm:block" />
          <ManagerNav />
          <div className="ms-auto flex shrink-0 items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-border/50 hover:text-text sm:inline-flex"
            >
              View site <span aria-hidden="true">↗</span>
            </a>
            <ThemeToggle />
            {status.protection === 'required' && (
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-border/50 hover:text-text"
                >
                  Sign out
                </button>
              </form>
            )}
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-5 py-10 md:py-14">
        {children}
      </main>
    </>
  )
}
