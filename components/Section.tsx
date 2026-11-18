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
      <div className="relative mx-auto max-w-page px-6 py-8 md:py-12">
        <Reveal>
          <header className="mb-8 md:mb-10">
            <div>
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
