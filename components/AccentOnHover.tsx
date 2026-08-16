'use client'

import { useEffect, useRef } from 'react'
import type { Tone } from '@/lib/content'

/**
 * Retints the whole page in this element's tone while it is hovered or focused.
 *
 * Everything accented — links, buttons, the heading glow, the hero scan —
 * derives from `--accent-tone`, so setting that one property on <html> carries
 * the colour across the page rather than only into this card.
 *
 * The variable is set on the root rather than passed down as React state
 * because the elements being retinted are nowhere near this one in the tree,
 * and a state-driven re-render of the whole page on every pointer move would
 * be a far heavier way to change one colour.
 */
export default function AccentOnHover({
  tone,
  className,
  children,
}: {
  tone: Tone
  className?: string
  children: React.ReactNode
}) {
  const held = useRef(false)

  // A card can unmount while hovered — navigating away with the pointer still
  // over it — which would otherwise strand the page in that tone.
  useEffect(() => {
    return () => {
      if (held.current) document.documentElement.style.removeProperty('--accent-tone')
    }
  }, [])

  const take = () => {
    held.current = true
    document.documentElement.style.setProperty('--accent-tone', `var(--tone-${tone})`)
  }

  const release = () => {
    held.current = false
    document.documentElement.style.removeProperty('--accent-tone')
  }

  return (
    <div
      className={className}
      // Local `--tone` too, so the card's own border and dot read from the same
      // value the page-wide retint uses. Resolved per theme by globals.css.
      style={{ '--tone': `var(--tone-${tone})` } as React.CSSProperties}
      onPointerEnter={take}
      onPointerLeave={release}
      // Keyboard users get the same feedback as pointer users; the group is
      // already reachable, so this only mirrors what hover does.
      onFocusCapture={take}
      onBlurCapture={release}
    >
      {children}
    </div>
  )
}
