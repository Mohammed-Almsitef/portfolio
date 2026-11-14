import { getTeaching } from '@/lib/content'
import Section from './Section'
import type { Locale } from '@/lib/locale'
import { CARD_SURFACE } from '@/lib/styles'

/** Courses designed and material written for students. */
export default async function Teaching({ title, locale = 'en' }: { title: string; locale?: Locale }) {
  const d = await getTeaching(locale)
  if (!d || d.items.length === 0) return null
  const meta = [d.role, d.organisation, d.period].filter(Boolean).join(' · ')

  return (
    <Section id="teaching" title={title}>
      <div className="max-w-3xl">
        {meta && <p className="text-sm font-medium text-accent">{meta}</p>}
        {d.intro && <p className="mt-3 text-lg leading-relaxed text-body">{d.intro}</p>}
      </div>
      <ul className="mt-10 grid gap-4 md:grid-cols-2">
        {d.items.map((i) => (
          <li key={i.title} className={`glow-border flex flex-col p-6 ${CARD_SURFACE}`}>
            <h3 className="font-semibold tracking-tight">{i.title}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-body">{i.detail}</p>
            {i.tags.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {i.tags.map((t) => (
                  <li key={t} className="rounded-md border border-border bg-bg/50 px-2.5 py-1 text-xs text-muted">
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </Section>
  )
}
