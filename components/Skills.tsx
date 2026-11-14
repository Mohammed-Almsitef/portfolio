import { getSkillGroups } from '@/lib/content'
import Section from './Section'
import type { Locale } from '@/lib/locale'
import { CARD_SURFACE, CARD_TONE_WASH } from '@/lib/styles'

export default async function Skills({
  title,
  locale = 'en',
}: {
  title: string
  locale?: Locale
}) {
  const groups = await getSkillGroups(locale)

  return (
    <Section id="skills" title={title}>
      <ul className="skills-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <li
            key={g.title}
            // The tone is resolved per theme by globals.css; only the variable
            // reference is dynamic, so no Tailwind class is built at runtime.
            style={{ '--tone': `var(--tone-${g.tone})` } as React.CSSProperties}
            className={`glow-border group p-6 ${CARD_SURFACE} ${CARD_TONE_WASH} transition-colors duration-300 hover:border-[rgb(var(--tone)/0.45)]`}
          >
            <h3 className="flex items-center gap-2.5 font-semibold tracking-tight">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-sm bg-[rgb(var(--tone))] shadow-[0_0_10px_rgb(var(--tone)/0.6)]"
              />
              {g.title}
            </h3>
            <ul className="mt-5 flex flex-wrap gap-2">
              {g.items.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-border bg-bg/50 px-2.5 py-1 text-[0.8125rem] text-body transition-colors group-hover:border-[rgb(var(--tone)/0.3)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Section>
  )
}
