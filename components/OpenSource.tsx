import { getOpenSource } from '@/lib/content'
import Section from './Section'
import TagList from './TagList'
import ExternalGlyph from './ExternalGlyph'
import { outbound } from '@/lib/links'
import { t, type Locale } from '@/lib/locale'

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
            {/* The status reads as part of the heading, so it sits with it. */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-lg font-medium tracking-tight">
                <a
                  {...outbound(c.projectUrl)}
                  className="tap-inline text-[rgb(var(--tone))] underline-offset-4 hover:underline"
                >
                  {c.project}
                </a>
                <span className="text-muted"> · </span>
                {c.what}
              </h3>
              <span className="mono-label font-mono text-xs text-muted">{c.status}</span>
            </div>

            <p className="mt-3 leading-relaxed text-body">{c.detail}</p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <TagList tags={c.tags} locale={locale} />
              {c.prUrl && (
                <a
                  {...outbound(c.prUrl)}
                  className="mono-label tap gap-1 font-mono text-xs text-muted underline-offset-4 transition-colors hover:text-text hover:underline"
                >
                  {t(locale, 'viewPullRequest')} <ExternalGlyph />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}
