import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProjectPage from '@/components/ProjectPage'
import { arabicEnabled, getProjects, getSite } from '@/lib/content'

export async function generateStaticParams() {
  if (!(await arabicEnabled())) return []
  const projects = await getProjects('ar')
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const [projects, site] = await Promise.all([getProjects('ar'), getSite('ar')])
  const project = projects.find((p) => p.slug === slug)
  if (!project) return {}

  return {
    title: project.title,
    description: project.summary,
    alternates: {
      canonical: `/ar/projects/${slug}`,
      languages: { en: `/projects/${slug}`, ar: `/ar/projects/${slug}` },
    },
    openGraph: {
      title: `${project.title} — ${site.name}`,
      description: project.summary,
      type: 'article',
    },
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await arabicEnabled())) notFound()
  const { slug } = await params
  return <ProjectPage slug={slug} locale="ar" />
}
