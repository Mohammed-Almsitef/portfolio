'use client'

import { useEffect, useRef } from 'react'

type Seg = { x1: number; y1: number; x2: number; y2: number }

/** Fallback until the themed value is read from CSS. */
const INK_FALLBACK = '94 234 212'
const SWEEP_SPEED = 1.25 // radians per second
const TRAIL = 620 // retained hit points

/**
 * Simulated 2D LiDAR: a sweeping beam raycast against wall segments,
 * accumulating a fading point cloud. Scene coords are normalized 0..1
 * so the layout survives any canvas size.
 *
 * The scene is a closed floor plan on purpose — an enclosure guarantees every
 * ray terminates on a wall, so the cloud reads as a continuous scanned outline
 * rather than a scattering of disconnected fragments.
 */
const SCENE: Seg[] = [
  // outer boundary
  { x1: 0.08, y1: 0.08, x2: 0.92, y2: 0.08 },
  { x1: 0.92, y1: 0.08, x2: 0.92, y2: 0.92 },
  { x1: 0.92, y1: 0.92, x2: 0.08, y2: 0.92 },
  { x1: 0.08, y1: 0.92, x2: 0.08, y2: 0.08 },
  // interior partitions
  { x1: 0.32, y1: 0.08, x2: 0.32, y2: 0.38 },
  { x1: 0.08, y1: 0.38, x2: 0.32, y2: 0.38 },
  { x1: 0.68, y1: 0.08, x2: 0.68, y2: 0.3 },
  { x1: 0.6, y1: 0.45, x2: 0.92, y2: 0.45 },
  { x1: 0.72, y1: 0.62, x2: 0.72, y2: 0.92 },
  { x1: 0.2, y1: 0.74, x2: 0.46, y2: 0.74 },
  // a freestanding block
  { x1: 0.22, y1: 0.5, x2: 0.4, y2: 0.5 },
  { x1: 0.4, y1: 0.5, x2: 0.4, y2: 0.62 },
  { x1: 0.4, y1: 0.62, x2: 0.22, y2: 0.62 },
  { x1: 0.22, y1: 0.62, x2: 0.22, y2: 0.5 },
]

const ORIGIN = { x: 0.53, y: 0.6 }

function castRay(ox: number, oy: number, angle: number, segs: Seg[], maxDist: number) {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  let best = maxDist

  for (const s of segs) {
    const sx = s.x2 - s.x1
    const sy = s.y2 - s.y1
    const denom = dx * sy - dy * sx
    if (Math.abs(denom) < 1e-9) continue

    const t = ((s.x1 - ox) * sy - (s.y1 - oy) * sx) / denom
    const u = ((s.x1 - ox) * dy - (s.y1 - oy) * dx) / denom

    if (t > 0 && t < best && u >= 0 && u <= 1) best = t
  }

  return best
}

export default function LidarBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const parallaxRef = useRef<HTMLDivElement>(null)
  const inkRef = useRef(INK_FALLBACK)

  // Canvas can't inherit a CSS colour, so the themed ink is read from the
  // custom property and re-read whenever the theme changes.
  useEffect(() => {
    const read = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--canvas-ink').trim()
      if (v) inkRef.current = v
    }
    read()

    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', read)

    return () => {
      mo.disconnect()
      mq.removeEventListener('change', read)
    }
  }, [])

  // Parallax: the scan drifts at a fraction of scroll speed, giving the hero
  // depth as it leaves. Skipped entirely under reduced-motion.
  useEffect(() => {
    const el = parallaxRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const y = Math.min(window.scrollY, window.innerHeight)
        el.style.transform = `translate3d(0, ${y * 0.18}px, 0)`
        // Opacity is set on this inner node only; the wrapper's responsive
        // opacity classes stay intact and the two multiply together.
        el.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.9)))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let w = 0
    let h = 0
    let scale = 0
    let raf = 0
    let angle = 0
    let last = performance.now()
    const points: { x: number; y: number; age: number }[] = []

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      scale = Math.min(w, h)
    }

    // Scene is normalized square-ish; map to canvas with a uniform scale
    const toX = (nx: number) => (w - scale) / 2 + nx * scale
    const toY = (ny: number) => (h - scale) / 2 + ny * scale

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      const ink = inkRef.current

      ctx.clearRect(0, 0, w, h)

      const ox = ORIGIN.x
      const oy = ORIGIN.y

      // walls
      ctx.lineWidth = 1
      ctx.strokeStyle = `rgb(${ink} / 0.16)`
      ctx.beginPath()
      for (const s of SCENE) {
        ctx.moveTo(toX(s.x1), toY(s.y1))
        ctx.lineTo(toX(s.x2), toY(s.y2))
      }
      ctx.stroke()

      if (!reduced) {
        angle += SWEEP_SPEED * dt
        if (angle > Math.PI * 2) angle -= Math.PI * 2

        // a small fan of rays per frame so the cloud fills in smoothly
        for (let i = 0; i < 5; i++) {
          const a = angle + i * 0.009
          const d = castRay(ox, oy, a, SCENE, 1.6)
          if (d < 1.6) {
            points.push({ x: ox + Math.cos(a) * d, y: oy + Math.sin(a) * d, age: 0 })
          }
        }
        while (points.length > TRAIL) points.shift()
      } else if (points.length === 0) {
        for (let a = 0; a < Math.PI * 2; a += 0.02) {
          const d = castRay(ox, oy, a, SCENE, 1.6)
          if (d < 1.6) points.push({ x: ox + Math.cos(a) * d, y: oy + Math.sin(a) * d, age: 0 })
        }
      }

      // active beam
      if (!reduced) {
        const d = castRay(ox, oy, angle, SCENE, 1.6)
        const grad = ctx.createLinearGradient(
          toX(ox),
          toY(oy),
          toX(ox + Math.cos(angle) * d),
          toY(oy + Math.sin(angle) * d),
        )
        grad.addColorStop(0, `rgb(${ink} / 0.28)`)
        grad.addColorStop(1, `rgb(${ink} / 0)`)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(toX(ox), toY(oy))
        ctx.lineTo(toX(ox + Math.cos(angle) * d), toY(oy + Math.sin(angle) * d))
        ctx.stroke()
      }

      // point cloud, newest brightest
      const n = points.length
      for (let i = 0; i < n; i++) {
        const p = points[i]
        const life = n > 1 ? i / (n - 1) : 1
        ctx.fillStyle = `rgb(${ink} / ${0.17 + life * 0.5})`
        ctx.beginPath()
        ctx.arc(toX(p.x), toY(p.y), 1.3, 0, Math.PI * 2)
        ctx.fill()
      }

      // sensor origin
      ctx.fillStyle = `rgb(${ink} / 0.7)`
      ctx.beginPath()
      ctx.arc(toX(ox), toY(oy), 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = `rgb(${ink} / 0.25)`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(toX(ox), toY(oy), 8, 0, Math.PI * 2)
      ctx.stroke()

      raf = requestAnimationFrame(draw)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <div
      // Opacity climbs with available width. On a phone the scan has nowhere to
      // go but behind the copy, so it stays faint; only past `xl` is there
      // genuinely empty ground to the right of the text for it to own.
      className="lidar-mask pointer-events-none absolute inset-y-0 right-0 w-full overflow-hidden opacity-20 md:w-[56%] md:opacity-45 lg:opacity-70 xl:opacity-100"
      aria-hidden="true"
    >
      <div ref={parallaxRef} className="size-full">
        <canvas ref={canvasRef} className="size-full" />
      </div>
    </div>
  )
}
