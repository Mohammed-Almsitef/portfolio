import type { MetadataRoute } from 'next'
import { projects, site } from '@/data/content'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    { url: site.url, lastModified: now, priority: 1 },
    // Each case study is its own indexable page, so it belongs here too.
    ...projects.map((p) => ({
      url: `${site.url}/projects/${p.slug}`,
      lastModified: now,
      priority: 0.8,
    })),
  ]
}
