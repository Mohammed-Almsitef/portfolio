import Link from 'next/link'
import { LOCALES, type Locale } from '@/lib/locale'

/**
 * Switches between the English and Arabic sites.
 *
 * Both destinations are passed in rather than derived from the current path.
 * The two sites are independent, so a case study can exist in one language and
 * not the other — rewriting `/projects/x` to `/ar/projects/x` would send half
 * the readers who use this to a 404. The caller knows what exists; this does
 * not guess.
 *
 * Shown as a pair rather than a single link so a reader who cannot read the
 * current page can still see the other exists and which one they are on. Each
 * label carries its own `lang` and `dir`, or "عربي" inherits the English
 * page's direction and renders backwards.
 *
 * These stay links, not buttons, so opening a language in a new tab works.
 */
const LABEL: Record<Locale, { text: string; name: string; dir: 'ltr' | 'rtl' }> = {
  en: { text: 'EN', name: 'English', dir: 'ltr' },
  ar: { text: 'عربي', name: 'العربية', dir: 'rtl' },
}

export default function LanguageSwitch({
  locale,
  hrefs,
}: {
  locale: Locale
  hrefs: Record<Locale, string>
}) {
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
            href={hrefs[l]}
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
