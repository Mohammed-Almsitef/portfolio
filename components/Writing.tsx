import Link from 'next/link'
import { getPosts } from '@/lib/content'
import { t, type Locale } from '@/lib/locale'
import Section from './Section'

/** The latest notes on the home page, linking to the full Writing index. */
export default async function Writing({ title, locale = 'en' }: { title: string; locale?: Locale }) {
  const posts = (await getPosts()).slice(0, 3)
  if (posts.length === 0) return null

  return (
    <Section id="writing" title={title}>
      <ul className="divide-y divide-border border-y border-border">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/writing/${p.slug}`}
              className="group grid gap-2 py-7 md:grid-cols-[9rem_minmax(0,1fr)_auto] md:items-baseline md:gap-8"
            >
              <p className="flex items-center gap-2 font-mono text-xs text-muted">
                <time dateTime={p.date}>{formatDate(p.date)}</time>
              </p>
              <div>
                <h3 className="font-display text-2xl leading-snug decoration-1 underline-offset-[0.18em] group-hover:underline md:text-[1.75rem]">
                  {p.title}
                </h3>
                <p className="mt-2 max-w-2xl leading-relaxed text-body">{p.summary}</p>
              </div>
              <span className="flex items-center gap-3 text-sm font-medium">
                {p.draft && <DraftBadge />}
                <span>
                  {t(locale, 'readPost')}{' '}
                  <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/writing" className="ed-link mt-8 inline-block text-sm font-medium">
        {t(locale, 'allPosts')} <span aria-hidden="true" className="ms-1">→</span>
      </Link>
    </Section>
  )
}

export function formatDate(iso: string) {
  if (!iso) return ''
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function DraftBadge() {
  return (
    <span className="rounded-full border border-[rgb(var(--tone-amber)/0.5)] px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-[rgb(var(--tone-amber))]">
      Draft
    </span>
  )
}
