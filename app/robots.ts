import type { MetadataRoute } from 'next'
import { getSite } from '@/lib/content'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSite()

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${site.url}/sitemap.xml`,
  }
}
