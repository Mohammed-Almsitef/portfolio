import { getSite } from '@/lib/content'
import Logo from './Logo'
import SectionRule from './SectionRule'
import type { Locale } from '@/lib/locale'

/**
 * Identity and copyright only. Role, location and the social links each have a
 * single home elsewhere on the page, so the footer does not restate them.
 */
export default async function Footer({ locale = 'en' }: { locale?: Locale }) {
  const site = await getSite(locale)

  return (
    <footer data-print-hide>
      <SectionRule />

      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-3 px-6 py-10">
        <p className="mono-label flex items-center gap-2.5 font-mono text-sm">
          <Logo id="footer-logo" weight="small" className="h-8 w-auto shrink-0" />
          {site.name}
        </p>
        <p className="font-mono text-xs text-muted">
          © {new Date().getFullYear()} · Built with Next.js
        </p>
      </div>
    </footer>
  )
}
