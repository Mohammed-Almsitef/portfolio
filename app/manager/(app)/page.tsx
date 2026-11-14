import Link from 'next/link'
import { redirect } from 'next/navigation'
import { gateStatus, isSignedIn } from '@/lib/manager/auth'
import { managerSummary, type Attention } from '@/lib/manager/summary'

/** Rendered per request: it reports live state (drafts, protection). */
export const dynamic = 'force-dynamic'

const EDIT = [
  { href: '/keystatic/collection/projects', title: 'Projects', detail: 'Case studies, diagrams, covers' },
  { href: '/keystatic/collection/posts', title: 'Writing', detail: 'Posts and drafts' },
  { href: '/keystatic/singleton/about', title: 'About', detail: 'Bio, photo, headline figures' },
  { href: '/keystatic/singleton/experience', title: 'Experience', detail: 'Roles and highlights' },
  { href: '/keystatic/singleton/skills', title: 'Skills', detail: 'Groups and evidence links' },
  { href: '/keystatic/singleton/teaching', title: 'Teaching', detail: 'Courses and material' },
  { href: '/keystatic/singleton/contact', title: 'Contact', detail: 'Pitch, timezone, form' },
  { href: '/keystatic/singleton/site', title: 'Site & SEO', detail: 'Name, role, tagline, CV' },
  { href: '/keystatic/singleton/sections', title: 'Sections', detail: 'Order and visibility' },
  { href: '/keystatic/singleton/appearance', title: 'Appearance', detail: 'Default theme, accent' },
  { href: '/keystatic/singleton/aboutAr', title: 'Arabic site', detail: 'The /ar version' },
  { href: '/keystatic/singleton/socials', title: 'Contact links', detail: 'GitHub, LinkedIn, …' },
]

const TONE: Record<Attention['tone'], { dot: string; ring: string; label: string }> = {
  critical: { dot: 'bg-[rgb(var(--tone-rose))]', ring: 'border-[rgb(var(--tone-rose)/0.45)]', label: 'Action needed' },
  warning: { dot: 'bg-[rgb(var(--tone-amber))]', ring: 'border-border', label: 'To do' },
  info: { dot: 'bg-[rgb(var(--accent-tone))]', ring: 'border-border', label: 'Suggestion' },
}

function Stat({ label, value, sub, href }: { label: string; value: string; sub: string; href: string }) {
  return (
    <Link href={href} className="group rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-strong">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted">{sub}</p>
    </Link>
  )
}

export default async function OverviewPage() {
  const gate = await gateStatus()
  if (gate.protection === 'required' && !(await isSignedIn())) redirect('/manager/login?from=/manager')

  const s = await managerSummary()
  const host = s.siteUrl.replace(/^https?:\/\//, '')

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[rgb(var(--tone-status))] opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-[rgb(var(--tone-status))]" />
            </span>
            {host}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">Overview</h1>
          <p className="mt-2 text-body">What is on the site, and what still needs you.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="/" target="_blank" rel="noopener" className="btn-ghost rounded-xl px-5 py-2.5 text-sm font-medium">
            View site ↗
          </a>
          <Link href="/keystatic" className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold">
            Edit content
          </Link>
        </div>
      </div>

      {/* Figures */}
      <section aria-label="At a glance" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat
          label="Projects"
          value={`${s.stats.projects.shown}`}
          sub={s.stats.projects.total > s.stats.projects.shown ? `${s.stats.projects.total - s.stats.projects.shown} hidden` : 'all visible'}
          href="/keystatic/collection/projects"
        />
        <Stat
          label="Writing"
          value={`${s.stats.posts.published}`}
          sub={`published · ${s.stats.posts.drafts} draft${s.stats.posts.drafts === 1 ? '' : 's'}`}
          href="/keystatic/collection/posts"
        />
        <Stat
          label="Sections on the page"
          value={`${s.stats.sections.shown}`}
          sub={s.stats.sections.hidden ? `${s.stats.sections.hidden} hidden` : 'none hidden'}
          href="/keystatic/singleton/sections"
        />
        <Stat
          label="Arabic site"
          value={s.arabicLive ? 'Live' : 'Off'}
          sub={s.arabicLive ? `${s.arabicSections} sections at /ar` : 'not published'}
          href="/keystatic/singleton/arabicSettings"
        />
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Needs attention */}
        <section aria-labelledby="attention">
          <h2 id="attention" className="text-lg font-semibold tracking-tight">
            Needs attention
            <span className="ms-2 rounded-full bg-border/60 px-2 py-0.5 text-xs font-medium text-muted">
              {s.attention.length}
            </span>
          </h2>
          {s.attention.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-border bg-surface p-6 text-sm text-body">
              Nothing waiting. Everything on the site is set up.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {s.attention.map((a) => (
                <li key={a.title} className={`flex flex-wrap items-start gap-x-4 gap-y-3 rounded-2xl border bg-surface p-5 ${TONE[a.tone].ring}`}>
                  <span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-full ${TONE[a.tone].dot}`} />
                  <div className="min-w-0 flex-1 basis-52">
                    <p className="font-medium">
                      <span className="sr-only">{TONE[a.tone].label}: </span>
                      {a.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{a.detail}</p>
                  </div>
                  <Link
                    href={a.href}
                    className="ms-6 shrink-0 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent sm:ms-0"
                  >
                    {a.action}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent writing */}
        <section aria-labelledby="recent">
          <div className="flex items-center justify-between">
            <h2 id="recent" className="text-lg font-semibold tracking-tight">Recent writing</h2>
            <Link href="/keystatic/collection/posts/create" className="text-sm font-medium text-accent hover:underline">
              New post
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
            {s.recentPosts.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/keystatic/collection/posts/item/${p.slug}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-border/30"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{p.title}</span>
                    <span className="mt-0.5 block text-xs text-muted">{p.date}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[0.68rem] font-medium uppercase tracking-wider ${
                      p.draft
                        ? 'border border-[rgb(var(--tone-amber)/0.5)] text-[rgb(var(--tone-amber))]'
                        : 'border border-[rgb(var(--tone-status)/0.5)] text-[rgb(var(--tone-status))]'
                    }`}
                  >
                    {p.draft ? 'Draft' : 'Live'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Quick edit */}
      <section aria-labelledby="edit">
        <h2 id="edit" className="text-lg font-semibold tracking-tight">Edit</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {EDIT.map((e) => (
            <li key={e.href}>
              <Link
                href={e.href}
                className="group flex h-full items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 transition-colors hover:border-accent/60"
              >
                <span>
                  <span className="block text-sm font-medium transition-colors group-hover:text-accent">{e.title}</span>
                  <span className="mt-0.5 block text-xs text-muted">{e.detail}</span>
                </span>
                <span aria-hidden="true" className="text-muted transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
