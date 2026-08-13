'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LOCALES, type Locale } from '@/lib/locale'

/**
 * Switches between the English and Arabic versions of the current page.
 *
 * Built as a segmented control rather than a single link so both languages are
 * visible at once: a reader who cannot read the current page can still see
 * that the other one exists, and which of the two they are on.
 *
 * Each label is written in its own language, and carries its own `lang` and
 * `dir` — otherwise "عربي" inherits the surrounding page's direction and
 * renders the wrong way round on the English side.
 *
 * These are navigations, so they are links. It is styled like a button group,
 * but making them <button>s would break opening a language in a new tab.
 */
const LABEL: Record<Locale, { text: string; name: string; dir: 'ltr' | 'rtl' }> = {
  en: { text: 'EN', name: 'English', dir: 'ltr' },
  ar: { text: 'عربي', name: 'العربية', dir: 'rtl' },
}

export default function LanguageSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname() || '/'

  // Strip any locale prefix to get the shared part of the path, so switching
  // language keeps you on the same page instead of returning you to the top.
  const bare = pathname.replace(/^\/ar(?=\/|$)/, '') || '/'

  const hrefFor = (target: Locale) => (target === 'ar' ? `/ar${bare === '/' ? '' : bare}` : bare)

  return (
    <div
      role="group"
      aria-label="Language"
      data-print-hide
      className="flex items-center gap-0.5 rounded-lg border border-border bg-surface/70 p-0.5 backdrop-blur-sm"
    >
      {LOCALES.map((l) => {
        const current = l === locale
        return (
          <Link
            key={l}
            href={hrefFor(l)}
            hrefLang={l}
            lang={l}
            dir={LABEL[l].dir}
            // Marks the active language for assistive tech, the same way the
            // theme toggle reports its selected mode.
            aria-current={current ? 'true' : undefined}
            title={LABEL[l].name}
            className={`flex h-7 items-center justify-center rounded-md px-2 font-mono text-xs transition-colors ${
              current ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-border/60 hover:text-text'
            }`}
          >
            {LABEL[l].text}
          </Link>
        )
      })}
    </div>
  )
}
