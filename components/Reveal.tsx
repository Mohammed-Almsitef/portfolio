'use client'

import { useInView } from '@/lib/hooks'

/**
 * Scroll-reveal wrapper.
 *
 * The hidden starting state lives in globals.css behind the `.js` class that
 * the layout's inline script sets before first paint, so if JavaScript is
 * disabled or the bundle fails to load, content renders fully visible rather
 * than stuck at opacity 0.
 */
export default function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const { ref, inView: shown } = useInView<HTMLDivElement>({
    threshold: 0.05,
    rootMargin: '0px 0px -6% 0px',
  })

  return (
    <div
      ref={ref}
      data-reveal={shown ? 'shown' : 'hidden'}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
      className={className}
    >
      {children}
    </div>
  )
}
