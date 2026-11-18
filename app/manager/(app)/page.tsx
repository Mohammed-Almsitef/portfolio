import Link from 'next/link'
import { redirect } from 'next/navigation'
import { gateStatus, isSignedIn } from '@/lib/manager/auth'
import { editPath } from '@/lib/manager/editPath'
import { managerSummary, type Attention } from '@/lib/manager/summary'
import { NAVIGATION, type ManagerLang } from '@/lib/manager/lang'

/** Rendered per request: it reports live state (drafts, protection). */
export const dynamic = 'force-dynamic'

/** What each menu item holds, keyed by its English name (the Arabic key adds 'Ar'). */
const ITEMS: Record<string, { title: string; detail: string }> = {
  about: { title: 'About', detail: 'Bio, photo, headline figures' },
  projects: { title: 'Projects', detail: 'Case studies, diagrams, covers' },
  skills: { title: 'Skills', detail: 'Groups and evidence links' },
  experience: { title: 'Experience', detail: 'Roles and highlights' },
  teaching: { title: 'Teaching', detail: 'Courses and material' },
  openSource: { title: 'Open source', detail: 'Contributions to other projects' },
  posts: { title: 'Writing', detail: 'Posts and drafts (English only)' },
  contact: { title: 'Contact section', detail: 'Pitch, timezone, form' },
  site: { title: 'Name, role & CV', detail: 'Tagline, location, CV, SEO' },
  socials: { title: 'Social links', detail: 'GitHub, LinkedIn, …' },
  education: { title: 'Education', detail: 'Degrees and programmes' },
  publications: { title: 'Publications', detail: 'Papers and talks' },
  sections: { title: 'Section order', detail: 'Order, headings, visibility' },
  appearance: { title: 'Appearance', detail: 'Default theme (both sites)' },
  uiText: { title: 'Interface text', detail: 'Buttons, labels, demo, 404' },
  arabicSettings: { title: 'Publish the Arabic site', detail: 'Turn /ar on or off' },
}
const COLLECTIONS = new Set(['projects', 'projectsAr', 'posts'])

function editLinks(lang: ManagerLang) {
  return Object.entries(NAVIGATION[lang]).map(([group, keys]) => ({
    group,
    items: keys.map((key) => {
      const base = key.endsWith('Ar') ? key.slice(0, -2) : key
      return { key, href: editPath(`/${COLLECTIONS.has(key) ? 'collection' : 'singleton'}/${key}`), ...ITEMS[base] }
    }),
  }))
}

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

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang: ManagerLang = (await searchParams).lang === 'ar' ? 'ar' : 'en'
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
            <span className="size-2 rounded-full bg-[rgb(var(--tone-status))]" aria-hidden="true" />
            {host}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">Overview</h1>
          <p className="mt-2 text-body">What is on the site, and what still needs you.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="/" target="_blank" rel="noopener" className="btn-ghost rounded-xl px-5 py-2.5 text-sm font-medium">
            View site ↗
          </a>
          <Link href={editPath()} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold">
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
          href={editPath('/collection/projects')}
        />
        <Stat
          label="Writing"
          value={`${s.stats.posts.published}`}
          sub={`published · ${s.stats.posts.drafts} draft${s.stats.posts.drafts === 1 ? '' : 's'}`}
          href={editPath('/collection/posts')}
        />
        <Stat
          label="Sections on the page"
          value={`${s.stats.sections.shown}`}
          sub={s.stats.sections.hidden ? `${s.stats.sections.hidden} hidden` : 'none hidden'}
          href={editPath('/singleton/sections')}
        />
        <Stat
          label="Arabic site"
          value={s.arabicLive ? 'Live' : 'Off'}
          sub={s.arabicLive ? `${s.arabicSections} sections at /ar` : 'not published'}
          href={editPath('/singleton/arabicSettings')}
        />
      </section>

      {/* Content, grouped like the editor's menu, one language at a time */}
      <section aria-labelledby="content">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="content" className="text-lg font-semibold tracking-tight">
            Content
          </h2>
          <div role="group" aria-label="Content language" className="inline-flex rounded-full border border-border bg-surface p-0.5 text-xs font-semibold">
            {(['en', 'ar'] as const).map((l) => (
              <Link
                key={l}
                href={l === 'en' ? '/manager' : '/manager?lang=ar'}
                aria-current={lang === l ? 'true' : undefined}
                lang={l}
                className={`rounded-full px-3.5 py-1.5 transition-colors ${
                  lang === l ? 'bg-accent text-bg' : 'text-muted hover:text-text'
                }`}
              >
                {l === 'en' ? 'English' : 'العربية'}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-5 space-y-7">
          {editLinks(lang).map(({ group, items }) => (
            <div key={group}>
              <h3 className="text-xs font-medium text-muted">{group}</h3>
              <ul className="mt-2.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((e) => (
                  <li key={e.key}>
                    <Link
                      href={e.href}
                      className="group flex h-full items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 transition-colors hover:border-accent/60"
                    >
                      <span>
                        <span className="block text-sm font-medium transition-colors group-hover:text-accent">{e.title}</span>
                        <span className="mt-0.5 block text-xs text-muted">{e.detail}</span>
                      </span>
                      <span aria-hidden="true" className="text-muted">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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
            <Link href={editPath('/collection/posts/create')} className="text-sm font-medium text-accent hover:underline">
              New post
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
            {s.recentPosts.map((p) => (
              <li key={p.slug}>
                <Link
                  href={editPath(`/collection/posts/item/${p.slug}`)}
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

      {/* Content health */}
      <section aria-labelledby="health">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="health" className="text-lg font-semibold tracking-tight">Content health</h2>
          <p className="text-sm text-muted">What each case study has. Hover a gap for what to add.</p>
        </div>
        <div className="relative mt-4 overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-start text-xs text-muted">
                <th scope="col" className="px-5 py-3 text-start font-medium">Project</th>
                {s.health[0]?.checks.map((c) => (
                  <th key={c.key} scope="col" className="px-2 py-3 text-center font-medium">
                    {c.label}
                  </th>
                ))}
                <th scope="col" className="px-5 py-3 text-end font-medium">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {s.health.map((p) => {
                const done = p.checks.filter((c) => c.ok).length
                return (
                  <tr key={p.slug} className="transition-colors hover:bg-border/25">
                    <th scope="row" className="px-5 py-3.5 text-start font-medium">
                      <span className="flex items-center gap-2.5">
                        {p.title}
                        {!p.visible && (
                          <span className="rounded-full border border-border px-1.5 py-px text-[0.65rem] font-medium text-muted">
                            Hidden
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block h-1 w-24 overflow-hidden rounded-full bg-border">
                        <span
                          className="block h-full rounded-full bg-accent"
                          style={{ width: `${(done / p.checks.length) * 100}%` }}
                        />
                      </span>
                    </th>
                    {p.checks.map((c) => (
                      <td key={c.key} className="px-2 py-3.5 text-center">
                        {c.ok ? (
                          <span className="text-[rgb(var(--tone-status))]" aria-label={`${c.label}: done`}>
                            ✓
                          </span>
                        ) : (
                          <span title={c.hint} aria-label={`${c.label}: missing. ${c.hint}`} className="cursor-help text-muted">
                            –
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-5 py-3.5 text-end">
                      <Link href={p.href} className="text-sm font-medium text-accent hover:underline">
                        Edit
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  )
}
