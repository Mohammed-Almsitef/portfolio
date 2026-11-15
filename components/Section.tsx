import Reveal from './Reveal'

/**
 * Editorial section: a hairline across the top, the section number and title
 * in a left column (sticky on wide screens, so the label stays with you as
 * the content scrolls), content on the right.
 */
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
    <section id={id} aria-labelledby={`${id}-heading`} className="section relative">
      <div className="mx-auto max-w-page px-6">
        <div className="grid gap-8 border-t border-border py-14 md:py-20 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14">
          <header className="lg:sticky lg:top-28 lg:self-start">
            {/* Numbered by a CSS counter, following the manager's order. */}
            <p aria-hidden="true" className="section-index kicker" />
            <h2 id={`${id}-heading`} className="font-display mt-2 text-[clamp(2.25rem,4.5vw,3.25rem)] leading-[1.02]">
              {title}
            </h2>
            <span aria-hidden="true" className="rule-accent mt-5" />
            {intro && <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">{intro}</p>}
          </header>
          <Reveal className="min-w-0">{children}</Reveal>
        </div>
      </div>
    </section>
  )
}
