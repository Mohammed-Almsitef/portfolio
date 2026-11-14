'use client'

import { useScrollValue } from '@/lib/hooks'

export default function ScrollProgress() {
  // Resize matters here and nowhere else: the denominator is the page height,
  // so a window resize changes the percentage without any scrolling.
  const pct = useScrollValue(
    () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      return max > 0 ? (window.scrollY / max) * 100 : 0
    },
    0,
    { onResize: true },
  )

  return (
    <div className="fixed inset-x-0 top-0 z-60 h-px bg-transparent" aria-hidden="true" data-print-hide>
      <div
        className="h-full bg-accent transition-[width] duration-75 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
