import 'server-only'

import { createReader } from '@keystatic/core/reader'
import keystaticConfig from '@/keystatic.config'
import type { VisualKind } from '@/components/ProjectVisual'
import type { Locale } from './locale'

/**
 * The one place the site reads its content.
 *
 * Everything comes from the JSON files under content/, which the manager at
 * /keystatic writes. Components stay presentational and never touch the
 * reader directly.
 *
 * Hidden items are filtered out *here* rather than in each component, so a
 * `visible: false` toggle can't be honoured in one place and forgotten in
 * another.
 */
const reader = createReader(process.cwd(), keystaticConfig)

export type Tone =
  'blue' | 'violet' | 'purple' | 'cyan' | 'rose' | 'emerald' | 'amber' | 'teal' | 'lime'

export type SectionKey = 'about' | 'projects' | 'openSource' | 'skills' | 'experience' | 'contact'

const shown = <T extends { visible?: boolean }>(items: readonly T[]) =>
  items.filter((i) => i.visible !== false)

/**
 * Arabic is stored as overrides, not a second site.
 *
 * Every getter below merges field by field, so anything left untranslated
 * shows its English text rather than a gap. That makes the Arabic page safe to
 * publish while it is still half written, and lets technical prose stay in
 * English — which is how it is written in robotics anyway.
 */
async function overrides() {
  return reader.singletons.arabic.readOrThrow()
}

/** The override if it has actual text in it, otherwise the English. */
function pick(override: string | null | undefined, fallback: string): string {
  const value = override?.trim()
  return value ? value : fallback
}

/** Same, for lists: a translated list replaces the English one only if filled. */
function pickList(override: readonly string[] | undefined, fallback: readonly string[]): string[] {
  const value = override?.filter((v) => v.trim())
  return value && value.length ? [...value] : [...fallback]
}

/** Whether /ar should be reachable at all. */
export async function arabicEnabled(): Promise<boolean> {
  return (await overrides()).enabled === true
}

export async function getSite(locale: Locale = 'en') {
  const site = await reader.singletons.site.readOrThrow()
  const base = {
    ...site,
    // URL fields are nullable in the schema, but metadata and the sitemap need
    // a definite origin — fall back rather than emitting "null" into tags.
    url: site.url || 'https://mohammedalmsitef.me',
    domains: [...site.domains],
  }
  if (locale === 'en') return base

  const ar = await overrides()
  return {
    ...base,
    name: pick(ar.name, base.name),
    role: pick(ar.role, base.role),
    tagline: pick(ar.tagline, base.tagline),
    location: pick(ar.location, base.location),
    domains: pickList(ar.domains, base.domains),
  }
}

export async function getSocials() {
  const { items } = await reader.singletons.socials.readOrThrow()
  return shown(items).map((s) => ({ label: s.label, href: s.href ?? '#' }))
}

export async function getAbout(locale: Locale = 'en') {
  const about = await reader.singletons.about.readOrThrow()
  const base = {
    photo: about.photo ?? '/profile.jpg',
    paragraphs: [...about.paragraphs],
    stats: about.stats.map((s) => ({ value: s.value, label: s.label })),
  }
  if (locale === 'en') return base

  const ar = await overrides()
  return {
    ...base,
    paragraphs: pickList(ar.aboutParagraphs, base.paragraphs),
    // Figures are numerals and stay put; only their captions translate, matched
    // by position so the two lists cannot drift apart.
    stats: base.stats.map((stat, i) => ({
      ...stat,
      label: pick(ar.statLabels[i], stat.label),
    })),
  }
}

export async function getSkillGroups() {
  const { groups } = await reader.singletons.skills.readOrThrow()
  return shown(groups).map((g) => ({
    title: g.title,
    tone: g.tone as Tone,
    items: [...g.items],
  }))
}

export async function getExperience(locale: Locale = 'en') {
  const { jobs } = await reader.singletons.experience.readOrThrow()
  const base = shown(jobs).map((j) => ({
    role: j.role,
    company: j.company,
    companyUrl: j.companyUrl || undefined,
    period: j.period,
    description: j.description,
    highlights: [...j.highlights],
  }))
  if (locale === 'en') return base

  // Matched on company name rather than position, so reordering jobs in the
  // manager cannot silently attach a translation to the wrong role.
  const ar = await overrides()
  return base.map((job) => {
    const tr = ar.experience.find((e) => e.company.trim() === job.company.trim())
    return tr
      ? {
          ...job,
          role: pick(tr.role, job.role),
          description: pick(tr.description, job.description),
        }
      : job
  })
}

export async function getEducation() {
  const { items } = await reader.singletons.education.readOrThrow()
  return shown(items).map((e) => ({
    degree: e.degree,
    school: e.school,
    period: e.period,
  }))
}

export async function getPublications() {
  const { items } = await reader.singletons.publications.readOrThrow()
  return shown(items).map((p) => ({
    title: p.title,
    venue: p.venue,
    year: p.year,
    url: p.url ?? '#',
  }))
}

export async function getOpenSource() {
  const os = await reader.singletons.openSource.readOrThrow()
  return {
    intro: os.intro,
    items: shown(os.items).map((c) => ({
      project: c.project,
      projectUrl: c.projectUrl ?? '#',
      what: c.what,
      detail: c.detail,
      status: c.status,
      prUrl: c.prUrl || undefined,
      tone: c.tone as Tone,
      tags: [...c.tags],
    })),
  }
}

export type Project = {
  slug: string
  title: string
  year: string
  featured: boolean
  tone: Tone
  visual: VisualKind
  /** Self-hosted silent loop. Outranks the image and the generated art. */
  clip?: string
  image?: string
  summary: string
  problem: string
  solution: string
  how: string[]
  testing?: string
  results: string[]
  lessons: string[]
  role?: string
  tags: string[]
  repoUrl?: string
  videoUrl?: string
  liveUrl?: string
}

export async function getProjects(locale: Locale = 'en'): Promise<Project[]> {
  const entries = await reader.collections.projects.all()

  // `order` is nullable in the schema — an entry saved without one sorts last
  // rather than throwing or jumping to the front.
  const rank = (o: number | null) => o ?? Number.MAX_SAFE_INTEGER

  const base = entries
    .filter((e) => e.entry.visible !== false)
    .sort((a, b) => rank(a.entry.order) - rank(b.entry.order))
    .map(({ slug, entry }) => ({
      slug,
      title: entry.title,
      year: entry.year,
      featured: entry.featured,
      tone: entry.tone as Tone,
      visual: entry.visual as VisualKind,
      clip: entry.clip ?? undefined,
      image: entry.image ?? undefined,
      summary: entry.summary,
      problem: entry.problem,
      solution: entry.solution,
      how: [...entry.how],
      testing: entry.testing || undefined,
      results: [...entry.results],
      lessons: [...entry.lessons],
      role: entry.role || undefined,
      tags: [...entry.tags],
      repoUrl: entry.repoUrl || undefined,
      videoUrl: entry.videoUrl || undefined,
      liveUrl: entry.liveUrl || undefined,
    }))
  if (locale === 'en') return base

  const ar = await overrides()
  return base.map((p) => {
    const tr = ar.projects.find((x) => x.slug.trim() === p.slug)
    return tr ? { ...p, title: pick(tr.title, p.title), summary: pick(tr.summary, p.summary) } : p
  })
}

export type SectionEntry = { key: SectionKey; label: string; index: string }

/**
 * Visible sections in page order, already numbered. The numbering follows the
 * list rather than being stored, so hiding a section renumbers the rest
 * instead of leaving a gap.
 */
export async function getSections(locale: Locale = 'en'): Promise<SectionEntry[]> {
  const { order } = await reader.singletons.sections.readOrThrow()

  const base = order
    .filter((s) => s.visible)
    .map((s, i) => ({
      key: s.key as SectionKey,
      label: s.label || s.key,
      index: String(i + 1).padStart(2, '0'),
    }))
  if (locale === 'en') return base

  const ar = await overrides()
  return base.map((section) => {
    const tr = ar.sectionLabels.find((x) => x.key.trim() === section.key)
    return tr ? { ...section, label: pick(tr.label, section.label) } : section
  })
}
