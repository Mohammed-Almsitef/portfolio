import Reveal from './Reveal'
import RobotField from './RobotField'
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
      className={`relative overflow-hidden ${tone === 'raised' ? 'bg-surface' : ''}`}
    >
      {/* <SectionRule /> */}

      {/* Seeded by id, so each section scatters differently but stably. */}
      <RobotField seed={id} tone={tone} />

      {/* Positioned, so the content paints above the absolute field. */}
      <div className="relative mx-auto max-w-page px-6 py-10 md:py-15">
        <Reveal>
          <div className="relative mb-12 flex items-center gap-4">
            <h2
              id={`${id}-heading`}
              className={`relative z-10 mx-auto border-x-2 border-border-strong px-5 font-mono text-3xl font-bold uppercase tracking-[0.2em] text-accent shadow-[0_0_20px_-6px_rgb(var(--tone-blue)/0.4)] ${tone === 'raised' ? 'bg-surface' : 'bg-bg'}`}
            >
              {title}
            </h2>
            <span aria-hidden="true" className="section-title-rule absolute h-px w-full" />
          </div>
        </Reveal>

        <Reveal delay={90}>{children}</Reveal>
      </div>
    </section>
  )
}
