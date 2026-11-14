import 'server-only'

import type { Metadata } from 'next'
import { arabicEnabled, getProjects, getSite } from './content'
import { localePath, type Locale } from './locale'

/**
 * Page metadata that both language trees share.
 *
 * The two case-study routes were near-verbatim copies of each other, and had
 * already drifted where it mattered: the Arabic page declared its canonical
 * and its hreflang pair, the English one declared neither, while the sitemap
 * confidently published alternates for both. Deriving all three from one place
 * is what keeps a crawler from being told two different stories.
 */

/**
 * The canonical URL for a page, plus the hreflang pair once the Arabic site is
 * published. Before that, Arabic is a 404 and pointing a crawler at it would
 * be worse than staying quiet.
 */
export async function alternatesFor(
  locale: Locale,
  path = '',
): Promise<NonNullable<Metadata['alternates']>> {
  const canonical = localePath(locale, path)
  if (!(await arabicEnabled())) return { canonical }

  return {
    canonical,
    languages: { en: localePath('en', path), ar: localePath('ar', path) },
  }
}

/** One case study's metadata. Returns `{}` for an unknown slug, which 404s. */
export async function projectMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const [projects, site] = await Promise.all([getProjects(locale), getSite(locale)])
  const project = projects.find((p) => p.slug === slug)
  if (!project) return {}

  return {
    title: project.title,
    description: project.summary,
    alternates: await alternatesFor(locale, `/projects/${slug}`),
    openGraph: {
      title: `${project.title} — ${site.name}`,
      description: project.summary,
      type: 'article',
    },
  }
}

/** The slugs to prerender for a language. Empty for an unpublished Arabic site. */
export async function projectParams(locale: Locale) {
  if (locale === 'ar' && !(await arabicEnabled())) return []
  const projects = await getProjects(locale)
  return projects.map((p) => ({ slug: p.slug }))
}
