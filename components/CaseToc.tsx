'use client'

import { useEffect, useState } from 'react'

/**
 * The case study's "On this page" index. The entry for the section being
 * read is highlighted, so the rail doubles as a progress marker.
 */
export default function CaseToc({
  title,
  items,
}: {
  title: string
  items: { id: string; label: string }[]
}) {
  const [active, setActive] = useState(items[0]?.id ?? '')

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length) setActive(visible[0].target.id)
      },
      { rootMargin: '-25% 0px -65% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [items])

  return (
    <nav aria-label={title} data-print-hide>
      <p className="mono-label mb-4 font-mono text-xs uppercase tracking-wider text-muted">{title}</p>
      <ul className="space-y-1 border-s border-border text-sm">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              aria-current={active === i.id ? 'location' : undefined}
              className={`-ms-px block border-s-2 py-1 ps-4 transition-colors ${
                active === i.id
                  ? 'border-accent font-medium text-text'
                  : 'border-transparent text-muted hover:text-text'
              }`}
            >
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
