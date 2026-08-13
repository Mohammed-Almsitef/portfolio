'use client'

import { useEffect, useMemo, useState } from 'react'
import ThemeToggle from './ThemeToggle'
import type { Locale } from '@/lib/locale'
import LanguageSwitch from './LanguageSwitch'

/** Section keys map to the DOM ids the components render. */
const SECTION_IDS: Record<string, string> = {
  about: 'about',
  projects: 'projects',
  openSource: 'open-source',
  skills: 'skills',
  experience: 'experience',
  contact: 'contact',
}

export default function Nav({
  siteName,
  sections,
  locale = 'en',
  showLanguage = false,
}: {
  siteName: string
  sections: { key: string; label: string }[]
  locale?: Locale
  /** Hidden until an Arabic translation is actually published. */
  showLanguage?: boolean
}) {
  // Only the sections that are actually on the page get a nav link, so hiding
  // a section in the manager never leaves a link pointing at nothing.
  const links = useMemo(
    () =>
      sections
        .filter((s) => SECTION_IDS[s.key])
        .map((s) => ({ href: `#${SECTION_IDS[s.key]}`, label: s.label })),
    [sections],
  )

  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const sectionEls = links
      .map((l) => document.getElementById(l.href.slice(1)))
      .filter((el): el is HTMLElement => el !== null)

    if (!sectionEls.length) return

    // Track the live set of sections crossing the band rather than reacting to
    // each entry in isolation: otherwise scrolling back up to the hero — where
    // no section qualifies — leaves the last match highlighted forever.
    const inBand = new Set<string>()

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) inBand.add(e.target.id)
          else inBand.delete(e.target.id)
        }
        const topMost = links.find((l) => inBand.has(l.href.slice(1)))
        setActive(topMost ? topMost.href : '')
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    )

    sectionEls.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [links])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header
      data-print-hide
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-300 ${
        // The open mobile panel needs a solid ground — at 80% opacity the hero
        // headline reads straight through the menu items.
        open
          ? 'border-b border-border bg-bg'
          : scrolled
            ? 'border-b border-border bg-bg/80 backdrop-blur-md'
            : 'border-b border-transparent'
      }`}
    >
      <nav aria-label="Main" className="mx-auto max-w-5xl px-6">
        <div className="flex items-center justify-between gap-4 py-4">
          <a
            href="#top"
            className="tap font-mono text-sm font-medium tracking-tight transition-colors hover:text-accent"
          >
            {siteName}
          </a>

          <div className="flex items-center gap-5">
            <ul className="hidden items-center gap-7 lg:flex">
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    aria-current={active === l.href ? 'true' : undefined}
                    className={`tap relative py-1 text-sm transition-colors after:absolute after:-bottom-0.5 after:start-0 after:h-px after:bg-accent after:transition-all after:duration-300 ${
                      active === l.href
                        ? 'text-text after:w-full'
                        : 'text-muted after:w-0 hover:text-text hover:after:w-full'
                    }`}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>

            {showLanguage && <LanguageSwitch locale={locale} />}
            <ThemeToggle />

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
              className="flex size-9 flex-col items-center justify-center gap-[5px] rounded-md border border-border transition-colors hover:border-border-strong lg:hidden"
            >
              <span
                aria-hidden="true"
                className={`h-px w-4 bg-text transition-transform duration-300 ${
                  open ? 'translate-y-[3px] rotate-45' : ''
                }`}
              />
              <span
                aria-hidden="true"
                className={`h-px w-4 bg-text transition-transform duration-300 ${
                  open ? '-translate-y-[3px] -rotate-45' : ''
                }`}
              />
            </button>
          </div>
        </div>

        <ul
          id="mobile-menu"
          className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 lg:hidden ${
            open ? 'grid-rows-[1fr] pb-3 opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <li className="min-h-0 overflow-hidden">
            <ul className="border-t border-border pt-2">
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    tabIndex={open ? undefined : -1}
                    className={`block py-2.5 text-sm transition-colors ${
                      active === l.href ? 'text-accent' : 'text-muted hover:text-text'
                    }`}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </header>
  )
}
