import type { Metadata } from 'next'
import DemoPage from '@/components/DemoPage'

export const metadata: Metadata = {
  title: 'Robot simulation',
  description:
    'A simulated BurgerBot exploring rooms, a maze or a warehouse in your browser: lidar mapping, costmaps, frontier exploration, A* and pure pursuit.',
  alternates: { canonical: '/demo' },
}

export default function Page() {
  return <DemoPage locale="en" />
}
