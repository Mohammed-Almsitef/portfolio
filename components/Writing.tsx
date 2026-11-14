import Link from 'next/link'
import { getPosts } from '@/lib/content'
import { t, type Locale } from '@/lib/locale'
import Section from './Section'
import { CARD_SURFACE } from '@/lib/styles'

/** The latest notes on the home page, linking to the full Writing index. */
export default async function Writing({ title, locale = 'en' }: { title: string; locale?: Locale }) {
  const posts = (await getPosts()).slice(0, 3)
  if (posts.length === 0) return null

  return (
    <Section id="writing" title={title}>
      <ul className="grid gap-5 md:grid-cols-3">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/writing/${p.slug}`}
              className={`glow-border group flex h-full flex-col p-6 ${CARD_SURFACE}`}
            >
              <p className="flex items-center gap-2 text-xs text-muted">
                <time dateTime={p.date}>{formatDate(p.date)}</time>
                {p.draft && <DraftBadge />}
              </p>
              <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-accent">
                {p.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-body">{p.summary}</p>
              <span className="mt-5 text-sm font-medium text-accent">
                {t(locale, 'readPost')} <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/writing" className="tap mt-8 text-sm font-medium text-muted transition-colors hover:text-accent">
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
