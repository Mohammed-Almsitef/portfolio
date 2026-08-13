import { getSkillGroups } from '@/lib/content'
import Section from './Section'
import type { Locale } from '@/lib/locale'

export default async function Skills({
  title,
  index,
  locale = 'en',
}: {
  title: string
  index: string
  locale?: Locale
}) {
  const groups = await getSkillGroups(locale)

  return (
    <Section id="skills" title={title} index={index}>
      <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <div
            key={g.title}
            // The tone is resolved per theme by globals.css; only the variable
            // reference is dynamic, so no Tailwind class is built at runtime.
            style={{ '--tone': `var(--tone-${g.tone})` } as React.CSSProperties}
            className="group border-s-2 border-[rgb(var(--tone)/0.45)] ps-5 transition-colors duration-300 hover:border-[rgb(var(--tone))]"
          >
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-tight">
              <span
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-full bg-[rgb(var(--tone))]"
              />
              {g.title}
            </h3>
            <ul className="space-y-2">
              {g.items.map((item) => (
                <li key={item} className="font-mono text-[0.8125rem] leading-relaxed text-muted">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  )
}
