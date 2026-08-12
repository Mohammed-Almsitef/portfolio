import { domains, site } from '@/data/content'
import LidarBackdrop from './LidarBackdrop'
import Reveal from './Reveal'

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <LidarBackdrop />

      {/* Soft glow anchoring the headline, so the hero has depth rather than
          being flat black behind text. */}
      <div
        aria-hidden="true"
        data-print-hide
        className="pointer-events-none absolute -left-40 -top-40 size-[38rem] rounded-full bg-[radial-gradient(circle,var(--glow),transparent_68%)] blur-2xl"
      />

      <div className="relative z-2 mx-auto flex min-h-[90svh] max-w-5xl flex-col justify-center px-6 pb-24 pt-32 md:pb-32 md:pt-40">
        <Reveal>
          {site.availableForWork && (
            <p className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface/70 px-3.5 py-1.5 font-mono text-xs text-body backdrop-blur-sm">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[rgb(var(--tone-status))] opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[rgb(var(--tone-status))]" />
              </span>
              Available for work
            </p>
          )}
        </Reveal>

        <Reveal delay={60}>
          <h1 className="text-gradient max-w-3xl text-[clamp(2.75rem,7.5vw,5rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
            {site.name}
          </h1>
          <p className="mt-5 font-mono text-sm tracking-tight text-accent md:text-base">
            {site.role}
          </p>
        </Reveal>

        <Reveal delay={140}>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-body md:text-xl">
            {site.tagline}
          </p>
        </Reveal>

        <Reveal delay={200}>
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
        </Reveal>

        <Reveal delay={260}>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="#projects"
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg shadow-[0_6px_24px_-10px_var(--btn-glow)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              View my work
            </a>
            <a
              href="#contact"
              className="rounded-lg border border-border-strong bg-bg/40 px-5 py-2.5 text-sm font-medium backdrop-blur-sm transition-colors duration-200 hover:border-accent hover:text-accent"
            >
              Get in touch
            </a>
          </div>
        </Reveal>

      </div>

      <a
        href="#about"
        aria-label="Scroll to about section"
        data-print-hide
        className="animate-drift absolute inset-x-0 bottom-8 z-2 mx-auto hidden size-8 w-fit items-center justify-center px-3 font-mono text-xs text-muted transition-colors hover:text-accent md:inline-flex"
      >
        ↓
      </a>
    </section>
  )
}
