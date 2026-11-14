'use client'

import { useEffect, useRef } from 'react'
import {
  LIDAR_BEAMS,
  OCC,
  ROBOT_RADIUS,
  UNKNOWN,
  coverage,
  createSim,
  sendGoal,
  step,
  type Mode,
  type Sim,
} from '@/lib/slam'

/** Grid size in cells (10 cm each): a 9.6 m × 6 m floor. */
const W = 96
const H = 60

export type SlamLabels = {
  title: string
  hint: string
  aria: string
  newMap: string
  map: string
  modes: Record<Mode, string>
}

type Palette = {
  text: string
  accent: string
  scan: string
  plan: string
  bg: string
}

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement)
  const tone = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback
  return {
    text: cs.getPropertyValue('--color-text').trim() || '#e8ecf3',
    bg: cs.getPropertyValue('--color-surface').trim() || '#10141c',
    accent: tone('--accent-tone', '96 165 250'),
    scan: tone('--tone-rose', '251 113 133'),
    plan: tone('--tone-emerald', '52 211 153'),
  }
}

const rgba = (triplet: string, a: number) => `rgb(${triplet} / ${a})`

/** Hex (#rrggbb) to "r g b", so the ink colour can take an alpha too. */
function hexTriplet(hex: string) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  return m ? `${parseInt(m[1], 16)} ${parseInt(m[2], 16)} ${parseInt(m[3], 16)}` : '232 236 243'
}

/**
 * The hero's live robot: frontier exploration, lidar SLAM, an inflated
 * costmap, A* and pure pursuit (all in lib/slam.ts), drawn the way RViz would
 * show it. A click sends a navigation goal.
 *
 * Runs only while on screen and the tab is visible. With reduced motion it
 * renders a still frame and moves only when the visitor asks it to.
 */
export default function SlamViewport({ labels }: { labels: SlamLabels }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const modeRef = useRef<HTMLSpanElement>(null)
  const poseRef = useRef<HTMLSpanElement>(null)
  const covRef = useRef<HTMLElement>(null)
  const simRef = useRef<Sim | null>(null)
  const resetRef = useRef<() => void>(() => {})
  const labelsRef = useRef(labels)
  useEffect(() => {
    labelsRef.current = labels
  }, [labels])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let seed = 1 + Math.floor(Math.random() * 1e6)
    let sim = createSim(W, H, seed)
    simRef.current = sim

    // The map lives at one pixel per cell and is scaled up when drawn.
    const mapCanvas = document.createElement('canvas')
    mapCanvas.width = W
    mapCanvas.height = H
    const mctx = mapCanvas.getContext('2d')!
    const img = mctx.createImageData(W, H)

    let pal = readPalette()
    let ink = hexTriplet(pal.text)
    let cell = 1
    let dpr = 1

    const paintMap = () => {
      const [ir, ig, ib] = ink.split(' ').map(Number)
      const [ar, ag, ab] = pal.accent.split(' ').map(Number)
      const d = img.data
      for (let i = 0; i < W * H; i++) {
        const m = sim.map[i]
        const o = i * 4
        if (m === UNKNOWN) {
          d[o + 3] = 0
        } else if (m === OCC) {
          d[o] = ir
          d[o + 1] = ig
          d[o + 2] = ib
          d[o + 3] = 230
        } else {
          const c = sim.cost[i]
          if (c > 0) {
            // Costmap halo: lethal band strongest, fading with the decay.
            d[o] = ar
            d[o + 1] = ag
            d[o + 2] = ab
            d[o + 3] = c >= 255 ? 30 : 8 + c * 0.12
          } else {
            d[o] = ir
            d[o + 1] = ig
            d[o + 2] = ib
            d[o + 3] = 20
          }
        }
      }
      mctx.putImageData(img, 0, 0)
      sim.dirty = false
    }

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(r.width * dpr)
      canvas.height = Math.round(r.height * dpr)
      cell = canvas.width / W
    }

    const draw = () => {
      const c = cell
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // One-metre grid.
      ctx.strokeStyle = rgba(ink, 0.05)
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let x = 0; x <= W; x += 10) {
        ctx.moveTo(Math.round(x * c) + 0.5, 0)
        ctx.lineTo(Math.round(x * c) + 0.5, canvas.height)
      }
      for (let y = 0; y <= H; y += 10) {
        ctx.moveTo(0, Math.round(y * c) + 0.5)
        ctx.lineTo(canvas.width, Math.round(y * c) + 0.5)
      }
      ctx.stroke()

      if (sim.dirty) paintMap()
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(mapCanvas, 0, 0, W * c, H * c)

      const P = sim.pose

      // Trail.
      if (sim.trail.length > 1) {
        ctx.strokeStyle = rgba(pal.accent, 0.22)
        ctx.lineWidth = Math.max(1, c * 0.25)
        ctx.setLineDash([])
        ctx.beginPath()
        sim.trail.forEach((p, i) => (i ? ctx.lineTo(p.x * c, p.y * c) : ctx.moveTo(p.x * c, p.y * c)))
        ctx.lineTo(P.x * c, P.y * c)
        ctx.stroke()
      }

      // Laser scan: faint fan, bright returns.
      ctx.fillStyle = rgba(pal.scan, 0.05)
      ctx.beginPath()
      ctx.moveTo(P.x * c, P.y * c)
      for (let b = 0; b <= LIDAR_BEAMS; b++) {
        const k = b % LIDAR_BEAMS
        const a = P.th + (k / LIDAR_BEAMS) * Math.PI * 2
        ctx.lineTo((P.x + Math.cos(a) * sim.scan[k]) * c, (P.y + Math.sin(a) * sim.scan[k]) * c)
      }
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = rgba(pal.scan, 0.95)
      const dot = Math.max(1.5, c * 0.32)
      for (let b = 0; b < LIDAR_BEAMS; b++) {
        if (sim.scan[b] >= 25.9) continue
        const a = P.th + (b / LIDAR_BEAMS) * Math.PI * 2
        ctx.fillRect(
          (P.x + Math.cos(a) * sim.scan[b]) * c - dot / 2,
          (P.y + Math.sin(a) * sim.scan[b]) * c - dot / 2,
          dot,
          dot,
        )
      }

      // Global plan.
      if (sim.path.length > 1) {
        ctx.strokeStyle = rgba(pal.plan, 0.9)
        ctx.lineWidth = Math.max(1.5, c * 0.3)
        ctx.setLineDash([c * 0.9, c * 0.6])
        ctx.beginPath()
        ctx.moveTo(P.x * c, P.y * c)
        for (let k = sim.pathIdx; k < sim.path.length; k++) ctx.lineTo(sim.path[k].x * c, sim.path[k].y * c)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Goal marker.
      if (sim.goal) {
        const gx = sim.goal.x * c
        const gy = sim.goal.y * c
        const pulse = 1 + 0.25 * Math.sin(sim.time * 5)
        ctx.strokeStyle = rgba(pal.plan, 0.9)
        ctx.lineWidth = Math.max(1.5, c * 0.25)
        ctx.beginPath()
        ctx.arc(gx, gy, c * 1.4 * pulse, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = rgba(pal.plan, 0.9)
        ctx.beginPath()
        ctx.arc(gx, gy, c * 0.45, 0, Math.PI * 2)
        ctx.fill()
      }

      // Robot footprint, heading and TF axes (x red, y green, as in RViz).
      const R = ROBOT_RADIUS * c
      ctx.fillStyle = rgba(pal.accent, 0.25)
      ctx.strokeStyle = rgba(pal.accent, 1)
      ctx.lineWidth = Math.max(1.5, c * 0.28)
      ctx.beginPath()
      ctx.arc(P.x * c, P.y * c, R, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      const axis = (ang: number, color: string) => {
        ctx.strokeStyle = color
        ctx.beginPath()
        ctx.moveTo(P.x * c, P.y * c)
        ctx.lineTo(P.x * c + Math.cos(ang) * R * 1.9, P.y * c + Math.sin(ang) * R * 1.9)
        ctx.stroke()
      }
      axis(P.th + Math.PI / 2, 'rgb(52 211 153 / 0.9)')
      axis(P.th, 'rgb(248 113 113 / 0.95)')
    }

    let lastHud = 0
    const hud = (force = false) => {
      if (!force && sim.time - lastHud < 0.12) return
      lastHud = sim.time
      const L = labelsRef.current
      if (modeRef.current) {
        modeRef.current.textContent = L.modes[sim.mode]
        modeRef.current.dataset.mode = sim.mode
      }
      if (poseRef.current) {
        const deg = Math.round(((-sim.pose.th * 180) / Math.PI + 360) % 360)
        poseRef.current.textContent = `x ${(sim.pose.x / 10).toFixed(2)}  y ${((H - sim.pose.y) / 10).toFixed(2)}  θ ${String(deg).padStart(3, ' ')}°`
      }
      if (covRef.current) covRef.current.textContent = `${Math.round(coverage(sim) * 100)}%`
    }

    const reset = () => {
      seed = (seed * 48271 + 11) % 2147483647
      sim = createSim(W, H, seed)
      simRef.current = sim
      sim.dirty = true
      hud(true)
      draw()
    }
    resetRef.current = reset

    // Animation loop, gated on visibility.
    let raf = 0
    let last = 0
    let onScreen = true
    let animating = !reduced
    let completeAt = -1

    const frame = (now: number) => {
      raf = 0
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
      last = now
      // Two half-steps keep the controller stable on slow frames.
      step(sim, dt / 2)
      step(sim, dt / 2)
      if (sim.mode === 'complete') {
        if (completeAt < 0) completeAt = sim.time
        else if (sim.time - completeAt > 3.5) {
          completeAt = -1
          reset()
        }
      } else completeAt = -1
      if (reduced && sim.mode !== 'navigating') animating = false
      draw()
      hud()
      schedule()
    }
    const schedule = () => {
      if (!raf && animating && onScreen && !document.hidden) {
        raf = requestAnimationFrame(frame)
      } else if (!animating || !onScreen || document.hidden) {
        last = 0
      }
    }

    if (reduced) {
      // A still frame of a map already well under way.
      for (let i = 0; i < 500; i++) step(sim, 1 / 30)
    }

    resize()
    draw()
    hud(true)
    schedule()

    const ro = new ResizeObserver(() => {
      resize()
      draw()
    })
    ro.observe(canvas)

    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting
      schedule()
    })
    io.observe(canvas)

    const onVis = () => schedule()
    document.addEventListener('visibilitychange', onVis)

    // Re-read colours when the theme or accent changes.
    const mo = new MutationObserver(() => {
      pal = readPalette()
      ink = hexTriplet(pal.text)
      sim.dirty = true
      draw()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-accent'] })

    const onClick = (ev: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      const x = ((ev.clientX - r.left) / r.width) * W
      const y = ((ev.clientY - r.top) / r.height) * H
      sendGoal(sim, { x, y })
      animating = true
      hud(true)
      schedule()
    }
    canvas.addEventListener('pointerdown', onClick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      canvas.removeEventListener('pointerdown', onClick)
    }
  }, [])

  return (
    <figure className="slam-panel relative overflow-hidden rounded-2xl border border-border bg-surface/80 shadow-[0_30px_80px_-40px_rgb(var(--accent-tone)/0.45)] backdrop-blur-sm">
      {/* Title bar, in the manner of an RViz window. */}
      <figcaption className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 font-mono text-[0.7rem] text-muted">
        <span className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[rgb(var(--tone-status))] opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-[rgb(var(--tone-status))]" />
          </span>
          <span className="truncate" dir="ltr">
            {labels.title}
          </span>
        </span>
        <button
          type="button"
          onClick={() => resetRef.current()}
          className="mono-label tap shrink-0 rounded-md border border-border px-2 py-0.5 transition-colors hover:border-accent hover:text-accent"
        >
          {labels.newMap}
        </button>
      </figcaption>

      <div className="relative">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={labels.aria}
          className="block aspect-[96/60] w-full cursor-crosshair touch-manipulation"
        />

        {/* Live readouts, written straight to the DOM at ~8 Hz. */}
        <div
          aria-hidden="true"
          dir="ltr"
          className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 font-mono text-[0.65rem] sm:text-[0.7rem]"
        >
          <span
            ref={modeRef}
            className="slam-mode mono-label rounded border border-border bg-bg/80 px-2 py-1 uppercase tracking-wider text-accent backdrop-blur-sm"
          />
          <span className="rounded border border-border bg-bg/80 px-2 py-1 text-muted backdrop-blur-sm">
            <span className="mono-label">{labels.map}</span>{' '}
            <bdi ref={covRef} className="text-text" />
          </span>
        </div>
        <div
          aria-hidden="true"
          dir="ltr"
          className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 font-mono text-[0.65rem] sm:text-[0.7rem]"
        >
          <span
            ref={poseRef}
            className="whitespace-pre rounded border border-border bg-bg/80 px-2 py-1 text-muted backdrop-blur-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border px-4 py-2.5 font-mono text-[0.68rem] text-muted">
        <span className="mono-label">{labels.hint}</span>
        <span aria-hidden="true" dir="ltr" className="flex items-center gap-3">
          <Legend swatch="bg-text" label="/map" />
          <Legend swatch="bg-[rgb(var(--tone-rose))]" label="/scan" />
          <Legend swatch="bg-[rgb(var(--tone-emerald))]" label="/plan" />
        </span>
      </div>
    </figure>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2 rounded-sm ${swatch}`} />
      {label}
    </span>
  )
}

