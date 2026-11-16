import { getAbout, getExperience, getSite } from '@/lib/content'
import CountUp from './CountUp'
import SlamViewport from './SlamViewport'
import { simLabels } from '@/lib/simLabels'
import { localePath, t, type Locale } from '@/lib/locale'

/**
 * Editorial hero: the name set large in the serif, the role in italic, the
 * claim and actions beneath, and the live robot demo presented as a captioned
 * figure — evidence, not decoration.
 *
 * No scroll reveal here (it is the first paint); `.hero-in` only moves.
 */
export default async function Hero({ locale = 'en' }: { locale?: Locale }) {
  const [site, jobs, about] = await Promise.all([
    getSite(locale),
    getExperience(locale),
    getAbout(locale),
  ])
  const current = jobs[0]
  const labels = simLabels(locale)

  return (
    <section id="top" className="relative">
      <div className="mx-auto max-w-page px-6 pb-16 pt-32 md:pb-24 md:pt-40">
        {current && (
          <p className="hero-in flex flex-wrap items-center gap-x-2 text-sm text-muted">
            <span className="relative flex size-1.5 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[rgb(var(--tone-status))] opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[rgb(var(--tone-status))]" />
            </span>
            {t(locale, 'currently')} {current.role} {t(locale, 'at')} {current.company}
          </p>
        )}

        <h1
          className="hero-in font-display t-hero mt-6"
          style={{ '--d': '60ms' } as React.CSSProperties}
        >
          {site.name}
        </h1>
        <p
          className="hero-in t-3 mt-4 font-medium text-muted"
          style={{ '--d': '100ms' } as React.CSSProperties}
        >
          {site.role}
        </p>

        <div className="mt-14 grid gap-12 border-t border-border pt-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="hero-in" style={{ '--d': '160ms' } as React.CSSProperties}>
            <p className="t-lead text-body">{site.tagline}</p>

            {/* One primary action, the CV beside it, contact as a quiet link. */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <a href="#projects" className="btn-primary rounded-full px-6 py-3 text-center text-sm font-medium">
                {t(locale, 'viewMyWork')}
              </a>
              {site.resumeUrl && (
                <a
                  href={site.resumeUrl}
                  className="btn-ghost inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium"
                >
                  {t(locale, 'downloadCv')}
                  <span className="text-xs text-muted">{t(locale, 'cvMeta')}</span>
                </a>
              )}
              <a href="#contact" className="ed-link px-2 text-center text-sm font-medium text-body sm:text-start">
                {t(locale, 'getInTouch')}
              </a>
            </div>

            {/* Proof, as a fact strip. Edited under About → Headline figures. */}
            {about.stats.length > 0 && (
              <dl className="mt-12 grid grid-cols-3 border-t border-border">
                {about.stats.map((st) => (
                  <div key={st.label} className="border-e border-border py-5 pe-4 last:border-e-0 [&:not(:first-child)]:ps-4">
                    <dd dir="ltr" className="font-display t-1 w-fit tabular-nums">
                      <CountUp value={st.value} />
                    </dd>
                    <dt className="mt-2 text-xs leading-snug text-muted">{st.label}</dt>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <figure className="hero-in min-w-0" style={{ '--d': '220ms' } as React.CSSProperties}>
            <div data-print-hide className="paper">
              <SlamViewport labels={labels} />
            </div>
            <figcaption className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-muted">
              <span className="font-display text-base italic text-text">Fig. 1</span>
              <span>{t(locale, 'simCaption')}</span>
              <a href={localePath(locale, '/demo')} className="ed-link font-medium text-text">
                {t(locale, 'tryDemo')}
              </a>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
