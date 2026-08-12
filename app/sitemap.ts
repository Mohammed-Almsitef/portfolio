import type { MetadataRoute } from 'next'
import { getProjects, getSite } from '@/lib/content'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, site] = await Promise.all([getProjects(), getSite()])
  const now = new Date()

  return [
    { url: site.url, lastModified: now, priority: 1 },
    // Each visible case study is its own indexable page.
    ...projects.map((p) => ({
      url: `${site.url}/projects/${p.slug}`,
      lastModified: now,
      priority: 0.8,
    })),
  ]
}
