import 'server-only'

import { createReader } from '@keystatic/core/reader'
import keystaticConfig from '@/keystatic.config'
import { gateStatus } from './auth'

/**
 * Everything the manager's Overview shows, read straight from content/ —
 * drafts and hidden items included, which the public loaders filter out.
 */
const reader = createReader(process.cwd(), keystaticConfig)

export type Attention = {
  tone: 'critical' | 'warning' | 'info'
  title: string
  detail: string
  href: string
  action: string
}

export async function managerSummary() {
  const [projects, posts, sections, sectionsAr, contact, teaching, socials, site, arabic, gate] =
    await Promise.all([
      reader.collections.projects.all(),
      reader.collections.posts.all(),
      reader.singletons.sections.read(),
      reader.singletons.sectionsAr.read(),
      reader.singletons.contact.read(),
      reader.singletons.teaching.read(),
      reader.singletons.socials.read(),
      reader.singletons.site.read(),
      reader.singletons.arabicSettings.read(),
      gateStatus(),
    ])

  const visibleProjects = projects.filter((p) => p.entry.visible !== false)
  const published = posts.filter((p) => p.entry.published)
  const drafts = posts.filter((p) => !p.entry.published)
  const order = sections?.order ?? []
  const shownSections = order.filter((s) => s.visible !== false)
  const hiddenSections = order.filter((s) => s.visible === false)
  const teachingHidden = hiddenSections.some((s) => s.key === 'teaching')
  const hiddenSocials = (socials?.items ?? []).filter((s) => s.visible === false && s.href)
  const noMedia = visibleProjects.filter((p) => !p.entry.image && !p.entry.clip && !p.entry.videoUrl)

  const attention: Attention[] = []
  // Only meaningful where the manager is reachable from the internet.
  if (gate.protection === 'open' && process.env.VERCEL_ENV === 'production') {
    attention.push({
      tone: 'critical',
      title: 'The manager has no password',
      detail: 'Anyone with the link can open it. Set MANAGER_PASSWORD in Vercel, or a password under Account.',
      href: '/manager/account',
      action: 'Account',
    })
  }
  if (drafts.length) {
    attention.push({
      tone: 'warning',
      title: `${drafts.length} draft post${drafts.length > 1 ? 's' : ''} waiting`,
      detail: 'Drafts show on preview deploys only. Review them and tick Published to put them live.',
      href: '/keystatic/collection/posts',
      action: 'Review drafts',
    })
  }
  if (teachingHidden || !teaching?.organisation) {
    attention.push({
      tone: 'warning',
      title: 'Teaching section is not live',
      detail: !teaching?.organisation
        ? 'Add the organisation, period and your role, then tick Teaching under Sections.'
        : 'It is filled in but hidden. Tick Teaching under Sections to show it.',
      href: !teaching?.organisation ? '/keystatic/singleton/teaching' : '/keystatic/singleton/sections',
      action: !teaching?.organisation ? 'Fill in Teaching' : 'Open Sections',
    })
  }
  if (noMedia.length) {
    attention.push({
      tone: 'info',
      title: `${noMedia.length} of ${visibleProjects.length} projects use generated covers`,
      detail: 'A real photo or a short clip is the strongest upgrade a case study can get.',
      href: '/keystatic/collection/projects',
      action: 'Add media',
    })
  }
  if (!contact?.formspreeId) {
    attention.push({
      tone: 'info',
      title: 'Contact form is off',
      detail: 'Paste a Formspree form ID under Contact to show a message form. Email works without it.',
      href: '/keystatic/singleton/contact',
      action: 'Set up',
    })
  }
  if (hiddenSocials.length) {
    attention.push({
      tone: 'info',
      title: `${hiddenSocials.length} contact links hidden`,
      detail: hiddenSocials.map((s) => s.label).join(', ') + ' are saved but not shown on the site.',
      href: '/keystatic/singleton/socials',
      action: 'Review',
    })
  }

  return {
    siteName: site?.name ?? 'Portfolio',
    siteUrl: site?.url || 'https://mohammedalmsitef.me',
    protection: gate.protection,
    arabicLive: arabic?.enabled === true,
    arabicSections: (sectionsAr?.order ?? []).filter((s) => s.visible !== false).length,
    stats: {
      projects: { shown: visibleProjects.length, total: projects.length },
      posts: { published: published.length, drafts: drafts.length },
      sections: { shown: shownSections.length, hidden: hiddenSections.length },
    },
    recentPosts: [...posts]
      .sort((a, b) => (b.entry.date ?? '').localeCompare(a.entry.date ?? ''))
      .slice(0, 4)
      .map((p) => ({ slug: p.slug, title: p.entry.title, date: p.entry.date ?? '', draft: !p.entry.published })),
    attention,
  }
}
