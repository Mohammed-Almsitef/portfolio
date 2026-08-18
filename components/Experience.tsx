import { getEducation, getExperience, getPublications, getSite } from '@/lib/content'
import Section from './Section'
import { outbound } from '@/lib/links'
import { t, type Locale } from '@/lib/locale'

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mono-label mb-5 font-mono text-xs uppercase tracking-[0.2em] text-accent">{children}</h3>
  )
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
  const [experience, education, publications, site] = await Promise.all([
    getExperience(locale),
    getEducation(locale),
    getPublications(locale),
    getSite(locale),
  ])

  return (
    <Section id="experience" title={title} tone="raised">
      <ol className="relative space-y-12 border-s border-border ps-8">
        {experience.map((job) => (
          <li key={`${job.company}-${job.period}`} className="relative">
            <span
              aria-hidden="true"
              className="absolute -start-[2.19rem] top-2 size-2.5 rounded-full border border-border-strong bg-bg"
            />

            {/* No `justify-between`: the period sits directly after the company
                rather than being pushed to the far edge of the column. */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-lg font-medium tracking-tight">
                {job.role} <span className="text-muted">·</span>{' '}
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
              <span className="font-mono text-xs text-muted">{job.period}</span>
            </div>

            <p className="mt-2 text-sm text-muted">{job.description}</p>

            <ul className="mt-4 space-y-2.5">
              {job.highlights.map((h, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-body">
                  <span
                    aria-hidden="true"
                    className="mt-[0.55rem] size-1 shrink-0 rounded-full bg-accent-dim"
                  />
                  {h}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      {education.length > 0 && (
        <div className="mt-16">
          <SubHeading>{t(locale, 'education')}</SubHeading>
          <ul className="space-y-3">
            {education.map((e) => {
              const [institution, ...rest] = e.school.split(',')
              return (
                <Entry key={e.degree} when={e.period}>
                  <span>
                    <span className="font-medium">{e.degree}</span>
                    <span className="text-muted">
                      {' · '}
                      <span className="text-accent">{institution}</span>
                      {rest.length > 0 ? `,${rest.join(',')}` : ''}
                    </span>
                  </span>
                </Entry>
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
                    {p.title} <span aria-hidden="true">↗</span>
                  </a>
                  <span className="block text-sm text-muted">{p.venue}</span>
                </span>
              </Entry>
            ))}
          </ul>
        </div>
      )}

      <a
        href={site.resumeUrl}
        data-print-hide
        className="mt-12 inline-block rounded-md border border-border-strong px-5 py-2.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
      >
        {t(locale, 'downloadResume')}
      </a>
    </Section>
  )
}
