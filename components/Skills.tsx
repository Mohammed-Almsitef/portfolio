import Link from 'next/link'
import { getProjects, getSkillGroups } from '@/lib/content'
import Section from './Section'
import { localePath, t, type Locale } from '@/lib/locale'
import { CARD_SURFACE } from '@/lib/styles'

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
      <ul className="skills-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => {
          const evidence = g.projects.map((s) => bySlug.get(s)).filter((p) => p !== undefined)
          return (
            <li
              key={g.title}
              // The tone is resolved per theme by globals.css; only the variable
              // reference is dynamic, so no Tailwind class is built at runtime.
              style={{ '--tone': `var(--tone-${g.tone})` } as React.CSSProperties}
              className={`glow-border group flex flex-col p-6 ${CARD_SURFACE} transition-colors duration-200`}
            >
              <h3 className="flex items-center gap-2.5 font-semibold tracking-tight">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-sm bg-[rgb(var(--tone))]"
                />
                {g.title}
              </h3>
              <ul className="mb-5 mt-5 flex flex-wrap content-start gap-2">
                {g.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-bg/50 px-2.5 py-1 text-[0.8125rem] text-body"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              {evidence.length > 0 && (
                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-border pt-4 text-xs text-muted">
                  <span>{t(locale, 'usedIn')}</span>
                  {evidence.map((p, i) => (
                    <span key={p.slug}>
                      <Link
                        href={localePath(locale, `/projects/${p.slug}`)}
                        className="font-medium text-body underline-offset-4 transition-colors hover:text-accent hover:underline"
                      >
                        {p.shortTitle}
                      </Link>
                      {i < evidence.length - 1 && <span aria-hidden="true">,</span>}
                    </span>
                  ))}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

