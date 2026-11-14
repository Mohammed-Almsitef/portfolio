import { getPost, getPosts, getSite } from '@/lib/content'
import { OG_SIZE, ogCard } from '@/lib/og'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Article'

export async function generateStaticParams() {
  return (await getPosts()).map((p) => ({ slug: p.slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [post, site] = await Promise.all([getPost(slug), getSite('en')])
  return ogCard({
    kicker: `Writing${post?.tags.length ? ` · ${post.tags.slice(0, 3).join(' · ')}` : ''}`,
    title: post?.title ?? site.name,
    summary: post?.summary ?? site.tagline,
    name: `${site.name} — ${site.role}`,
    tone: 'violet',
  })
}
