import { getEducation, getExperience, getPublications, getSite } from '@/lib/content'
import Section from './Section'
import type { Locale } from '@/lib/locale'

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-accent">{children}</h3>
  )
}

export default async function Experience({ title, index, locale = 'en' }: { title: string; index: string; locale?: Locale }) {
  const [experience, education, publications, site] = await Promise.all([
    getExperience(locale),
    getEducation(),
    getPublications(),
    getSite(locale),
  ])

  return (
    <Section id="experience" title={title} index={index} tone="raised">
      <ol className="relative space-y-12 border-s border-border ps-8">
        {experience.map((job) => (
          <li key={`${job.company}-${job.period}`} className="relative">
            <span
              aria-hidden="true"
              className="absolute -start-[2.19rem] top-2 size-2.5 rounded-full border border-border-strong bg-bg"
            />

            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-lg font-medium tracking-tight">
                {job.role} <span className="text-muted">·</span>{' '}
                {job.companyUrl ? (
                  <a
                    href={job.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
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
          <SubHeading>Education</SubHeading>
          <ul className="space-y-3">
            {education.map((e) => (
              <li key={e.degree} className="flex flex-wrap items-baseline justify-between gap-x-4">
                <span>
                  <span className="font-medium">{e.degree}</span>
                  <span className="text-muted"> · {e.school}</span>
                </span>
                <span className="font-mono text-xs text-muted">{e.period}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {publications.length > 0 && (
        <div className="mt-16">
          <SubHeading>Publications</SubHeading>
          <ul className="space-y-4">
            {publications.map((p) => (
              <li key={p.title} className="flex flex-wrap items-baseline justify-between gap-x-4">
                <span className="max-w-2xl">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap font-medium underline-offset-4 transition-colors hover:text-accent hover:underline"
                  >
                    {p.title} <span aria-hidden="true">↗</span>
                  </a>
                  <span className="block text-sm text-muted">{p.venue}</span>
                </span>
                <span className="font-mono text-xs text-muted">{p.year}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <a
        href={site.resumeUrl}
        data-print-hide
        className="mt-12 inline-block rounded-md border border-border-strong px-5 py-2.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
      >
        Download full résumé
      </a>
    </Section>
  )
}
