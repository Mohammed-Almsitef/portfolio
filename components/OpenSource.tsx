import { getOpenSource } from '@/lib/content'
import Section from './Section'
import type { Locale } from '@/lib/locale'

export default async function OpenSource({
  title,
  locale = 'en',
}: {
  title: string
  locale?: Locale
}) {
  const { intro, items } = await getOpenSource(locale)

  return (
    <Section id="open-source" title={title} tone="raised">
      {intro && <p className="mb-10 max-w-2xl leading-relaxed text-body">{intro}</p>}

      <ul className="space-y-4">
        {items.map((c) => (
          <li
            key={`${c.project}-${c.what}`}
            style={{ '--tone': `var(--tone-${c.tone})` } as React.CSSProperties}
            className="group rounded-xl border border-border bg-surface p-6 shadow-[var(--card-shadow)] transition-colors duration-300 hover:border-[rgb(var(--tone)/0.45)]"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-lg font-medium tracking-tight">
                <a
                  href={c.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-inline text-[rgb(var(--tone))] underline-offset-4 hover:underline"
                >
                  {c.project}
                </a>
                <span className="text-muted"> · </span>
                {c.what}
              </h3>
              <span className="font-mono text-xs text-muted">{c.status}</span>
            </div>

            <p className="mt-3 leading-relaxed text-body">{c.detail}</p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <ul className="flex flex-wrap gap-2" aria-label="Technologies used">
                {c.tags.map((t) => (
                  <li
                    key={t}
                    className="rounded-md border border-[rgb(var(--tone)/0.25)] bg-bg/50 px-2 py-1 font-mono text-xs text-muted"
                  >
                    {t}
                  </li>
                ))}
              </ul>
              {c.prUrl && (
                <a
                  href={c.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap gap-1 font-mono text-xs text-muted underline-offset-4 transition-colors hover:text-text hover:underline"
                >
                  View the pull request <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}
