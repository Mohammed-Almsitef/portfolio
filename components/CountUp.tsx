'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Counts a stat up when it scrolls into view.
 *
 * Values are arbitrary strings ("12+", "XX", "1.2k"), so the leading number is
 * animated and any prefix/suffix is preserved. A value with no digits — such
 * as the placeholders shipped in content.ts — renders as-is rather than
 * animating to nothing.
 */
export default function CountUp({ value, className = '' }: { value: string; className?: string }) {
  const match = value.match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/)
  const target = match ? parseFloat(match[2]) : null
  const decimals = match?.[2].includes('.') ? 1 : 0

  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || target === null) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(target)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()

        const duration = 900
        const start = performance.now()
        let raf = 0

        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1)
          // ease-out so it decelerates into the final figure
          setShown(target * (1 - Math.pow(1 - t, 3)))
          if (t < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        cleanup = () => cancelAnimationFrame(raf)
      },
      { threshold: 0.4 },
    )

    let cleanup = () => {}
    io.observe(el)
    return () => {
      io.disconnect()
      cleanup()
    }
  }, [target])

  if (target === null) return <span className={className}>{value}</span>

  return (
    <span ref={ref} className={className}>
      {match![1]}
      {(shown ?? 0).toFixed(decimals)}
      {match![3]}
    </span>
  )
}
