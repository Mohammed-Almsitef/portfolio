'use client'

import { useRef } from 'react'

/**
 * Card wrapper whose highlight tracks the pointer.
 *
 * Position is written straight to CSS custom properties on the node rather
 * than through React state — a re-render per mousemove would be needlessly
 * expensive, and nothing in the tree depends on the value. Moves are also
 * coalesced to one rAF so a fast pointer can't queue up layout reads.
 */
export default function Spotlight({
  children,
  className = '',
  innerClassName = '',
  style,
}: {
  children: React.ReactNode
  className?: string
  innerClassName?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const frame = useRef(0)

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || frame.current) return
    const { clientX, clientY } = e
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${clientX - r.left}px`)
      el.style.setProperty('--my', `${clientY - r.top}px`)
    })
  }

  return (
    <div ref={ref} onPointerMove={onMove} style={style} className={`relative isolate ${className}`}>
      {/* Negative z-index paints above the card's own background but below its
          in-flow content, so no stacking classes are needed on the children. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(300px circle at var(--mx, 50%) var(--my, -20%), var(--card-glow), transparent 72%)',
        }}
      />
      <div className={innerClassName}>{children}</div>
    </div>
  )
}
