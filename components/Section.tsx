import Reveal from './Reveal'
import SectionRule from './SectionRule'

export default function Section({
  id,
  title,
  index,
  tone = 'base',
  children,
}: {
  id: string
  /** Heading text, set per section in the manager. */
  title: string
  /** Running number, derived from the section's position. */
  index: string
  /** Alternating grounds give the page chapters instead of one long column. */
  tone?: 'base' | 'raised'
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={tone === 'raised' ? 'bg-surface/45' : ''}
    >
      <SectionRule />

      <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <Reveal>
          <div className="mb-12 flex items-center gap-4">
            <span aria-hidden="true" className="font-mono text-xs text-accent-dim">
              {index}
            </span>
            <h2
              id={`${id}-heading`}
              className="font-mono text-xs uppercase tracking-[0.2em] text-accent"
            >
              {title}
            </h2>
            <span aria-hidden="true" className="rule-fade h-px flex-1" />
          </div>
        </Reveal>

        <Reveal delay={90}>{children}</Reveal>
      </div>
    </section>
  )
}
