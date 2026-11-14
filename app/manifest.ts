import type { MetadataRoute } from 'next'
import { getSite } from '@/lib/content'

/** Lets a phone add the site to its home screen with the right name and colours. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const site = await getSite()
  return {
    name: `${site.name} — ${site.role}`,
    short_name: site.name.split(' ')[0],
    description: site.tagline,
    start_url: '/',
    display: 'browser',
    background_color: '#06070b',
    theme_color: '#06070b',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
