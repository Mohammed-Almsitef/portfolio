import type { MetadataRoute } from 'next'
import { arabicEnabled, getProjects, getSite } from '@/lib/content'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, site, hasArabic] = await Promise.all([getProjects(), getSite(), arabicEnabled()])
  const now = new Date()

  /**
   * Each page lists both languages as alternates so a search engine treats them
   * as one page in two languages rather than duplicate content — and serves
   * whichever matches the reader.
   */
  const alternates = (path: string) =>
    hasArabic ? { languages: { en: `${site.url}${path}`, ar: `${site.url}/ar${path}` } } : undefined

  const pages: MetadataRoute.Sitemap = [
    { url: site.url, lastModified: now, priority: 1, alternates: alternates('') },
    // Each visible case study is its own indexable page.
    ...projects.map((p) => ({
      url: `${site.url}/projects/${p.slug}`,
      lastModified: now,
      priority: 0.8,
      alternates: alternates(`/projects/${p.slug}`),
    })),
  ]

  // The Arabic pages only enter the index once the translation is published.
  if (!hasArabic) return pages

  return [
    ...pages,
    { url: `${site.url}/ar`, lastModified: now, priority: 0.9, alternates: alternates('') },
    ...projects.map((p) => ({
      url: `${site.url}/ar/projects/${p.slug}`,
      lastModified: now,
      priority: 0.7,
      alternates: alternates(`/projects/${p.slug}`),
    })),
  ]
}
