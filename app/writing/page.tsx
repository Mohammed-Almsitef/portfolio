import type { Metadata } from 'next'
import Link from 'next/link'
import Aurora from '@/components/Aurora'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'
import { DraftBadge, formatDate } from '@/components/Writing'
import { getPosts, getSite } from '@/lib/content'
import { t } from '@/lib/locale'

export const metadata: Metadata = {
  title: t('en', 'writingKicker'),
  description: t('en', 'writingIntro'),
  alternates: { canonical: '/writing' },
}

export default async function WritingIndex() {
  const [posts, site] = await Promise.all([getPosts(), getSite()])
  return (
    <div>
      <Aurora />
      <header data-print-hide className="sticky top-0 z-40 border-b border-border bg-bg/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" aria-label={site.name} className="tap items-center gap-2.5 text-[0.9375rem] font-semibold tracking-tight hover:text-accent">
            <Logo id="writing-logo" weight="medium" className="h-9 w-auto shrink-0" />
            <span className="hidden sm:inline">{site.name}</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main id="main" className="mx-auto max-w-3xl px-6 pb-24 pt-14 md:pt-20">
        <p className="font-mono text-sm text-accent">{t('en', 'writingKicker')}</p>
        <h1 className="mt-3 text-[clamp(2.1rem,5vw,3rem)] font-semibold leading-tight tracking-[-0.035em]">
          {t('en', 'writingTitle')}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-body">
          {t('en', 'writingIntro')}
        </p>
        <ul className="mt-12 divide-y divide-border border-y border-border">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link href={`/writing/${p.slug}`} className="group block py-7">
                <p className="flex items-center gap-2 text-xs text-muted">
                  <time dateTime={p.date}>{formatDate(p.date)}</time>
                  {p.draft && <DraftBadge />}
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight transition-colors group-hover:text-accent">
                  {p.title}
                </h2>
                <p className="mt-2 leading-relaxed text-body">{p.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  )
}
