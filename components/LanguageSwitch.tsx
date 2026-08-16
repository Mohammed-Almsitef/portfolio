import Link from 'next/link'
import { type Locale } from '@/lib/locale'

const LABEL: Record<Locale, { text: string; name: string; dir: 'ltr' | 'rtl'; code: string }> = {
  en: { text: 'EN', name: 'English', dir: 'ltr', code: 'en' },
  ar: { text: 'عربي', name: 'العربية', dir: 'rtl', code: 'ar' },
}

export default function LanguageSwitch({
  locale,
  hrefs,
}: {
  locale: Locale
  hrefs: Record<Locale, string>
}) {
  const targetLocale = locale === 'en' ? 'ar' : 'en'
  
  return (
    <Link
      href={hrefs[targetLocale]}
      hrefLang={targetLocale}
      lang={targetLocale}
      dir={LABEL[targetLocale].dir}
      title={LABEL[targetLocale].name}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface/70 backdrop-blur-sm transition-colors hover:bg-border/60 hover:text-text"
      aria-label={`Switch to ${LABEL[targetLocale].name}`}
      data-print-hide
    >
      {LABEL[targetLocale].code}
    </Link>
  )
}