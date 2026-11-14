import { getExperience, getSite } from '@/lib/content'
import Reveal from './Reveal'
import SlamViewport, { type SlamLabels } from './SlamViewport'
import { t, type Locale } from '@/lib/locale'

/**
 * Name, claim and proof side by side: the copy says what I build, and the
 * viewport beside it shows a robot doing it — exploring, mapping and planning
 * live in the browser, steerable with a click.
 */
export default async function Hero({ locale = 'en' }: { locale?: Locale }) {
  const [site, jobs] = await Promise.all([getSite(locale), getExperience(locale)])
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
      <div
        aria-hidden="true"
        data-print-hide
        className="pointer-events-none absolute -end-40 top-10 size-[44rem] rounded-full bg-[radial-gradient(circle,var(--glow),transparent_65%)] blur-2xl"
      />

      <div className="relative z-2 mx-auto grid max-w-page items-center gap-12 px-6 pb-20 pt-28 md:pt-36 lg:min-h-[92svh] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14 lg:pb-24">
        <div>
          {current && (
            <Reveal>
              <p className="mono-label inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-border bg-surface/70 px-3 py-1 font-mono text-[0.7rem] text-muted backdrop-blur-sm">
                <span className="text-accent">{t(locale, 'currently')}</span>
                <span aria-hidden="true">·</span>
                <span className="text-text">
                  {current.role} {t(locale, 'at')} {current.company}
                </span>
              </p>
            </Reveal>
          )}

          <Reveal delay={60}>
            <h1 className="text-gradient mt-6 text-[clamp(2.75rem,6.6vw,5.25rem)] font-semibold leading-[0.98] tracking-[-0.04em]">
              {site.name}
            </h1>
            <p className="mt-4 text-lg font-medium text-accent md:text-xl">{site.role}</p>
          </Reveal>

          <Reveal delay={140}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-body">{site.tagline}</p>
          </Reveal>

          {site.domains.length > 0 && (
            <Reveal delay={200}>
              <ul className="mt-7 flex max-w-xl flex-wrap gap-2">
                {site.domains.map((d) => (
                  <li
                    key={d}
                    className="rounded-md border border-border bg-surface/60 px-2.5 py-1 font-mono text-[0.72rem] text-muted"
                  >
                    {d}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          <Reveal delay={260}>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#projects"
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg shadow-[0_8px_28px_-10px_var(--btn-glow)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                {t(locale, 'viewMyWork')}
              </a>
              <a
                href="#contact"
                className="rounded-lg border border-border-strong bg-bg/40 px-5 py-2.5 text-sm font-medium backdrop-blur-sm transition-colors duration-200 hover:border-accent hover:text-accent"
              >
                {t(locale, 'getInTouch')}
              </a>
              {site.resumeUrl && (
                <a
                  href={site.resumeUrl}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
                >
                  {t(locale, 'downloadResume')}
                </a>
              )}
            </div>
          </Reveal>
        </div>

        <Reveal delay={180} className="min-w-0">
          <div data-print-hide>
            <SlamViewport labels={labels} />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
