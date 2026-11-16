import { getAbout, getExperience, getSite } from '@/lib/content'
import SlamViewport from './SlamViewport'
import { simLabels } from '@/lib/simLabels'
import { localePath, t, type Locale } from '@/lib/locale'

/**
 * The hero does not use the scroll reveal: it is the first paint, and hiding
 * it until JavaScript runs pushed Largest Contentful Paint past 5 s. It gets a
 * CSS-only entrance (`.hero-in`) that moves but never hides.
 *
 * Name, claim and proof side by side: the copy says what I build, and the
 * viewport beside it shows a robot doing it — exploring, mapping and planning
 * live in the browser, steerable with a click.
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
    <section id="top" className="hero relative overflow-hidden">
      {/* Blueprint grid fading out from the top, and one soft accent glow. */}
      <div aria-hidden="true" data-print-hide className="hero-grid pointer-events-none absolute inset-0" />

      {/* Desktop: copy and figures on the left, the simulation on the right.
          Phone: copy, then the simulation, then the figures, so the demo is
          not pushed below three rows of numbers. */}
      <div className="hero-layout relative z-2 mx-auto grid max-w-page items-center gap-x-14 gap-y-10 px-6 pb-20 pt-28 md:pt-36 lg:min-h-[92svh] lg:pb-24">
        <div className="[grid-area:copy]">
          {current && (
            <div className="hero-in">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                <span className="size-1.5 shrink-0 rounded-full bg-[rgb(var(--tone-status))]" aria-hidden="true" />
                <span>{t(locale, 'currently')}</span>
                <span className="text-text">
                  {current.role} {t(locale, 'at')} {current.company}
                </span>
              </p>
              {/* Its own line, so a wrap never strands a separator. */}
              {site.workPreference && <p className="mt-1 ps-3.5 text-sm text-muted">{site.workPreference}</p>}
            </div>
          )}

          <div className="hero-in" style={{ '--d': '60ms' } as React.CSSProperties}>
            <h1 className="mt-5 text-[clamp(2.75rem,6vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.04em]">
              {site.name}
            </h1>
            <p className="mt-4 text-lg font-medium text-accent md:text-xl">{site.role}</p>
          </div>

          <div className="hero-in" style={{ '--d': '140ms' } as React.CSSProperties}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-body">{site.tagline}</p>
          </div>

          {/* One primary action (the work), one secondary (the CV, which is
              what a recruiter wants), and contact as a quieter link. */}
          <div className="hero-in" style={{ '--d': '220ms' } as React.CSSProperties}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <a href="#projects" className="btn-primary rounded-xl px-6 py-3 text-center text-sm font-semibold">
                {t(locale, 'viewMyWork')}
              </a>
              {site.resumeUrl && (
                <a
                  href={site.resumeUrl}
                  className="btn-ghost inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />
                  </svg>
                  {t(locale, 'downloadCv')}
                  <span className="text-xs font-normal text-muted">{t(locale, 'cvMeta')}</span>
                </a>
              )}
              <a
                href="#contact"
                className="tap justify-center px-2 text-sm font-medium text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
              >
                {t(locale, 'getInTouch')} <span aria-hidden="true" className="ms-1 rtl:-scale-x-100">→</span>
              </a>
            </div>
          </div>
        </div>

        {/* Proof, not adjectives. Edited in the manager under About →
            Headline figures. Rows on a phone, a strip on wider screens. */}
        {about.stats.length > 0 && (
          <div className="hero-in [grid-area:stats] lg:self-start" style={{ '--d': '300ms' } as React.CSSProperties}>
            <dl className="grid max-w-xl divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
              {about.stats.map((st) => (
                <div key={st.label} className="flex items-center gap-4 py-3.5 sm:block sm:px-5 sm:py-4 sm:first:ps-0">
                  <dd dir="ltr" className="w-fit shrink-0 text-2xl font-semibold tracking-tight tabular-nums text-text md:text-3xl">
                    {st.value}
                  </dd>
                  <dt className="text-sm leading-snug text-muted sm:mt-1 sm:text-xs">{st.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="hero-in min-w-0 [grid-area:sim]" style={{ '--d': '180ms' } as React.CSSProperties}>
          <div data-print-hide className="panel-halo">
            <SlamViewport labels={labels} />
          </div>
          <p data-print-hide className="mt-4 text-center text-sm text-muted">
            {t(locale, 'simCaption')}{' '}
            <a href={localePath(locale, '/demo')} className="font-medium text-accent underline-offset-4 hover:underline">
              {t(locale, 'tryDemo')} <span aria-hidden="true" className="inline-block rtl:-scale-x-100">→</span>
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
