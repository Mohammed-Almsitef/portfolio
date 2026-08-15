import { getSite } from '@/lib/content'
import LidarBackdrop from './LidarBackdrop'
import Reveal from './Reveal'
import RobotField from './RobotField'
import type { Locale } from '@/lib/locale'

export default async function Hero({ locale = 'en' }: { locale?: Locale }) {
  const site = await getSite(locale)
  const domains = site.domains

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

      <div className="relative z-2 mx-auto flex min-h-[90svh] max-w-page justify-between items-center px-6 pb-24 pt-32 md:pb-32 md:pt-40">

        <div className='md:max-w-2xl w-full md:text-start text-center flex flex-col justify-center md:justify-start'>
          <Reveal delay={60}>
            <h1 className="text-gradient max-w-3xl text-[clamp(2.75rem,7.5vw,5rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
              {site.name}
            </h1>
            <p className="mt-3 text-lg font-medium text-accent">
              {site.role}
            </p>
          </Reveal>

          <Reveal delay={140}>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-body md:text-xl text-justify">
              {site.tagline}
              Lorem ipsum, dolor sit amet consectetur adipisicing elit. Aut sequi minima est totam sunt sed inventore aliquam tempora. Quae quis fugit excepturi tempora corrupti aut placeat nulla ea quidem exercitationem?
            </p>
          </Reveal>

          {/* <Reveal delay={200}>
            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Areas of expertise">
              {domains.map((d) => (
                <li
                  key={d}
                  className="rounded-full border border-border bg-surface/50 px-3 py-1 font-mono text-xs text-muted backdrop-blur-sm"
                >
                  {d}
                </li>
              ))}
            </ul>
          </Reveal> */}

          <Reveal delay={260}>
            <div className="mt-10 flex justify-center md:justify-start gap-3 text-center">
              <a
                href="#projects"
                className="md:max-w-fit flex-1 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg shadow-[0_6px_24px_-10px_var(--btn-glow)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                View my work
              </a>
              <a
                href="#contact"
                className="md:max-w-fit flex-1 rounded-lg border border-border-strong bg-bg/40 px-5 py-2.5 text-sm font-medium backdrop-blur-sm transition-colors duration-200 hover:border-accent hover:text-accent"
              >
                Get in touch
              </a>
            </div>
          </Reveal>
        </div>
      </div>

    </section>
  )
}
