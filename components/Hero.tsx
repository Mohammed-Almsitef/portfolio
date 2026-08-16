import { getSite } from '@/lib/content'
import LidarBackdrop from './LidarBackdrop'
import Reveal from './Reveal'
import RobotField from './RobotField'
import { t, type Locale } from '@/lib/locale'

export default async function Hero({ locale = 'en' }: { locale?: Locale }) {
  const site = await getSite(locale)

  return (
    <section id="top" className="relative overflow-hidden">
      <LidarBackdrop />

      {/* Fewer here — the hero already has the scan carrying it. */}
      <RobotField seed="hero" count={4} />

      {/* Soft glow anchoring the headline, so the hero has depth rather than
          being flat black behind text. */}
      <div
        aria-hidden="true"
        data-print-hide
        className="pointer-events-none absolute -start-40 -top-40 size-[38rem] rounded-full bg-[radial-gradient(circle,var(--glow),transparent_68%)] blur-2xl"
      />

      <div className="relative z-2 mx-auto flex min-h-[90svh] max-w-page items-center px-6 pb-24 pt-32 md:pb-32 md:pt-40">
        <div className="flex w-full flex-col justify-center text-center md:max-w-2xl md:justify-start md:text-start">
          <Reveal delay={60}>
            <h1 className="text-gradient max-w-3xl text-[clamp(2.75rem,7.5vw,5rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
              {site.name}
            </h1>
            <p className="mt-3 text-lg font-medium text-accent">{site.role}</p>
          </Reveal>

          <Reveal delay={140}>
            <p className="mt-7 max-w-2xl text-justify text-lg leading-relaxed text-body md:text-xl">
              {site.tagline}
            </p>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-10 flex justify-center gap-3 text-center md:justify-start">
              <a
                href="#projects"
                className="flex-1 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg shadow-[0_6px_24px_-10px_var(--btn-glow)] transition-transform duration-200 hover:-translate-y-0.5 md:max-w-fit"
              >
                {t(locale, 'viewMyWork')}
              </a>
              <a
                href="#contact"
                className="flex-1 rounded-lg border border-border-strong bg-bg/40 px-5 py-2.5 text-sm font-medium backdrop-blur-sm transition-colors duration-200 hover:border-accent hover:text-accent md:max-w-fit"
              >
                {t(locale, 'getInTouch')}
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
