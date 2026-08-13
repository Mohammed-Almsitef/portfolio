import 'server-only'

import { createReader } from '@keystatic/core/reader'
import keystaticConfig from '@/keystatic.config'
import type { VisualKind } from '@/components/ProjectVisual'

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

export async function getSite() {
  const site = await reader.singletons.site.readOrThrow()
  return {
    ...site,
    // URL fields are nullable in the schema, but metadata and the sitemap need
    // a definite origin — fall back rather than emitting "null" into tags.
    url: site.url || 'https://mohammedalmsitef.me',
    domains: [...site.domains],
  }
}

export async function getSocials() {
  const { items } = await reader.singletons.socials.readOrThrow()
  return shown(items).map((s) => ({ label: s.label, href: s.href ?? '#' }))
}

export async function getAbout() {
  const about = await reader.singletons.about.readOrThrow()
  return {
    photo: about.photo ?? '/profile.jpg',
    paragraphs: [...about.paragraphs],
    stats: about.stats.map((s) => ({ value: s.value, label: s.label })),
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

export async function getExperience() {
  const { jobs } = await reader.singletons.experience.readOrThrow()
  return shown(jobs).map((j) => ({
    role: j.role,
    company: j.company,
    companyUrl: j.companyUrl || undefined,
    period: j.period,
    description: j.description,
    highlights: [...j.highlights],
  }))
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

export async function getProjects(): Promise<Project[]> {
  const entries = await reader.collections.projects.all()

  // `order` is nullable in the schema — an entry saved without one sorts last
  // rather than throwing or jumping to the front.
  const rank = (o: number | null) => o ?? Number.MAX_SAFE_INTEGER

  return entries
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
}

export type SectionEntry = { key: SectionKey; label: string; index: string }

/**
 * Visible sections in page order, already numbered. The numbering follows the
 * list rather than being stored, so hiding a section renumbers the rest
 * instead of leaving a gap.
 */
export async function getSections(): Promise<SectionEntry[]> {
  const { order } = await reader.singletons.sections.readOrThrow()

  return order
    .filter((s) => s.visible)
    .map((s, i) => ({
      key: s.key as SectionKey,
      label: s.label || s.key,
      index: String(i + 1).padStart(2, '0'),
    }))
}
