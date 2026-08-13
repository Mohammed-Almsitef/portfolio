import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import HomePage from '@/components/HomePage'
import { arabicEnabled, getSite } from '@/lib/content'

/**
 * The Arabic page only exists once it has been switched on in the manager.
 * Publishing an empty translation would be worse than having none, so an
 * unfinished one 404s rather than shipping a mirrored English page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite('ar')
  return {
    title: `${site.name} — ${site.role}`,
    description: site.tagline,
    alternates: { canonical: '/ar', languages: { en: '/', ar: '/ar' } },
  }
}

export default async function ArabicHome() {
  if (!(await arabicEnabled())) notFound()
  return <HomePage locale="ar" />
}
