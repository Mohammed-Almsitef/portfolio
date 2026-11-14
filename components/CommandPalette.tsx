'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from './Icon'
import { SECTION_IDS } from './Nav'
import { outbound } from '@/lib/links'
import { useTheme } from '@/lib/theme'
import { useCopyToClipboard } from '@/lib/hooks'
import { EYEBROW } from '@/lib/styles'
import { localePath, t, type Locale } from '@/lib/locale'
import type { SectionEntry } from '@/lib/content'

type Item = {
  id: string
  label: string
  hint?: string
  /** Copy-to-clipboard style actions stay open so the confirmation is visible. */
  keepOpen?: boolean
  run: () => void
}

type Group = { title: string; items: Item[] }

/**
 * Cmd/Ctrl+K quick-open: jump to a section, open a case study, copy the
 * email, grab the résumé, or flip the theme without leaving the keyboard.
 *
 * A native <dialog> supplies the modal semantics for free — focus trapping,
 * Escape-to-close, and a `::backdrop` layer that sits above everything else
 * on the page without a bespoke z-index.
 */
export default function CommandPalette({
  locale,
  sections,
  projects,
  email,
  resumeUrl,
  socials,
}: {
  locale: Locale
  sections: SectionEntry[]
  projects: { slug: string; title: string; year: string }[]
  email: string
  resumeUrl: string
  socials: { label: string; href: string }[]
}) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const { mode: themeMode, setTheme } = useTheme()
  const { copied: emailCopied, copy } = useCopyToClipboard()

  const openPalette = () => {
    dialogRef.current?.showModal()
    // showModal() focuses the dialog itself when nothing inside carries
    // autofocus; grabbing the input next frame beats that default.
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const closePalette = () => {
    dialogRef.current?.close()
    setQuery('')
    setActiveIndex(0)
  }

  // Cmd/Ctrl+K toggles from anywhere on the page, mirroring the convention
  // recruiters and engineers already know from GitHub, Linear, and Raycast.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (dialogRef.current?.open) closePalette()
        else openPalette()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const go = (hash: string) => {
    window.location.hash = hash
  }

  /**
   * Follows a link the same way an anchor would. `outbound()` is the one place
   * that decides whether a URL needs a scheme and whether it earns a new tab,
   * so this reads its answer rather than re-deciding both here.
   */
  const follow = (href: string) => {
    const { href: resolved, target } = outbound(href)
    if (target === '_blank') window.open(resolved, '_blank', 'noopener,noreferrer')
    else window.location.href = resolved
  }

  const groups = useMemo<Group[]>(() => {
    const goTo: Item[] = [
      { id: 'home', label: t(locale, 'home'), run: () => go('#top') },
      ...sections
        .filter((s) => SECTION_IDS[s.key])
        .map((s) => ({ id: s.key, label: s.label, run: () => go(`#${SECTION_IDS[s.key]}`) })),
    ]

    const caseStudies: Item[] = projects.map((p) => ({
      id: `project-${p.slug}`,
      label: p.title,
      hint: p.year,
      run: () => router.push(localePath(locale, `/projects/${p.slug}`)),
    }))

    const connect: Item[] = [
      {
        id: 'email',
        label: emailCopied ? t(locale, 'emailCopied') : t(locale, 'copyEmailAction'),
        run: () => copy(email),
        keepOpen: true,
      },
      {
        id: 'resume',
        label: t(locale, 'downloadResume'),
        run: () => follow(resumeUrl),
      },
      ...socials.map((s) => ({
        id: `social-${s.href}`,
        label: s.label,
        run: () => follow(s.href),
      })),
    ]

    const appearance: Item[] = [
      {
        id: 'theme',
        label: t(locale, themeMode === 'dark' ? 'themeToLight' : 'themeToDark'),
        run: () => setTheme(themeMode === 'dark' ? 'light' : 'dark'),
      },
    ]

    return [
      { title: t(locale, 'groupGoTo'), items: goTo },
      { title: t(locale, 'groupCaseStudies'), items: caseStudies },
      { title: t(locale, 'groupConnect'), items: connect },
      { title: t(locale, 'groupAppearance'), items: appearance },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, sections, projects, socials, resumeUrl, email, themeMode, emailCopied])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups
      .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0)
  }, [groups, query])

  const flat = useMemo(() => filtered.flatMap((g) => g.items), [filtered])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  const runItem = (item: Item) => {
    item.run()
    if (item.keepOpen) {
      // The item's own label is about to change (e.g. "Copy email address" →
      // "Email copied") — clear the query so that confirmation doesn't
      // immediately filter itself out of a now-stale search.
      setQuery('')
      setActiveIndex(0)
    } else {
      closePalette()
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!flat.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % flat.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + flat.length) % flat.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = flat[activeIndex]
      if (item) runItem(item)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        aria-label={t(locale, 'openCommandMenu')}
        data-print-hide
        // Stacked above BackToTop rather than sharing the opposite corner:
        // Next's own dev-mode tools indicator also docks bottom-left, and
        // fighting it for that corner is a losing battle in local dev.
        className="fixed bottom-20 end-6 z-40 flex h-10 items-center gap-2 rounded-full border border-border-strong bg-surface/90 px-4 text-sm text-muted backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
      >
        <Icon name="search" className="size-4" />
        <span dir="ltr" className="mono-label hidden font-mono text-xs sm:inline">
          ⌘K
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-label={t(locale, 'commandMenu')}
        // Escape fires the native `cancel` → `close` sequence on its own;
        // this only resets state for that path (our own actions already
        // route through closePalette()).
        onClose={() => {
          setQuery('')
          setActiveIndex(0)
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) closePalette()
        }}
        className="m-0 mx-auto mt-[12vh] mb-auto w-[min(92vw,32rem)] max-w-none rounded-xl border border-border bg-elevated p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Icon name="search" className="size-4 shrink-0 text-muted" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls="command-palette-listbox"
              aria-activedescendant={flat[activeIndex] ? `cmd-${flat[activeIndex].id}` : undefined}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t(locale, 'commandPlaceholder')}
              className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted"
            />
          </div>

          <div
            id="command-palette-listbox"
            role="listbox"
            aria-label={t(locale, 'commandMenu')}
            className="max-h-[50vh] overflow-y-auto p-2"
          >
            {flat.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted">{t(locale, 'commandEmpty')}</p>
            )}

            {filtered.map((group) => (
              <div key={group.title} className="mb-2 last:mb-0">
                <p className={`px-3 pb-1 pt-2 ${EYEBROW}`}>
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const index = flat.indexOf(item)
                  const active = index === activeIndex
                  return (
                    <button
                      key={item.id}
                      id={`cmd-${item.id}`}
                      role="option"
                      aria-selected={active}
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => runItem(item)}
                      className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-start text-sm transition-colors ${
                        active ? 'bg-accent text-bg' : 'text-body hover:bg-border/50'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      {item.hint && (
                        <span
                          className={`shrink-0 font-mono text-xs ${active ? 'text-bg/70' : 'text-muted'}`}
                        >
                          {item.hint}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </dialog>
    </>
  )
}
