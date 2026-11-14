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
      <div className="relative mx-auto max-w-page px-6 py-16 md:py-24">
        <Reveal>
          <header className="mb-12 md:mb-14">
            <div>
              {/* The number comes from a CSS counter on <main>, so it follows
                  the order set in the manager without any prop plumbing. */}
              <p aria-hidden="true" className="section-index glass inline-flex rounded-full px-3 py-1 font-mono text-xs text-accent" />
              <h2
                id={`${id}-heading`}
                className="text-gradient mt-2 w-fit text-[clamp(2rem,4.4vw,3rem)] font-semibold leading-tight tracking-[-0.035em]"
              >
                {title}
              </h2>
              {intro && <p className="mt-3 max-w-2xl text-body">{intro}</p>}
              <div aria-hidden="true" className="hairline mt-6 max-w-md" />
            </div>
          </header>
        </Reveal>

        <Reveal delay={90}>{children}</Reveal>
      </div>
    </section>
  )
}
