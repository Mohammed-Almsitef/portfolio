'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * The line between two sections.
 *
 * Reads as an instrument trace rather than a border: the hairline draws itself
 * across the viewport when it scrolls into view, and a short accent segment
 * with a node sits at the content's left gutter — the same edge the section
 * number and heading align to.
 *
 * The animated state is gated on the `.js` class (see globals.css), so with no
 * JavaScript the rule is simply drawn, never stuck at scaleX(0).
 */
export default function SectionRule() {
  const ref = useRef<HTMLDivElement>(null)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDrawn(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} aria-hidden="true" data-rule={drawn ? 'drawn' : 'idle'} className="section-rule">
      <span className="section-rule__line" />
      <div className="mx-auto max-w-5xl px-6">
        <span className="section-rule__mark">
          <span className="section-rule__node" />
        </span>
      </div>
    </div>
  )
}
