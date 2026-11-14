import Reveal from './Reveal'

export default function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string
  /** Heading text, set per section in the manager. */
  title: string
  /** Optional one-line lead under the heading. */
  intro?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="section relative"
    >
      <div className="relative mx-auto max-w-page px-6 py-10 md:py-16">
        <Reveal>
          <header className="mb-10 md:mb-12">
            <div>
              {/* The number comes from a CSS counter on <main>, so it follows
                  the order set in the manager without any prop plumbing. */}
              <p aria-hidden="true" className="section-index font-mono text-sm text-accent" />
              <h2
                id={`${id}-heading`}
                className="mt-2 text-[clamp(2rem,4.4vw,3rem)] font-semibold leading-tight tracking-[-0.035em]"
              >
                {title}
              </h2>
              {intro && <p className="mt-3 max-w-2xl text-body">{intro}</p>}
            </div>
          </header>
        </Reveal>

        <Reveal delay={90}>{children}</Reveal>
      </div>
    </section>
  )
}
