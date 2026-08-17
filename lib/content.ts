import 'server-only'

import { createReader } from '@keystatic/core/reader'
import keystaticConfig from '@/keystatic.config'
import type { VisualKind } from '@/components/ProjectVisual'
import type { Locale } from './locale'
import {
  detectPlatform,
  handleOf,
  hrefOf,
  platformName,
  platformTone,
  type PlatformId,
} from './socials'

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
 * Which tree a language reads from.
 *
 * Arabic is a separate site rather than a translation layer: both trees are
 * built from the same schema, so they cannot drift apart structurally, but
 * their contents are wholly independent. The Arabic side can carry different
 * projects, a different section order and a different bio, and nothing written
 * on one side leaks into the other.
 */
const TREE = {
  en: {
    sections: reader.singletons.sections,
    site: reader.singletons.site,
    socials: reader.singletons.socials,
    about: reader.singletons.about,
    contact: reader.singletons.contact,
    skills: reader.singletons.skills,
    experience: reader.singletons.experience,
    education: reader.singletons.education,
    publications: reader.singletons.publications,
    openSource: reader.singletons.openSource,
    projects: reader.collections.projects,
  },
  ar: {
    sections: reader.singletons.sectionsAr,
    site: reader.singletons.siteAr,
    socials: reader.singletons.socialsAr,
    about: reader.singletons.aboutAr,
    contact: reader.singletons.contactAr,
    skills: reader.singletons.skillsAr,
    experience: reader.singletons.experienceAr,
    education: reader.singletons.educationAr,
    publications: reader.singletons.publicationsAr,
    openSource: reader.singletons.openSourceAr,
    projects: reader.collections.projectsAr,
  },
} as const

export type Appearance = {
  defaultTheme: 'light' | 'dark'
  accent: Tone
  decorShow: boolean
  decorArrangement: 'auto' | 'a' | 'b' | 'c'
  decorWeight: 'vivid' | 'soft'
}

const TONE_NAMES: readonly Tone[] = [
  'blue',
  'violet',
  'purple',
  'cyan',
  'rose',
  'emerald',
  'amber',
  'teal',
  'lime',
]

/**
 * Site chrome: the colour mode a first-time visitor gets, and how the margin
 * decorations behave. Shared by both languages, and every field falls back so
 * a missing or partial file still renders the site.
 */
export async function getAppearance(): Promise<Appearance> {
  const a = await reader.singletons.appearance.read()
  return {
    defaultTheme: a?.defaultTheme === 'dark' ? 'dark' : 'light',
    // Validated against the known set rather than cast: the value reaches a CSS
    // variable name, so an unrecognised one would silently blank the accent.
    accent: TONE_NAMES.includes(a?.accent as Tone) ? (a!.accent as Tone) : 'blue',
    decorShow: a?.decorShow !== false,
    decorArrangement: a?.decorArrangement ?? 'auto',
    decorWeight: a?.decorWeight === 'soft' ? 'soft' : 'vivid',
  }
}

/** Whether the Arabic site is published. Missing settings file means no. */
export async function arabicEnabled(): Promise<boolean> {
  const settings = await reader.singletons.arabicSettings.read()
  return settings?.enabled === true
}

export async function getSite(locale: Locale = 'en') {
  const site = await TREE[locale].site.readOrThrow()
  return {
    ...site,
    // URL fields are nullable in the schema, but metadata and the sitemap need
    // a definite origin — fall back rather than emitting "null" into tags.
    url: site.url || 'https://mohammedalmsitef.me',
    domains: [...site.domains],
  }
}

/**
 * The social links, each resolved to a platform so the section can show its
 * mark. The icon is derived from the URL unless the manager names one, and the
 * label falls back to the platform's own name — a link with a URL but no label
 * still renders as something a visitor can read.
 *
 * A row with no URL yet is dropped rather than rendered as a dead tile, so the
 * manager can hold a platform the owner has not filled in yet: the link appears
 * on the site the moment an address is pasted, and never before.
 */
export type Social = {
  label: string
  href: string
  platform: PlatformId
  tone: ReturnType<typeof platformTone>
  handle: string | null
}

export async function getSocials(locale: Locale = 'en'): Promise<Social[]> {
  const { items } = await TREE[locale].socials.readOrThrow()

  return shown(items).flatMap((s) => {
    const href = s.href?.trim()
    if (!href) return []

    const platform =
      s.icon && s.icon !== 'auto' ? (s.icon as PlatformId) : detectPlatform(href, s.label)

    return {
      label: s.label || platformName(platform),
      href: hrefOf(href),
      platform,
      tone: platformTone(platform),
      handle: handleOf(href, platform),
    }
  })
}

export async function getAbout(locale: Locale = 'en') {
  const about = await TREE[locale].about.readOrThrow()
  const base = {
    // Null rather than a guessed path: an unset photo should mean "no photo",
    // not a broken image pointing at a file that may never have existed.
    photo: about.photo || null,
    paragraphs: [...about.paragraphs],
    stats: about.stats.map((s) => ({ value: s.value, label: s.label })),
  }
  return base
}

/**
 * Contact copy. Every field falls back to the English wording so the section
 * still reads if the file is missing — but the fallbacks are English, which is
 * why the Arabic tree ships its own file rather than relying on them.
 */
export async function getContact(locale: Locale = 'en') {
  const c = await TREE[locale].contact.read()
  return {
    headline: c?.headline || 'Let’s work together.',
    blurb: c?.blurb || '',
    responseTime: c?.responseTime || '',
  }
}

export async function getSkillGroups(locale: Locale = 'en') {
  const { groups } = await TREE[locale].skills.readOrThrow()
  return shown(groups).map((g) => ({
    title: g.title,
    tone: g.tone as Tone,
    items: [...g.items],
  }))
}

export async function getExperience(locale: Locale = 'en') {
  const { jobs } = await TREE[locale].experience.readOrThrow()
  const base = shown(jobs).map((j) => ({
    role: j.role,
    company: j.company,
    companyUrl: j.companyUrl || undefined,
    period: j.period,
    description: j.description,
    highlights: [...j.highlights],
  }))
  return base
}

export async function getEducation(locale: Locale = 'en') {
  const { items } = await TREE[locale].education.readOrThrow()
  return shown(items).map((e) => ({
    degree: e.degree,
    school: e.school,
    period: e.period,
  }))
}

export async function getPublications(locale: Locale = 'en') {
  const { items } = await TREE[locale].publications.readOrThrow()
  return shown(items).map((p) => ({
    title: p.title,
    venue: p.venue,
    year: p.year,
    url: p.url ?? '#',
  }))
}

export async function getOpenSource(locale: Locale = 'en') {
  const os = await TREE[locale].openSource.readOrThrow()
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
  const entries = await TREE[locale].projects.all()

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
  return base
}

export type SectionEntry = { key: SectionKey; label: string }

/** Visible sections, in the page order set in the manager. */
export async function getSections(locale: Locale = 'en'): Promise<SectionEntry[]> {
  const { order } = await TREE[locale].sections.readOrThrow()

  return order
    .filter((s) => s.visible)
    .map((s) => ({
      key: s.key as SectionKey,
      label: s.label || s.key,
    }))
}
