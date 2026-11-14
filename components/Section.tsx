import Reveal from './Reveal'

export default function Section({
  id,
  title,
  tone = 'base',
  intro,
  children,
}: {
  id: string
  /** Heading text, set per section in the manager. */
  title: string
  /** Alternating grounds give the page chapters instead of one long column. */
  tone?: 'base' | 'raised'
  /** Optional one-line lead under the heading. */
  intro?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`section relative ${tone === 'raised' ? 'bg-surface/60' : ''}`}
    >
      <div className="relative mx-auto max-w-page px-6 py-16 md:py-24">
        <Reveal>
          <header className="mb-12 flex items-end justify-between gap-6 border-b border-border pb-5 md:mb-14">
            <div>
              {/* The number comes from a CSS counter on <main>, so it follows
                  the order set in the manager without any prop plumbing. */}
              <p aria-hidden="true" className="section-index font-mono text-xs text-accent" />
              <h2
                id={`${id}-heading`}
                className="mt-2 text-[clamp(1.9rem,4vw,2.75rem)] font-semibold leading-tight tracking-[-0.03em]"
              >
                {title}
              </h2>
              {intro && <p className="mt-3 max-w-2xl text-body">{intro}</p>}
            </div>
            <span aria-hidden="true" dir="ltr" className="hidden pb-1.5 font-mono text-xs text-muted sm:block">
              /{id.replace('-', '_')}
            </span>
          </header>
        </Reveal>

        <Reveal delay={90}>{children}</Reveal>
      </div>
    </section>
  )
}
