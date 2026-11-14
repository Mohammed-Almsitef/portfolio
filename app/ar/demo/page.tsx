import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import DemoPage from '@/components/DemoPage'
import { arabicEnabled } from '@/lib/content'

export const metadata: Metadata = {
  title: 'محاكاة الروبوت',
  alternates: { canonical: '/ar/demo' },
}

export default async function Page() {
  if (!(await arabicEnabled())) notFound()
  return <DemoPage locale="ar" />
}
