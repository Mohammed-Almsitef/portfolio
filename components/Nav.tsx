'use client'

import { useEffect, useMemo, useState } from 'react'
import ThemeToggle from './ThemeToggle'
import { t, type Locale } from '@/lib/locale'
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
  languageHrefs,
  availableForWork,
}: {
  siteName: string
  sections: { key: string; label: string }[]
  locale?: Locale
  /** Omitted until the Arabic site is published, which hides the switch. */
  languageHrefs?: Record<Locale, string>
  availableForWork: boolean
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

      <nav aria-label="Main" className="mx-auto max-w-page px-6">
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <a
              href="#top"
              className="tap shrink-0 font-mono text-sm font-medium tracking-tight transition-colors hover:text-accent"
            >
              {siteName}
            </a>

            {availableForWork && (
              <p title={t(locale, 'availableForWork')} className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[rgb(var(--tone-status)/0.35)] bg-[rgb(var(--tone-status)/0.12)] sm:px-2 px-1 py-1 font-mono text-[0.6875rem] font-medium text-[rgb(var(--tone-status))] shadow-[0_0_12px_rgb(var(--tone-status)/0.25)] cursor-help">
                <span className="relative flex size-1.5 shrink-0">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-[rgb(var(--tone-status))] opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-[rgb(var(--tone-status))]" />
                </span>
                {/* The dot alone reads fine on a phone-width bar; the label only
                    earns its space once there's room next to the name and links. */}
                <span className="hidden sm:inline">{t(locale, 'availableForWork')}</span>
              </p>
            )}
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
