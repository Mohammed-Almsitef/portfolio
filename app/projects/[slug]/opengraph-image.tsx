import { getProjects, getSite } from '@/lib/content'
import { OG_SIZE, ogCard } from '@/lib/og'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Case study'

export async function generateStaticParams() {
  return (await getProjects('en')).map((p) => ({ slug: p.slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [projects, site] = await Promise.all([getProjects('en'), getSite('en')])
  const p = projects.find((x) => x.slug === slug)
  return ogCard({
    kicker: `Case study · ${p?.year ?? ''}`,
    title: p?.title ?? site.name,
    summary: p?.summary ?? site.tagline,
    name: `${site.name} — ${site.role}`,
    tone: p?.tone,
  })
}
