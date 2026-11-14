import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Aurora from '@/components/Aurora'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'
import PostBody from '@/components/PostBody'
import ScrollProgress from '@/components/ScrollProgress'
import ThemeToggle from '@/components/ThemeToggle'
import { DraftBadge, formatDate } from '@/components/Writing'
import { getPost, getPosts, getSite } from '@/lib/content'

export async function generateStaticParams() {
  return (await getPosts()).map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/writing/${slug}` },
    openGraph: { title: post.title, description: post.summary, type: 'article', publishedTime: post.date },
    ...(post.draft ? { robots: { index: false, follow: false } } : {}),
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [post, site] = await Promise.all([getPost(slug), getSite()])
  if (!post) notFound()

  return (
    <div>
      <Aurora />
      <ScrollProgress />
      <header data-print-hide className="sticky top-0 z-40 border-b border-border bg-bg/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" aria-label={site.name} className="tap items-center gap-2.5 text-[0.9375rem] font-semibold tracking-tight hover:text-accent">
            <Logo id="post-logo" weight="medium" className="h-9 w-auto shrink-0" />
            <span className="hidden sm:inline">{site.name}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/writing" className="tap gap-1.5 text-sm text-muted hover:text-accent">
              <span aria-hidden="true">←</span> All writing
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-3xl px-6 pb-24 pt-14 md:pt-20">
        <article>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            {post.tags.length > 0 && <span aria-hidden="true">·</span>}
            {post.tags.join(' · ')}
            {post.draft && <DraftBadge />}
          </p>
          <h1 className="text-gradient mt-4 text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.1] tracking-[-0.035em]">
            {post.title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-body">{post.summary}</p>
          <div className="mt-10 border-t border-border pt-10">
            <PostBody node={post.node} />
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}
