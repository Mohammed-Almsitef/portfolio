import { getSections, getSite, getSocials } from '@/lib/content'
import Logo from './Logo'
import SocialIcon from './SocialIcon'
import { outbound } from '@/lib/links'
import { localePath, t, type Locale } from '@/lib/locale'
import { EYEBROW } from '@/lib/styles'

/** Section keys whose DOM id differs from the key itself. */
const ID: Record<string, string> = { openSource: 'open-source' }

/**
 * A full footer: who this is in a line, where to go on the page, where to find
 * me elsewhere, and the résumé — the last things a reader looks for before
 * leaving, all in one place.
 */
export default async function Footer({ locale = 'en' }: { locale?: Locale }) {
  const [site, sections, socials] = await Promise.all([
    getSite(locale),
    getSections(locale),
    getSocials(locale),
  ])
  const home = localePath(locale)
  const anchor = (key: string) => `${home === '/' ? '' : home}/#${ID[key] ?? key}`

  return (
    <footer data-print-hide className="border-t border-border">
      <div className="mx-auto max-w-page px-6 pt-16">
        <a
          href={`mailto:${site.email}`}
          className="font-display t-hero block w-fit decoration-1 underline-offset-[0.12em] hover:underline"
        >
          {t(locale, 'getInTouch')} <span aria-hidden="true" className="inline-block rtl:-scale-x-100">→</span>
        </a>
      </div>
      <div className="mx-auto grid max-w-page gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <a href={home} className="inline-flex items-center gap-2.5 text-[0.9375rem] font-semibold tracking-tight">
            <Logo id="footer-logo" weight="small" className="h-8 w-auto shrink-0" />
            {site.name}
          </a>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{t(locale, 'footerLine')}</p>
          <a
            href={`mailto:${site.email}`}
            className="tap mt-4 text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            {site.email}
          </a>
        </div>

        <nav aria-label={t(locale, 'sitemap')}>
          <h2 className={EYEBROW}>{t(locale, 'sitemap')}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {sections.map((s) => (
              <li key={s.key}>
                <a href={anchor(s.key)} className="tap text-body transition-colors hover:text-accent">
                  {s.label}
                </a>
              </li>
            ))}
            {site.resumeUrl && (
              <li>
                <a href={site.resumeUrl} className="tap text-body transition-colors hover:text-accent">
                  {t(locale, 'resume')}
                </a>
              </li>
            )}
          </ul>
        </nav>

        {socials.length > 0 && (
          <div>
            <h2 className={EYEBROW}>{t(locale, 'elsewhere')}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {socials.slice(0, 5).map((s) => (
                <li key={s.href}>
                  <a
                    {...outbound(s.href)}
                    className="tap gap-2.5 text-body transition-colors hover:text-accent"
                  >
                    <SocialIcon platform={s.platform} className="size-4 text-muted" />
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-3 py-5 ps-6 pe-20 text-xs text-muted">
          <p>
            © {new Date().getFullYear()} {site.name}. {t(locale, 'allRights')}
          </p>
          <p dir="ltr">{site.location}</p>
        </div>
      </div>
    </footer>
  )
}
