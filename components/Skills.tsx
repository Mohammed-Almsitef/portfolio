import Link from 'next/link'
import { getProjects, getSkillGroups } from '@/lib/content'
import Section from './Section'
import { localePath, t, type Locale } from '@/lib/locale'

export default async function Skills({
  title,
  locale = 'en',
}: {
  title: string
  locale?: Locale
}) {
  const [groups, projects] = await Promise.all([getSkillGroups(locale), getProjects(locale)])
  // Only visible projects can be linked, and in their manager order.
  const bySlug = new Map(projects.map((p) => [p.slug, p]))

  return (
    <Section id="skills" title={title}>
      {/* An editorial index: group name in the serif, skills as a plain
          line, and the projects that prove them. */}
      <dl className="divide-y divide-border border-y border-border">
        {groups.map((g) => {
          const evidence = g.projects.map((s) => bySlug.get(s)).filter((p) => p !== undefined)
          return (
            <div key={g.title} className="grid gap-3 py-7 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-10">
              <dt className="font-display text-xl leading-tight">{g.title}</dt>
              <dd>
                <p className="leading-relaxed text-body">{g.items.join(' · ')}</p>
                {evidence.length > 0 && (
                  <p className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-sm text-muted">
                    <span>{t(locale, 'usedIn')}</span>
                    {evidence.map((p, i) => (
                      <span key={p.slug}>
                        <Link href={localePath(locale, `/projects/${p.slug}`)} className="ed-link text-text">
                          {p.shortTitle}
                        </Link>
                        {i < evidence.length - 1 && <span aria-hidden="true">,</span>}
                      </span>
                    ))}
                  </p>
                )}
              </dd>
            </div>
          )
        })}
      </dl>
    </Section>
  )
}

