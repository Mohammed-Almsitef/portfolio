import { getAbout, getExperience, getSite } from '@/lib/content'
import CountUp from './CountUp'
import Reveal from './Reveal'
import SlamViewport, { type SlamLabels } from './SlamViewport'
import { t, type Locale } from '@/lib/locale'

/**
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

  const labels: SlamLabels = {
    title: t(locale, 'simTitle'),
    hint: t(locale, 'simHint'),
    aria: t(locale, 'simAria'),
    newMap: t(locale, 'newMap'),
    map: t(locale, 'mapLabel'),
    modes: {
      exploring: t(locale, 'modeExploring'),
      navigating: t(locale, 'modeNavigating'),
      reached: t(locale, 'modeReached'),
      complete: t(locale, 'modeComplete'),
      unreachable: t(locale, 'modeUnreachable'),
    },
  }

  return (
    <section id="top" className="hero relative overflow-hidden">
      {/* Blueprint grid fading out from the top, and one soft accent glow. */}
      <div aria-hidden="true" data-print-hide className="hero-grid pointer-events-none absolute inset-0" />

      <div className="relative z-2 mx-auto grid max-w-page items-center gap-12 px-6 pb-20 pt-28 md:pt-36 lg:min-h-[92svh] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14 lg:pb-24">
        <div>
          {current && (
            <Reveal>
              <p className="glass mono-label inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full px-3.5 py-1.5 font-mono text-[0.7rem] text-muted">
                <span className="text-accent">{t(locale, 'currently')}</span>
                <span aria-hidden="true">·</span>
                <span className="text-text">
                  {current.role} {t(locale, 'at')} {current.company}
                </span>
              </p>
            </Reveal>
          )}

          <Reveal delay={60}>
            <h1 className="text-gradient mt-6 text-[clamp(2.75rem,6vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.04em]">
              {site.name}
            </h1>
            <p className="mt-4 text-lg font-medium text-accent md:text-xl">{site.role}</p>
          </Reveal>

          <Reveal delay={140}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-body">{site.tagline}</p>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#projects"
                className="btn-primary rounded-xl px-6 py-3 text-sm font-semibold"
              >
                {t(locale, 'viewMyWork')}
              </a>
              <a
                href="#contact"
                className="btn-ghost rounded-xl px-6 py-3 text-sm font-medium"
              >
                {t(locale, 'getInTouch')}
              </a>
              {site.resumeUrl && (
                <a
                  href={site.resumeUrl}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:text-accent"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />
                  </svg>
                  {t(locale, 'resume')}
                </a>
              )}
            </div>
          </Reveal>

          {/* Proof, not adjectives: the headline figures sit right under the
              claim. Edited in the manager under About → Headline figures. */}
          {about.stats.length > 0 && (
            <Reveal delay={320}>
              <dl className="glass mt-12 grid max-w-xl grid-cols-3 divide-x divide-border rounded-2xl rtl:divide-x-reverse">
                {about.stats.map((st) => (
                  <div key={st.label} className="px-5 py-4">
                    <dd dir="ltr" className="text-gradient w-fit text-2xl font-semibold tracking-tight tabular-nums md:text-3xl">
                      <CountUp value={st.value} />
                    </dd>
                    <dt className="mt-1 text-xs leading-snug text-muted">{st.label}</dt>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
        </div>

        <Reveal delay={180} className="min-w-0">
          <div data-print-hide className="panel-halo">
            <SlamViewport labels={labels} />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
