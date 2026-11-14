'use client'

import { useEffect, useMemo, useState } from 'react'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import { t, type Locale } from '@/lib/locale'
import { useScrollValue } from '@/lib/hooks'
import LanguageSwitch from './LanguageSwitch'

/** Section keys map to the DOM ids the components render. */
export const SECTION_IDS: Record<string, string> = {
  about: 'about',
  projects: 'projects',
  openSource: 'open-source',
  skills: 'skills',
  experience: 'experience',
  writing: 'writing',
  contact: 'contact',
}

export default function Nav({
  siteName,
  sections,
  locale = 'en',
  languageHrefs,
  resumeUrl,
}: {
  siteName: string
  sections: { key: string; label: string }[]
  locale?: Locale
  /** Omitted until the Arabic site is published, which hides the switch. */
  languageHrefs?: Record<Locale, string>
  /** The CV, linked from the bar on wider screens. */
  resumeUrl?: string
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

  const scrolled = useScrollValue(() => window.scrollY > 8, false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')

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
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        // The open mobile panel needs a solid ground — at 80% opacity the hero
        // headline reads straight through the menu items.
        open ? 'bg-bg' : ''
      }`}
    >

      <nav aria-label="Main" className="mx-auto max-w-page px-3 sm:px-4">
        {/* At the top the bar is bare; once the page scrolls it becomes a
            floating glass pill, inset from the edges. */}
        <div
          className={`flex items-center justify-between gap-4 rounded-2xl px-3 transition-all duration-300 ${
            scrolled && !open ? 'glass nav-solid mt-3 py-2' : 'mt-1 border border-transparent py-3'
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <a
              href="#top"
              // On phones the name beside the mark is hidden, so the link
              // carries it itself.
              aria-label={siteName}
              className="tap min-w-0 items-center gap-2.5 text-[0.9375rem] font-semibold tracking-tight transition-colors hover:text-accent"
            >
              {/* The name is right beside it, so the mark is decoration to a
                  screen reader rather than a second copy of the same words. */}
              <Logo id="nav-logo" weight="medium" className="h-9 w-auto shrink-0 sm:h-10" />
              {/* On a phone the mark carries the identity on its own, and the
                  words next to it are what pushed the availability dot and the
                  controls off the bar. The name returns as soon as there is room
                  for it, and truncates in between rather than colliding. */}
              <span className="hidden truncate sm:inline">{siteName}</span>
            </a>

          </div>

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

            {/* Search stays on ⌘K / Ctrl+K; a five-section page does not need
                a visible search button competing with the CV. */}
            {resumeUrl && (
              <a
                href={resumeUrl}
                className="btn-ghost hidden h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium sm:inline-flex"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />
                </svg>
                {t(locale, 'cv')}
              </a>
            )}
            {languageHrefs && <LanguageSwitch locale={locale} hrefs={languageHrefs} />}
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
