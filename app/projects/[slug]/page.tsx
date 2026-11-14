import type { Metadata } from 'next'
import ProjectPage from '@/components/ProjectPage'
import { projectMetadata, projectParams } from '@/lib/metadata'

export async function generateStaticParams() {
  return projectParams('en')
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return projectMetadata('en', slug)
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <ProjectPage slug={slug} locale="en" />
}
