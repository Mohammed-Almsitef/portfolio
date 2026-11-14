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
import type { Palette3D, Scene3D } from '@/lib/slam3d'

/** Grid size in cells (10 cm each): a 7.2 m × 4.5 m floor, sized so the
 *  robot is large enough to show its parts. */
const W = 72
const H = 45

export type SlamLabels = {
  title: string
  hint: string
  aria: string
  newMap: string
  map: string
  /** Shown instead of `hint` once the 3D view is up on a mouse device. */
  hintDrag: string
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
  const glRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLSpanElement>(null)
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
    const gl = glRef.current
    const stage = stageRef.current
    if (!canvas || !gl || !stage) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const coarse = window.matchMedia('(pointer: coarse)').matches
    // The 3D scene, once loaded. Until then (or if WebGL is unavailable) the
    // 2D renderer below draws the same simulation.
    let r3: Scene3D | null = null
    let disposed = false

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
      r3?.resize(r.width, r.height, dpr)
    }

    const pal3 = (): Palette3D => ({ accent: pal.accent, scan: pal.scan, plan: pal.plan, ink })

    const draw = () => {
      if (r3) {
        const changed = sim.dirty
        if (changed) paintMap()
        r3.render(sim, changed)
      } else draw2d()
    }

    const draw2d = () => {
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

      // Drawn out to the lethal inflation radius, which the planner keeps clear,
      // so the larger body never visibly overlaps a wall.
      drawBurgerBot(ctx, P.x * c, P.y * c, P.th, ROBOT_RADIUS * c * 1.6, pal, ink, sim.time)
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
      // Two half-steps keep the controller stable on slow frames. Under
      // reduced motion the robot only moves on a visitor's goal; frames that
      // exist only because the view is being orbited leave it still.
      if (!reduced || sim.mode === 'navigating') {
        step(sim, dt / 2)
        step(sim, dt / 2)
      }
      if (sim.mode === 'complete') {
        if (completeAt < 0) completeAt = sim.time
        else if (sim.time - completeAt > 3.5) {
          completeAt = -1
          reset()
        }
      } else completeAt = -1
      if (reduced && sim.mode !== 'navigating' && !r3?.interacting()) animating = false
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
      r3?.setPalette(pal3())
      sim.dirty = true
      draw()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-accent'] })

    // A click (press and release without moving) sends a goal; a drag in 3D
    // orbits the camera instead.
    let down: { x: number; y: number } | null = null
    const onDown = (ev: PointerEvent) => {
      down = { x: ev.clientX, y: ev.clientY }
      if (r3) {
        animating = true
        schedule()
      }
    }
    const onUp = (ev: PointerEvent) => {
      if (!down) return
      const moved = Math.hypot(ev.clientX - down.x, ev.clientY - down.y)
      down = null
      if (moved > 6) return
      let target: { x: number; y: number } | null
      if (r3) target = r3.pick(ev.clientX, ev.clientY)
      else {
        const r = canvas.getBoundingClientRect()
        target = { x: ((ev.clientX - r.left) / r.width) * W, y: ((ev.clientY - r.top) / r.height) * H }
      }
      if (!target) return
      sendGoal(sim, target)
      animating = true
      hud(true)
      schedule()
    }
    stage.addEventListener('pointerdown', onDown)
    stage.addEventListener('pointerup', onUp)

    // Load the 3D view after first paint; keep 2D if anything goes wrong.
    import('@/lib/slam3d')
      .then((m) => {
        if (disposed) return
        try {
          r3 = m.createScene3D(gl, W, H, mapCanvas, pal3(), coarse)
        } catch {
          return
        }
        gl.dataset.ready = 'true'
        canvas.style.visibility = 'hidden'
        if (hintRef.current && !coarse) hintRef.current.textContent = labelsRef.current.hintDrag
        resize()
        sim.dirty = true
        draw()
      })
      .catch(() => {})

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      stage.removeEventListener('pointerdown', onDown)
      stage.removeEventListener('pointerup', onUp)
      disposed = true
      r3?.dispose()
    }
  }, [])

  return (
    <figure className="slam-panel glass relative overflow-hidden rounded-2xl">
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

      <div ref={stageRef} className="relative">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={labels.aria}
          className="block aspect-[72/45] w-full cursor-crosshair touch-manipulation"
        />
        {/* The 3D view takes over this space once WebGL is confirmed. */}
        <canvas
          ref={glRef}
          aria-hidden="true"
          className="absolute inset-0 size-full cursor-crosshair opacity-0 transition-opacity duration-700 data-[ready=true]:opacity-100 active:cursor-grabbing"
          style={{ touchAction: 'pan-y' }}
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
        <span ref={hintRef} className="mono-label">
          {labels.hint}
        </span>
        <span aria-hidden="true" dir="ltr" className="flex items-center gap-3">
          <Legend swatch="bg-text" label="/map" />
          <Legend swatch="bg-[rgb(var(--tone-rose))]" label="/scan" />
          <Legend swatch="bg-[rgb(var(--tone-emerald))]" label="/plan" />
        </span>
      </div>
    </figure>
  )
}

/**
 * The course's BurgerBot seen from above, in its real proportions: a 250 mm
 * round three-layer stack with two drive wheels on a 160 mm track, a front
 * caster, the Raspberry Pi and IMU on the middle layer, four support posts,
 * and a Ø76 mm LiDAR on top whose head spins. Local frame: +x forward.
 *
 * `R` is the plate radius in pixels. It is drawn larger than the planner's
 * footprint so the details read at hero size.
 */
function drawBurgerBot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  th: number,
  R: number,
  pal: Palette,
  ink: string,
  time: number,
) {
  const line = Math.max(1, R * 0.07)
  // Tyres, caster and LiDAR housing are black hardware in either theme; a
  // light rim keeps them legible on the dark ground.
  const rubber = 'rgb(18 20 26)'
  const rim = rgba(ink, 0.45)
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(th)

  // Soft glow under the robot so it stands off the map.
  const glow = ctx.createRadialGradient(0, 0, R * 0.4, 0, 0, R * 1.7)
  glow.addColorStop(0, rgba(pal.accent, 0.35))
  glow.addColorStop(1, rgba(pal.accent, 0))
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(0, 0, R * 1.7, 0, Math.PI * 2)
  ctx.fill()

  // Drive wheels (Ø66 × 18 mm, track 160 mm), poking out at the sides so
  // they read from above, with tread lines.
  const wl = R * 0.62
  const ww = R * 0.24
  for (const side of [-1, 1]) {
    const wy = side * R * 0.86
    ctx.fillStyle = rubber
    ctx.strokeStyle = rim
    ctx.lineWidth = Math.max(0.75, line * 0.5)
    ctx.beginPath()
    ctx.roundRect(-wl / 2, wy - ww / 2, wl, ww, ww * 0.35)
    ctx.fill()
    ctx.stroke()
    ctx.strokeStyle = rgba(ink, 0.25)
    ctx.lineWidth = Math.max(0.5, line * 0.5)
    ctx.beginPath()
    for (let k = 1; k < 5; k++) {
      const tx = -wl / 2 + (wl * k) / 5
      ctx.moveTo(tx, wy - ww / 2 + 1)
      ctx.lineTo(tx, wy + ww / 2 - 1)
    }
    ctx.stroke()
  }

  // Bottom plate.
  ctx.fillStyle = rgba(pal.accent, 0.22)
  ctx.strokeStyle = rgba(pal.accent, 1)
  ctx.lineWidth = line
  ctx.beginPath()
  ctx.arc(0, 0, R, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Middle layer, slightly inset, as seen through the stack.
  ctx.strokeStyle = rgba(pal.accent, 0.45)
  ctx.lineWidth = Math.max(0.75, line * 0.6)
  ctx.beginPath()
  ctx.arc(0, 0, R * 0.84, 0, Math.PI * 2)
  ctx.stroke()

  // Front caster.
  ctx.fillStyle = rubber
  ctx.strokeStyle = rim
  ctx.lineWidth = Math.max(0.75, line * 0.5)
  ctx.beginPath()
  ctx.arc(R * 0.7, 0, R * 0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Four support posts between the layers.
  ctx.fillStyle = rgba(pal.accent, 0.9)
  for (const a of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) {
    ctx.beginPath()
    ctx.arc(Math.cos(a) * R * 0.72, Math.sin(a) * R * 0.72, R * 0.06, 0, Math.PI * 2)
    ctx.fill()
  }

  // Raspberry Pi (85 × 56 mm), long side across the robot like the URDF.
  ctx.fillStyle = rgba(pal.plan, 0.28)
  ctx.strokeStyle = rgba(pal.plan, 0.85)
  ctx.lineWidth = Math.max(0.75, line * 0.6)
  ctx.beginPath()
  ctx.roundRect(R * 0.08 - R * 0.22, -R * 0.34, R * 0.45, R * 0.68, R * 0.05)
  ctx.fill()
  ctx.stroke()

  // IMU (30 × 27 mm), behind the Pi.
  ctx.fillStyle = rgba(pal.scan, 0.8)
  ctx.fillRect(-R * 0.26 - R * 0.12, -R * 0.11, R * 0.24, R * 0.22)

  // LiDAR on the top layer: housing, then a spinning head.
  ctx.fillStyle = rubber
  ctx.beginPath()
  ctx.arc(0, 0, R * 0.32, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = rgba(pal.accent, 0.9)
  ctx.lineWidth = Math.max(0.75, line * 0.6)
  ctx.stroke()
  const spin = time * 9
  ctx.strokeStyle = rgba(pal.scan, 1)
  ctx.lineWidth = Math.max(1, line * 0.9)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(Math.cos(spin) * R * 0.28, Math.sin(spin) * R * 0.28)
  ctx.stroke()
  ctx.fillStyle = rgba(pal.accent, 1)
  ctx.beginPath()
  ctx.arc(0, 0, R * 0.07, 0, Math.PI * 2)
  ctx.fill()

  // Heading notch at the front edge.
  ctx.fillStyle = rgba(pal.accent, 1)
  ctx.beginPath()
  ctx.moveTo(R * 1.12, 0)
  ctx.lineTo(R * 0.9, -R * 0.13)
  ctx.lineTo(R * 0.9, R * 0.13)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2 rounded-sm ${swatch}`} />
      {label}
    </span>
  )
}

