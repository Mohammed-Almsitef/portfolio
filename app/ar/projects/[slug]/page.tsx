import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProjectPage from '@/components/ProjectPage'
import { arabicEnabled } from '@/lib/content'
import { projectMetadata, projectParams } from '@/lib/metadata'

export async function generateStaticParams() {
  return projectParams('ar')
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return projectMetadata('ar', slug)
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  // The Arabic site is only served once it has been switched on in the manager.
  if (!(await arabicEnabled())) notFound()
  const { slug } = await params
  return <ProjectPage slug={slug} locale="ar" />
}
