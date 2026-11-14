import { getEducation, getExperience, getPublications } from '@/lib/content'
import Section from './Section'
import { outbound } from '@/lib/links'
import { t, type Locale } from '@/lib/locale'
import { BLOCK_HEADING, CARD_SURFACE } from '@/lib/styles'
import ExternalGlyph from './ExternalGlyph'

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className={`${BLOCK_HEADING} text-accent`}>{children}</h3>
}

/**
 * A line of the record: what it was, then when.
 *
 * The date follows the label rather than being pushed to the column's far edge,
 * where a wide screen strands it a foot away from what it dates. Baseline
 * alignment keeps the small mono date sitting on the same line as the name even
 * when the label wraps to two.
 */
function Entry({ when, children }: { when: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      {children}
      <span className="font-mono text-xs text-muted">{when}</span>
    </li>
  )
}

export default async function Experience({
  title,
  locale = 'en',
}: {
  title: string
  locale?: Locale
}) {
  const [experience, education, publications] = await Promise.all([
    getExperience(locale),
    getEducation(locale),
    getPublications(locale),
  ])

  return (
    <Section id="experience" title={title}>
      <ol className="space-y-14">
        {experience.map((job) => (
          <li key={`${job.company}-${job.period}`} className="relative">

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h3 className="text-xl font-semibold tracking-tight">
                {job.role} <span className="font-normal text-muted">·</span>{' '}
                {job.companyUrl ? (
                  <a
                    {...outbound(job.companyUrl)}
                    className="tap-inline text-accent underline-offset-4 hover:underline"
                  >
                    {job.company}
                  </a>
                ) : (
                  <span className="text-accent">{job.company}</span>
                )}
              </h3>
              <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-muted">
                {job.period}
              </span>
            </div>

            <p className="mt-3 max-w-3xl text-lg text-body">{job.description}</p>

            <ul className="mt-6 max-w-3xl space-y-3.5">
              {job.highlights.map((h, i) => (
                <li key={i} className="flex gap-3 text-[0.9375rem] leading-relaxed text-body">
                  <span
                    aria-hidden="true"
                    className="mt-[0.6rem] h-px w-3 shrink-0 bg-accent"
                  />
                  {h}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      {education.length > 0 && (
        <div className="mt-20">
          <SubHeading>{t(locale, 'education')}</SubHeading>
          <ul className="grid gap-4 md:grid-cols-2">
            {education.map((e) => {
              const [institution, ...rest] = e.school.split(' · ')
              return (
                <li key={e.degree} className={`glow-border p-6 ${CARD_SURFACE}`}>
                  <p className="font-mono text-xs text-muted">{e.period}</p>
                  <p className="mt-2 font-semibold tracking-tight">{e.degree}</p>
                  <p className="mt-1.5 text-sm text-body">
                    <span className="text-accent">{institution}</span>
                    {rest.length > 0 && <span className="block text-muted">{rest.join(' · ')}</span>}
                  </p>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {publications.length > 0 && (
        <div className="mt-16">
          <SubHeading>{t(locale, 'publications')}</SubHeading>
          <ul className="space-y-4">
            {publications.map((p) => (
              <Entry key={p.title} when={p.year}>
                <span className="max-w-2xl">
                  <a
                    {...outbound(p.url)}
                    className="tap font-medium underline-offset-4 transition-colors hover:text-accent hover:underline"
                  >
                    {p.title} <ExternalGlyph />
                  </a>
                  <span className="block text-sm text-muted">{p.venue}</span>
                </span>
              </Entry>
            ))}
          </ul>
        </div>
      )}

    </Section>
  )
}
