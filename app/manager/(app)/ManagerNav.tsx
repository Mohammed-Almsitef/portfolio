'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { editPath } from '@/lib/manager/editPath'

const LINKS = [
  { href: '/manager', label: 'Overview' },
  { href: editPath(), label: 'Edit content' },
  { href: '/manager/account', label: 'Account' },
]

/** The manager's section links, with the current page marked. */
export default function ManagerNav() {
  const path = usePathname()
  return (
    <nav aria-label="Manager" className="flex items-center gap-1 overflow-x-auto">
      {LINKS.map((l) => {
        const active = l.href === '/manager' ? path === '/manager' : path.startsWith(l.href)
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? 'page' : undefined}
            className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3 ${
              active ? 'bg-accent/12 text-accent' : 'text-muted hover:bg-border/50 hover:text-text'
            }`}
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
