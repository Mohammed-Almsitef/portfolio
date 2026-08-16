'use client'

import { useEffect, useRef } from 'react'

/** A wall footprint on the ground plane, extruded to `h`. */
type Seg = { x1: number; z1: number; x2: number; z2: number; h: number }

/** An axis-aligned obstacle the perception stack reports as a detection. */
type Box = { minX: number; maxX: number; minZ: number; maxZ: number; h: number; label: string }

/** Fallbacks until the themed values are read from CSS. */
const INK_FALLBACK: RGB = [96, 165, 250]
const LOW_FALLBACK: RGB = [167, 139, 250]
const HIGH_FALLBACK: RGB = [45, 212, 191]

type RGB = [number, number, number]

const SPIN_SPEED = 3.4 // sensor azimuth, radians per second
const DRIVE_SPEED = 0.16 // robot progress along its loop, radians per second
const TRAIL = 9000 // retained returns — the accumulated map
const MAX_DIST = 1.1 // sensor range, scene units
const SENSOR_H = 0.135 // sensor height above the floor — the head of the mast
const WALL_H = 0.3

/** Vertical channels, as a real spinning multi-beam unit has. */
const CHANNELS = Array.from({ length: 16 }, (_, i) => -0.5 + (i / 15) * 0.66)

/**
 * Simulated 3D LiDAR seen the way a robot sees it: a spinning multi-channel
 * sensor rides a robot driving a loop, and its returns accumulate in the world
 * frame into a height-coloured map. Ground returns are segmented from
 * obstacle returns, and standing obstacles are reported as tracked detections.
 *
 * Scene coords are normalized — X/Z span 0..1 on the ground plane, Y is up —
 * so the layout survives any canvas size.
 *
 * The plan is a closed enclosure on purpose: it guarantees rays terminate on
 * a surface, so the map reads as a scanned volume rather than a scattering of
 * disconnected fragments.
 */
function wall(x1: number, z1: number, x2: number, z2: number, h = WALL_H): Seg {
  return { x1, z1, x2, z2, h }
}

/** Four walls closing a footprint, so boxes can be both geometry and detection. */
function boxWalls(b: Box): Seg[] {
  return [
    wall(b.minX, b.minZ, b.maxX, b.minZ, b.h),
    wall(b.maxX, b.minZ, b.maxX, b.maxZ, b.h),
    wall(b.maxX, b.maxZ, b.minX, b.maxZ, b.h),
    wall(b.minX, b.maxZ, b.minX, b.minZ, b.h),
  ]
}

const BOXES: Box[] = [
  { minX: 0.22, maxX: 0.4, minZ: 0.5, maxZ: 0.62, h: 0.22, label: 'OBJ 01' },
  { minX: 0.5, maxX: 0.58, minZ: 0.2, maxZ: 0.28, h: 0.17, label: 'OBJ 02' },
  { minX: 0.78, maxX: 0.86, minZ: 0.66, maxZ: 0.74, h: 0.2, label: 'OBJ 03' },
]

const SCENE: Seg[] = [
  // outer boundary
  wall(0.08, 0.08, 0.92, 0.08),
  wall(0.92, 0.08, 0.92, 0.92),
  wall(0.92, 0.92, 0.08, 0.92),
  wall(0.08, 0.92, 0.08, 0.08),
  // interior partitions, at mixed heights so the colour ramp carries meaning
  wall(0.32, 0.08, 0.32, 0.38, 0.26),
  wall(0.08, 0.38, 0.32, 0.38, 0.26),
  wall(0.68, 0.08, 0.68, 0.3, 0.24),
  wall(0.6, 0.45, 0.92, 0.45, 0.24),
  wall(0.72, 0.62, 0.72, 0.92, 0.28),
  wall(0.2, 0.74, 0.46, 0.74, 0.22),
  // the tracked obstacles
  ...BOXES.flatMap(boxWalls),
]

/** The robot's closed patrol loop, threaded through open floor. */
const PATH = { cx: 0.53, cz: 0.6, rx: 0.11, rz: 0.085 }

const TARGET = { x: 0.5, y: 0.1, z: 0.5 }
/** Unit axes of the ground plane, for circles that lie flat on the floor. */
const XZ_A = [1, 0, 0] as const
const XZ_B = [0, 0, 1] as const
const UP = [0, 1, 0] as const

const CAM_DIST = 1.9
const CAM_ELEV = 0.72 // radians above the horizon — high enough to read the plan
const FOCAL = 1.15

/** Colour ramp resolution. Points are bucketed so fillStyle is set per bucket. */
const RAMP_STEPS = 12
const FADE_STEPS = 5

function parseRGB(value: string, fallback: RGB): RGB {
  const parts = value.trim().split(/[\s,]+/).map(Number)
  if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) return fallback
  return [parts[0], parts[1], parts[2]]
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

export default function LidarBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const parallaxRef = useRef<HTMLDivElement>(null)
  const inkRef = useRef<RGB>(INK_FALLBACK)
  const lowRef = useRef<RGB>(LOW_FALLBACK)
  const highRef = useRef<RGB>(HIGH_FALLBACK)

  // Canvas can't inherit a CSS colour, so the themed inks are read from the
  // custom properties and re-read whenever the theme changes.
  useEffect(() => {
    const read = () => {
      const s = getComputedStyle(document.documentElement)
      inkRef.current = parseRGB(s.getPropertyValue('--canvas-ink'), INK_FALLBACK)
      lowRef.current = parseRGB(s.getPropertyValue('--tone-violet'), LOW_FALLBACK)
      highRef.current = parseRGB(s.getPropertyValue('--tone-teal'), HIGH_FALLBACK)
    }
    read()

    // `style` as well as `data-theme`: the accent is retinted by writing
    // `--accent-tone` inline on <html>, and canvas colours are copied at read
    // time rather than inherited, so without this the scan keeps the old hue.
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style'],
    })
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
    let azimuth = 0
    let phi = 0 // robot progress along its loop
    let elapsed = 0
    let last = performance.now()

    // World-frame returns. `g` marks a ground-plane hit, which the segmenter
    // renders differently from an obstacle return.
    const points: { x: number; y: number; z: number; g: boolean }[] = []

    // Odometry breadcrumb: where the robot has actually been, sampled at a
    // fixed interval so the trail length is frame-rate independent.
    const odom: { x: number; z: number }[] = []
    let odomClock = 0

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

    // Camera state, recomputed once per frame rather than per projected point.
    let yaw = 0
    let sinYaw = 0
    let cosYaw = 1
    const sinElev = Math.sin(CAM_ELEV)
    const cosElev = Math.cos(CAM_ELEV)

    /**
     * Scene point to screen. Yaw orbits the world about the target, then a
     * fixed elevation tips the camera down; `depth` is returned so callers can
     * fade distant geometry.
     */
    const project = (px: number, py: number, pz: number) => {
      const dx = px - TARGET.x
      const dy = py - TARGET.y
      const dz = pz - TARGET.z

      const rx = dx * cosYaw - dz * sinYaw
      const rz = dx * sinYaw + dz * cosYaw

      // Camera sits at target + CAM_DIST along (0, sinElev, cosElev).
      const vy = dy - CAM_DIST * sinElev
      const vz = rz - CAM_DIST * cosElev

      // Distance along the camera's forward axis, (0, -sinElev, -cosElev).
      const depth = -(vy * sinElev + vz * cosElev)
      if (depth < 0.05) return null

      const cy = vy * cosElev - vz * sinElev

      return {
        x: w / 2 + (rx * FOCAL * scale) / depth,
        y: h / 2 - (cy * FOCAL * scale) / depth,
        depth,
      }
    }

    const line = (ax: number, ay: number, az: number, bx: number, by: number, bz: number) => {
      const a = project(ax, ay, az)
      const b = project(bx, by, bz)
      if (!a || !b) return
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
    }

    /**
     * Circle in the plane spanned by unit vectors `a` and `b`, added to the
     * current path. Used for wheels (vertical plane) and the sensor housing
     * (horizontal plane), so both tilt correctly with the camera.
     */
    const circle3 = (
      cx: number,
      cy: number,
      cz: number,
      r: number,
      a: readonly [number, number, number],
      b: readonly [number, number, number],
      segs = 20,
    ) => {
      let started = false
      for (let i = 0; i <= segs; i++) {
        const t = (i / segs) * Math.PI * 2
        const co = Math.cos(t) * r
        const si = Math.sin(t) * r
        const s = project(
          cx + a[0] * co + b[0] * si,
          cy + a[1] * co + b[1] * si,
          cz + a[2] * co + b[2] * si,
        )
        if (!s) {
          started = false
          continue
        }
        if (started) ctx.lineTo(s.x, s.y)
        else {
          ctx.moveTo(s.x, s.y)
          started = true
        }
      }
    }

    /** Oriented box on the ground plane, added to the current path. */
    const box3 = (
      cx: number,
      cz: number,
      fwd: readonly [number, number],
      side: readonly [number, number],
      halfL: number,
      halfW: number,
      y0: number,
      y1: number,
    ) => {
      const signs: [number, number][] = [
        [1, 1],
        [1, -1],
        [-1, -1],
        [-1, 1],
      ]
      const pts = signs.map(([f, s]) => [
        cx + fwd[0] * halfL * f + side[0] * halfW * s,
        cz + fwd[1] * halfL * f + side[1] * halfW * s,
      ])
      for (let i = 0; i < 4; i++) {
        const p = pts[i]
        const q = pts[(i + 1) % 4]
        line(p[0], y0, p[1], q[0], y0, q[1])
        line(p[0], y1, p[1], q[0], y1, q[1])
        line(p[0], y0, p[1], p[0], y1, p[1])
      }
    }

    /** Where the robot is, and which way it faces, at loop parameter `p`. */
    const poseAt = (p: number) => {
      const x = PATH.cx + Math.cos(p) * PATH.rx
      const z = PATH.cz + Math.sin(p) * PATH.rz
      // Tangent of the ellipse — the direction of travel.
      const heading = Math.atan2(Math.cos(p) * PATH.rz, -Math.sin(p) * PATH.rx)
      return { x, z, heading }
    }

    /**
     * Horizontal distance to the first surface along an azimuth/pitch pair,
     * cast from the sensor's current pose.
     *
     * Walls are tested in 2D on the ground plane, then height-checked: a ray
     * that clears the top of a low obstacle flies over it and keeps going,
     * which is what makes this read as 3D rather than an extruded 2D scan.
     * The floor is a plane test, and whichever comes first wins.
     */
    const castRay = (ox: number, oz: number, azi: number, pitch: number) => {
      const dx = Math.cos(azi)
      const dz = Math.sin(azi)
      const slope = Math.tan(pitch)
      let best = MAX_DIST
      let ground = false

      for (const s of SCENE) {
        const sx = s.x2 - s.x1
        const sz = s.z2 - s.z1
        const denom = dx * sz - dz * sx
        if (Math.abs(denom) < 1e-9) continue

        const t = ((s.x1 - ox) * sz - (s.z1 - oz) * sx) / denom
        const u = ((s.x1 - ox) * dz - (s.z1 - oz) * dx) / denom
        if (t <= 0 || t >= best || u < 0 || u > 1) continue

        const y = SENSOR_H + t * slope
        if (y < 0 || y > s.h) continue // over the top, or below the floor
        best = t
        ground = false
      }

      if (slope < 0) {
        const tFloor = -SENSOR_H / slope
        if (tFloor > 0 && tFloor < best) {
          best = tFloor
          ground = true
        }
      }

      return { dist: best, ground }
    }

    const sampleRing = (pose: { x: number; z: number }, azi: number) => {
      for (const pitch of CHANNELS) {
        const hit = castRay(pose.x, pose.z, azi, pitch)
        if (hit.dist >= MAX_DIST) continue
        points.push({
          x: pose.x + Math.cos(azi) * hit.dist,
          y: SENSOR_H + hit.dist * Math.tan(pitch),
          z: pose.z + Math.sin(azi) * hit.dist,
          g: hit.ground,
        })
      }
    }

    // Bucketed point rendering: setting fillStyle per point would mean parsing
    // thousands of colour strings each frame. Points are binned by ramp step
    // and age instead, so fillStyle is set once per bin.
    const bins: number[][] = Array.from(
      { length: (RAMP_STEPS + 1) * FADE_STEPS },
      () => [],
    )
    const styles: string[] = new Array(bins.length).fill('')

    const buildStyles = () => {
      const ink = inkRef.current
      const low = lowRef.current
      const high = highRef.current
      for (let c = 0; c < RAMP_STEPS; c++) {
        // Height ramp, low to high, through the sensor ink at mid.
        const t = RAMP_STEPS > 1 ? c / (RAMP_STEPS - 1) : 0
        const rgb = t < 0.5 ? mix(low, ink, t * 2) : mix(ink, high, (t - 0.5) * 2)
        for (let f = 0; f < FADE_STEPS; f++) {
          const a = 0.16 + (f / (FADE_STEPS - 1)) * 0.62
          styles[c * FADE_STEPS + f] = `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]} / ${a.toFixed(2)})`
        }
      }
      // Last row is the segmented ground plane: uncoloured and held back, the
      // way a perception stack de-emphasises drivable surface.
      for (let f = 0; f < FADE_STEPS; f++) {
        const a = 0.07 + (f / (FADE_STEPS - 1)) * 0.16
        styles[RAMP_STEPS * FADE_STEPS + f] =
          `rgb(${ink[0]} ${ink[1]} ${ink[2]} / ${a.toFixed(2)})`
      }
    }

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (!reduced) elapsed += dt

      const ink = inkRef.current
      const inkStr = `${ink[0]} ${ink[1]} ${ink[2]}`
      buildStyles()

      // A slow orbit is what sells the third dimension — a static projection
      // of a 3D cloud is hard to tell from a clever 2D drawing.
      yaw = 0.5 + Math.sin(elapsed * 0.11) * 0.4
      sinYaw = Math.sin(yaw)
      cosYaw = Math.cos(yaw)

      ctx.clearRect(0, 0, w, h)

      if (!reduced) phi += DRIVE_SPEED * dt
      const pose = poseAt(phi)

      // Ground grid, for a readable floor plane under the map.
      ctx.lineWidth = 1
      ctx.strokeStyle = `rgb(${inkStr} / 0.06)`
      ctx.beginPath()
      for (let i = 0; i <= 7; i++) {
        const t = 0.08 + (i / 7) * 0.84
        line(t, 0, 0.08, t, 0, 0.92)
        line(0.08, 0, t, 0.92, 0, t)
      }
      ctx.stroke()

      // Wall wireframe: base, cap, and the vertical edges that give it height.
      ctx.strokeStyle = `rgb(${inkStr} / 0.13)`
      ctx.beginPath()
      for (const s of SCENE) {
        line(s.x1, 0, s.z1, s.x2, 0, s.z2)
        line(s.x1, s.h, s.z1, s.x2, s.h, s.z2)
        line(s.x1, 0, s.z1, s.x1, s.h, s.z1)
        line(s.x2, 0, s.z2, s.x2, s.h, s.z2)
      }
      ctx.stroke()

      // Global plan: the whole loop the robot intends to follow, on the floor.
      ctx.strokeStyle = `rgb(${inkStr} / 0.22)`
      ctx.setLineDash([4, 6])
      ctx.beginPath()
      for (let i = 0; i <= 64; i++) {
        const p = poseAt((i / 64) * Math.PI * 2)
        const s = project(p.x, 0.002, p.z)
        if (!s) continue
        if (i === 0) ctx.moveTo(s.x, s.y)
        else ctx.lineTo(s.x, s.y)
      }
      ctx.stroke()
      ctx.setLineDash([])

      // Local plan: the stretch immediately ahead of the robot, solid and
      // brighter, ending at the lookahead goal it is currently steering for.
      const LOOKAHEAD = 1.5 // radians of the loop
      ctx.strokeStyle = `rgb(${inkStr} / 0.55)`
      ctx.lineWidth = 1.6
      ctx.beginPath()
      for (let i = 0; i <= 24; i++) {
        const p = poseAt(phi + (i / 24) * LOOKAHEAD)
        const s = project(p.x, 0.003, p.z)
        if (!s) continue
        if (i === 0) ctx.moveTo(s.x, s.y)
        else ctx.lineTo(s.x, s.y)
      }
      ctx.stroke()

      const goal = poseAt(phi + LOOKAHEAD)
      ctx.strokeStyle = `rgb(${inkStr} / 0.6)`
      ctx.lineWidth = 1.3
      ctx.beginPath()
      circle3(goal.x, 0.003, goal.z, 0.016, XZ_A, XZ_B, 16)
      ctx.stroke()

      if (!reduced) {
        azimuth += SPIN_SPEED * dt
        if (azimuth > Math.PI * 2) azimuth -= Math.PI * 2

        // A few azimuth samples per frame so the map fills in smoothly
        // regardless of frame rate.
        for (let i = 0; i < 3; i++) sampleRing(pose, azimuth + i * 0.02)
        while (points.length > TRAIL) points.shift()
      } else if (points.length === 0) {
        for (let a = 0; a < Math.PI * 2; a += 0.012) sampleRing(pose, a)
      }

      // Active fan: the beams currently leaving the sensor.
      if (!reduced) {
        ctx.strokeStyle = `rgb(${inkStr} / 0.13)`
        ctx.lineWidth = 1
        ctx.beginPath()
        for (const pitch of CHANNELS) {
          const hit = castRay(pose.x, pose.z, azimuth, pitch)
          if (hit.dist >= MAX_DIST) continue
          line(
            pose.x,
            SENSOR_H,
            pose.z,
            pose.x + Math.cos(azimuth) * hit.dist,
            SENSOR_H + hit.dist * Math.tan(pitch),
            pose.z + Math.sin(azimuth) * hit.dist,
          )
        }
        ctx.stroke()
      }

      // Point cloud, binned by height and age. Squares rather than arcs: at
      // several thousand points a frame, arc() path setup dominates.
      for (const b of bins) b.length = 0
      const n = points.length
      for (let i = 0; i < n; i++) {
        const p = points[i]
        const s = project(p.x, p.y, p.z)
        if (!s) continue
        const life = n > 1 ? i / (n - 1) : 1
        const f = Math.min(FADE_STEPS - 1, (life * FADE_STEPS) | 0)
        const c = p.g
          ? RAMP_STEPS
          : Math.min(RAMP_STEPS - 1, ((p.y / WALL_H) * RAMP_STEPS) | 0)
        const bin = bins[c * FADE_STEPS + f]
        bin.push(s.x, s.y)
      }
      for (let i = 0; i < bins.length; i++) {
        const bin = bins[i]
        if (!bin.length) continue
        ctx.fillStyle = styles[i]
        const size = i >= RAMP_STEPS * FADE_STEPS ? 1.1 : 1.6
        const half = size / 2
        for (let j = 0; j < bin.length; j += 2) {
          ctx.fillRect(bin[j] - half, bin[j + 1] - half, size, size)
        }
      }

      // Detections: obstacles the stack is tracking, boxed once they are close
      // enough to have been scanned, fading in the way a real track does.
      ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace'
      for (const b of BOXES) {
        const cxB = (b.minX + b.maxX) / 2
        const czB = (b.minZ + b.maxZ) / 2
        const d = Math.hypot(cxB - pose.x, czB - pose.z)
        const conf = Math.max(0, Math.min(1, (MAX_DIST + 0.15 - d) / 0.45))
        if (conf <= 0.01) continue

        ctx.strokeStyle = `rgb(${inkStr} / ${(0.5 * conf).toFixed(2)})`
        ctx.lineWidth = 1.2
        ctx.beginPath()
        for (const y of [0, b.h]) {
          line(b.minX, y, b.minZ, b.maxX, y, b.minZ)
          line(b.maxX, y, b.minZ, b.maxX, y, b.maxZ)
          line(b.maxX, y, b.maxZ, b.minX, y, b.maxZ)
          line(b.minX, y, b.maxZ, b.minX, y, b.minZ)
        }
        line(b.minX, 0, b.minZ, b.minX, b.h, b.minZ)
        line(b.maxX, 0, b.minZ, b.maxX, b.h, b.minZ)
        line(b.maxX, 0, b.maxZ, b.maxX, b.h, b.maxZ)
        line(b.minX, 0, b.maxZ, b.minX, b.h, b.maxZ)
        ctx.stroke()

        const tag = project(cxB, b.h + 0.05, czB)
        if (tag) {
          ctx.fillStyle = `rgb(${inkStr} / ${(0.45 * conf).toFixed(2)})`
          ctx.fillText(b.label, tag.x + 6, tag.y)
          ctx.strokeStyle = `rgb(${inkStr} / ${(0.28 * conf).toFixed(2)})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(tag.x, tag.y + 2)
          ctx.lineTo(tag.x + 4, tag.y + 2)
          ctx.stroke()
        }
      }

      // The robot: a differential-drive base carrying the spinning sensor on a
      // mast. Drawn brighter than the map so it stays the clear subject.
      const fwd = [Math.cos(pose.heading), Math.sin(pose.heading)] as const
      const side = [-fwd[1], fwd[0]] as const
      const fwdV = [fwd[0], 0, fwd[1]] as const

      // Odometry breadcrumb, oldest to newest.
      if (!reduced) {
        odomClock += dt
        if (odomClock > 0.15) {
          odomClock = 0
          odom.push({ x: pose.x, z: pose.z })
          if (odom.length > 240) odom.shift()
        }
      }
      if (odom.length > 1) {
        ctx.strokeStyle = `rgb(${inkStr} / 0.3)`
        ctx.lineWidth = 1.2
        ctx.beginPath()
        let started = false
        for (const o of odom) {
          const s = project(o.x, 0.004, o.z)
          if (!s) {
            started = false
            continue
          }
          if (started) ctx.lineTo(s.x, s.y)
          else {
            ctx.moveTo(s.x, s.y)
            started = true
          }
        }
        ctx.stroke()
      }

      ctx.strokeStyle = `rgb(${inkStr} / 0.75)`
      ctx.lineWidth = 1.3
      ctx.beginPath()
      // Chassis, riding above the wheel centres.
      box3(pose.x, pose.z, fwd, side, 0.036, 0.026, 0.024, 0.062)
      // Mast up to the sensor.
      box3(pose.x, pose.z, fwd, side, 0.007, 0.007, 0.062, 0.125)
      ctx.stroke()

      // Wheels: vertical discs, spanned by forward and up. Four of them reads
      // unambiguously as a wheeled base at this scale; two does not.
      ctx.strokeStyle = `rgb(${inkStr} / 0.6)`
      ctx.lineWidth = 1.1
      ctx.beginPath()
      for (const sgn of [1, -1]) {
        for (const f of [1, -1]) {
          circle3(
            pose.x + side[0] * 0.028 * sgn + fwd[0] * 0.02 * f,
            0.014,
            pose.z + side[1] * 0.028 * sgn + fwd[1] * 0.02 * f,
            0.014,
            fwdV,
            UP,
            12,
          )
        }
      }
      ctx.stroke()

      // Sensor housing: a short cylinder with a rotating index mark, so the
      // beam fan visibly leaves the part of the robot that is spinning.
      ctx.strokeStyle = `rgb(${inkStr} / 0.85)`
      ctx.lineWidth = 1.2
      ctx.beginPath()
      circle3(pose.x, 0.125, pose.z, 0.019, XZ_A, XZ_B)
      circle3(pose.x, 0.147, pose.z, 0.019, XZ_A, XZ_B)
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        const px = pose.x + Math.cos(a) * 0.019
        const pz = pose.z + Math.sin(a) * 0.019
        line(px, 0.125, pz, px, 0.147, pz)
      }
      line(
        pose.x,
        SENSOR_H,
        pose.z,
        pose.x + Math.cos(azimuth) * 0.019,
        SENSOR_H,
        pose.z + Math.sin(azimuth) * 0.019,
      )
      ctx.stroke()

      // Body-frame axis triad: X forward, Y left, Z up — the convention any
      // robotics tool draws at a link origin.
      const low = lowRef.current
      const high = highRef.current
      const axes: [number, number, number, RGB][] = [
        [fwd[0] * 0.075, 0, fwd[1] * 0.075, high],
        [side[0] * 0.055, 0, side[1] * 0.055, low],
        [0, 0.055, 0, ink],
      ]
      // Anchored at the floor: X and Y then lie flat where they read clearly,
      // rather than being swallowed by the chassis and mast.
      ctx.lineWidth = 1.6
      for (const [ax, ay, az, col] of axes) {
        ctx.strokeStyle = `rgb(${col[0]} ${col[1]} ${col[2]} / 0.85)`
        ctx.beginPath()
        line(pose.x, 0.006, pose.z, pose.x + ax, 0.006 + ay, pose.z + az)
        ctx.stroke()
      }

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
      className="lidar-mask pointer-events-none absolute inset-y-0 end-0 w-full overflow-hidden opacity-20 md:w-[56%] md:opacity-45 lg:opacity-70 xl:opacity-100"
      aria-hidden="true"
    >
      <div ref={parallaxRef} className="size-full">
        <canvas ref={canvasRef} className="size-full" />
      </div>
    </div>
  )
}
