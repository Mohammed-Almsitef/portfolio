import Link from 'next/link'
import { type Locale } from '@/lib/locale'
import { CONTROL_BUTTON } from '@/lib/styles'

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
      className={CONTROL_BUTTON}
      aria-label={`Switch to ${LABEL[targetLocale].name}`}
      data-print-hide
    >
      {LABEL[targetLocale].code}
    </Link>
  )
}