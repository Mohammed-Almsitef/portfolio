import type { MetadataRoute } from 'next'
import { getSite } from '@/lib/content'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSite()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The manager is behind a password, so a crawler only ever gets a
      // redirect to the login — but a login page is still a page it will try to
      // index and report on. Saying so up front spends the crawl budget on the
      // content instead.
      disallow: ['/keystatic', '/manager', '/api/'],
    },
    sitemap: `${site.url}/sitemap.xml`,
  }
}
