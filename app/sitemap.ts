import type { MetadataRoute } from 'next'
import { arabicEnabled, getProjects, getSite } from '@/lib/content'
import { localePath, type Locale } from '@/lib/locale'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, site, hasArabic] = await Promise.all([getProjects(), getSite(), arabicEnabled()])
  const now = new Date()

  /**
   * Each page lists both languages as alternates so a search engine treats them
   * as one page in two languages rather than duplicate content — and serves
   * whichever matches the reader.
   *
   * The same pairing the pages themselves declare via `alternatesFor`; here it
   * needs absolute URLs, which a sitemap requires and page metadata resolves
   * from `metadataBase`.
   */
  // `localePath` returns '/' for the English home, but the <loc> beside it is
  // the bare origin — a self-referencing alternate has to match its own <loc>
  // exactly, so the root's trailing slash comes off.
  const abs = (locale: Locale, path: string) => {
    const p = localePath(locale, path)
    return p === '/' ? site.url : `${site.url}${p}`
  }

  const alternates = (path: string) =>
    hasArabic ? { languages: { en: abs('en', path), ar: abs('ar', path) } } : undefined

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
