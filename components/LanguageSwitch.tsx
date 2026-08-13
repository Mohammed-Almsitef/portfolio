'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { t, type Locale } from '@/lib/locale'

/**
 * Switches between the English and Arabic pages.
 *
 * It keeps you on the same page rather than dumping you at the home page —
 * reading a case study and being thrown back to the top is the fastest way to
 * make someone stop using a language switch.
 *
 * The label is written in the language it takes you *to*, which is the one
 * convention every bilingual site agrees on: a reader who cannot read the
 * current page can still read the way out.
 */
export default function LanguageSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname() || '/'
  const other: Locale = locale === 'ar' ? 'en' : 'ar'

  const href =
    locale === 'ar'
      ? pathname.replace(/^\/ar(?=\/|$)/, '') || '/'
      : `/ar${pathname === '/' ? '' : pathname}`

  return (
    <Link
      href={href}
      hrefLang={other}
      // The label is in the target language, so it must be read in that
      // language's direction — not the one the surrounding page uses.
      lang={other}
      dir={other === 'ar' ? 'rtl' : 'ltr'}
      title={t(locale, 'switchLanguage')}
      className="tap rounded-md px-2 py-1 font-mono text-xs text-muted transition-colors hover:bg-elevated hover:text-text"
    >
      {t(locale, 'languageName')}
    </Link>
  )
}
