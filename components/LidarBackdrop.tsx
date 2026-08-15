'use client'

import { useEffect, useRef } from 'react'

/**
 * A wall footprint on the ground plane, occupying the height band y0..h.
 * A non-zero `y0` lets beams pass underneath, which is how a hovering drone
 * casts a shadow on the wall behind it but not on the floor below it.
 */
type Seg = { x1: number; z1: number; x2: number; z2: number; h: number; y0: number }

/** An axis-aligned obstacle the perception stack reports as a detection. */
type Box = { minX: number; maxX: number; minZ: number; maxZ: number; h: number; y0?: number }

/** The machines populating the room. Each is scanned, tracked, and drawn. */
type PropKind = 'drone' | 'arm' | 'quadruped' | 'humanoid' | 'agv'
type Prop = {
  kind: PropKind
  x: number
  z: number
  yaw: number
  label: string
  /** Phase offset so identical machines do not animate in lockstep. */
  phase: number
  /** What the sensor can actually hit. */
  hull: Box
}

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
function wall(x1: number, z1: number, x2: number, z2: number, h = WALL_H, y0 = 0): Seg {
  return { x1, z1, x2, z2, h, y0 }
}

/** Four walls closing a footprint, so a box is both geometry and scan target. */
function boxWalls(b: Box): Seg[] {
  const y0 = b.y0 ?? 0
  return [
    wall(b.minX, b.minZ, b.maxX, b.minZ, b.h, y0),
    wall(b.maxX, b.minZ, b.maxX, b.maxZ, b.h, y0),
    wall(b.maxX, b.maxZ, b.minX, b.maxZ, b.h, y0),
    wall(b.minX, b.maxZ, b.minX, b.minZ, b.h, y0),
  ]
}

/** Crates and pillars — scenery, not tracked. */
const FURNITURE: Box[] = [
  { minX: 0.22, maxX: 0.4, minZ: 0.5, maxZ: 0.62, h: 0.22 },
  { minX: 0.78, maxX: 0.86, minZ: 0.66, maxZ: 0.74, h: 0.2 },
]

/**
 * A mixed fleet, placed in open floor clear of the walls and the patrol loop.
 * Each hull is the volume the sensor sees; the drone's floats above the floor.
 */
const PROPS: Prop[] = [
  {
    kind: 'arm',
    x: 0.19,
    z: 0.22,
    yaw: 0.6,
    label: 'ARM',
    phase: 0,
    hull: { minX: 0.15, maxX: 0.23, minZ: 0.18, maxZ: 0.26, h: 0.2 },
  },
  {
    kind: 'humanoid',
    x: 0.44,
    z: 0.16,
    yaw: 2.3,
    label: 'HUMANOID',
    phase: 1.1,
    hull: { minX: 0.41, maxX: 0.47, minZ: 0.13, maxZ: 0.19, h: 0.26 },
  },
  {
    kind: 'drone',
    x: 0.82,
    z: 0.22,
    yaw: -0.5,
    label: 'UAV',
    phase: 2.2,
    hull: { minX: 0.77, maxX: 0.87, minZ: 0.17, maxZ: 0.27, h: 0.245, y0: 0.195 },
  },
  {
    kind: 'quadruped',
    x: 0.165,
    z: 0.55,
    yaw: -0.9,
    label: 'QUADRUPED',
    phase: 3.3,
    hull: { minX: 0.12, maxX: 0.21, minZ: 0.51, maxZ: 0.59, h: 0.12 },
  },
  {
    kind: 'agv',
    x: 0.56,
    z: 0.85,
    yaw: 0.25,
    label: 'AGV',
    phase: 4.4,
    hull: { minX: 0.52, maxX: 0.6, minZ: 0.82, maxZ: 0.88, h: 0.07 },
  },
]

/** The room itself — the only geometry drawn as a wireframe. */
const WALLS: Seg[] = [
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
  ...FURNITURE.flatMap(boxWalls),
]

/**
 * What the sensor can hit. The machines contribute simple hulls rather than
 * their drawn wireframes: the point cloud should outline them without a
 * bounding box being drawn around each one.
 */
const SCENE: Seg[] = [...WALLS, ...PROPS.flatMap((p) => boxWalls(p.hull))]

/** The robot's closed patrol loop, threaded through open floor. */
const PATH = { cx: 0.53, cz: 0.6, rx: 0.11, rz: 0.085 }

const TARGET = { x: 0.5, y: 0.1, z: 0.5 }
/** Unit axes of the ground plane, for circles that lie flat on the floor. */
const XZ_A = [1, 0, 0] as const
const XZ_B = [0, 0, 1] as const
const UP = [0, 1, 0] as const
/** Fore/aft × left/right sign pairs, for legs, wheels and rotors. */
const CORNERS: readonly (readonly [number, number])[] = [
  [1, 1],
  [1, -1],
  [-1, -1],
  [-1, 1],
]

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

    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
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
        if (y < s.y0 || y > s.h) continue // over the top, or under the body
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

    /**
     * One machine, as a wireframe added to the current path. Each type moves a
     * little — a still room reads as a diagram, a moving one as a workspace.
     */
    const drawProp = (p: Prop, t: number) => {
      const fwd = [Math.cos(p.yaw), Math.sin(p.yaw)] as const
      const side = [-fwd[1], fwd[0]] as const
      const fwdV = [fwd[0], 0, fwd[1]] as const
      const ph = t + p.phase

      switch (p.kind) {
        case 'drone': {
          // Hover bob, and rotors that actually turn.
          const y = 0.205 + Math.sin(ph * 1.7) * 0.012
          box3(p.x, p.z, fwd, side, 0.022, 0.016, y, y + 0.02)
          for (const [f, s] of CORNERS) {
            const ax = p.x + fwd[0] * 0.036 * f + side[0] * 0.036 * s
            const az = p.z + fwd[1] * 0.036 * f + side[1] * 0.036 * s
            line(p.x, y + 0.01, p.z, ax, y + 0.014, az)
            circle3(ax, y + 0.018, az, 0.019, XZ_A, XZ_B, 12)
            const spin = ph * 9 + f + s
            const bx = Math.cos(spin) * 0.019
            const bz = Math.sin(spin) * 0.019
            line(ax - bx, y + 0.018, az - bz, ax + bx, y + 0.018, az + bz)
          }
          for (const s of [1, -1]) {
            const sx = p.x + side[0] * 0.013 * s
            const sz = p.z + side[1] * 0.013 * s
            line(sx, y, sz, sx, y - 0.02, sz)
            line(
              sx + fwd[0] * 0.018,
              y - 0.02,
              sz + fwd[1] * 0.018,
              sx - fwd[0] * 0.018,
              y - 0.02,
              sz - fwd[1] * 0.018,
            )
          }
          break
        }

        case 'arm': {
          // A two-link manipulator sweeping through its workspace.
          // Kept well off vertical so the elbow is always visible — a folded
          // arm at this scale is indistinguishable from a pole.
          const j1 = 0.95 + Math.sin(ph * 0.5) * 0.4
          const j2 = j1 - 1.6 + Math.sin(ph * 0.5 + 1.2) * 0.5
          const r = 0.028
          circle3(p.x, 0.002, p.z, r, XZ_A, XZ_B, 16)
          circle3(p.x, 0.03, p.z, r * 0.8, XZ_A, XZ_B, 16)
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2
            line(
              p.x + Math.cos(a) * r,
              0.002,
              p.z + Math.sin(a) * r,
              p.x + Math.cos(a) * r * 0.8,
              0.03,
              p.z + Math.sin(a) * r * 0.8,
            )
          }
          const sy = 0.06
          const ex = p.x + fwd[0] * Math.sin(j1) * 0.085
          const ey = sy + Math.cos(j1) * 0.085
          const ez = p.z + fwd[1] * Math.sin(j1) * 0.085
          const wx = ex + fwd[0] * Math.sin(j2) * 0.07
          const wy = ey + Math.cos(j2) * 0.07
          const wz = ez + fwd[1] * Math.sin(j2) * 0.07
          line(p.x, 0.03, p.z, p.x, sy, p.z)
          // Links as pairs of rails rather than bare lines, so they read as
          // structure; discs mark the revolute joints between them.
          for (const s of [1, -1]) {
            const ox = side[0] * 0.007 * s
            const oz = side[1] * 0.007 * s
            line(p.x + ox, sy, p.z + oz, ex + ox, ey, ez + oz)
            line(ex + ox, ey, ez + oz, wx + ox, wy, wz + oz)
          }
          circle3(p.x, sy, p.z, 0.013, fwdV, UP, 10)
          circle3(ex, ey, ez, 0.011, fwdV, UP, 10)
          for (const s of [1, -1]) {
            line(
              wx,
              wy,
              wz,
              wx + side[0] * 0.012 * s + fwd[0] * 0.012,
              wy - 0.005,
              wz + side[1] * 0.012 * s + fwd[1] * 0.012,
            )
          }
          break
        }

        case 'quadruped': {
          const bodyY = 0.075 + Math.sin(ph * 1.4) * 0.005
          box3(p.x, p.z, fwd, side, 0.042, 0.024, bodyY, bodyY + 0.03)
          box3(
            p.x + fwd[0] * 0.05,
            p.z + fwd[1] * 0.05,
            fwd,
            side,
            0.014,
            0.012,
            bodyY + 0.008,
            bodyY + 0.032,
          )
          CORNERS.forEach(([f, s], i) => {
            // Diagonal pairs in phase, as a trotting gait actually runs.
            const gait = Math.sin(ph * 2.6 + i * (Math.PI / 2)) * 0.018
            const hipX = p.x + fwd[0] * 0.032 * f + side[0] * 0.022 * s
            const hipZ = p.z + fwd[1] * 0.032 * f + side[1] * 0.022 * s
            const kneeX = hipX + fwd[0] * 0.015
            const kneeZ = hipZ + fwd[1] * 0.015
            line(hipX, bodyY, hipZ, kneeX, bodyY * 0.5, kneeZ)
            line(
              kneeX,
              bodyY * 0.5,
              kneeZ,
              hipX + fwd[0] * gait,
              0.002,
              hipZ + fwd[1] * gait,
            )
          })
          break
        }

        case 'humanoid': {
          const swing = Math.sin(ph * 1.1) * 0.014
          const hip = 0.12
          const sh = 0.2
          for (const s of [1, -1]) {
            const hx = p.x + side[0] * 0.012 * s
            const hz = p.z + side[1] * 0.012 * s
            line(hx, hip, hz, hx + fwd[0] * swing * s, 0.002, hz + fwd[1] * swing * s)
          }
          box3(p.x, p.z, fwd, side, 0.012, 0.026, hip, sh)
          line(p.x, sh, p.z, p.x, sh + 0.008, p.z)
          box3(p.x, p.z, fwd, side, 0.011, 0.011, sh + 0.008, sh + 0.032)
          for (const s of [1, -1]) {
            const ax = p.x + side[0] * 0.028 * s
            const az = p.z + side[1] * 0.028 * s
            // Arms counter-swing against the legs.
            line(ax, sh, az, ax - fwd[0] * swing * s, hip + 0.012, az - fwd[1] * swing * s)
          }
          break
        }

        case 'agv': {
          // A low deck transport carrying a load — no mast, no sensor.
          box3(p.x, p.z, fwd, side, 0.04, 0.028, 0.018, 0.048)
          box3(p.x, p.z, fwd, side, 0.026, 0.02, 0.048, 0.073)
          for (const [f, s] of CORNERS) {
            circle3(
              p.x + side[0] * 0.03 * s + fwd[0] * 0.024 * f,
              0.014,
              p.z + side[1] * 0.03 * s + fwd[1] * 0.024 * f,
              0.013,
              fwdV,
              UP,
              10,
            )
          }
          break
        }
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
      for (const s of WALLS) {
        line(s.x1, s.y0, s.z1, s.x2, s.y0, s.z2)
        line(s.x1, s.h, s.z1, s.x2, s.h, s.z2)
        line(s.x1, s.y0, s.z1, s.x1, s.h, s.z1)
        line(s.x2, s.y0, s.z2, s.x2, s.h, s.z2)
      }
      ctx.stroke()

      // The fleet, drawn brighter than the room they stand in.
      ctx.strokeStyle = `rgb(${inkStr} / 0.62)`
      ctx.lineWidth = 1.15
      ctx.beginPath()
      for (const p of PROPS) drawProp(p, elapsed)
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

      // Detections: the machines the stack is tracking, boxed as they come into
      // range and fading in the way a real track does. Only the nearest few are
      // labelled — a tag on every hull is clutter, not information.
      ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace'
      const tracked = PROPS.map((p) => ({
        p,
        d: Math.hypot(p.x - pose.x, p.z - pose.z),
      }))
        .sort((a, b) => a.d - b.d)
        .map((t, rank) => ({ ...t, rank }))

      for (const { p, d, rank } of tracked) {
        // Only the nearest few are boxed at all — a hull around every machine
        // buries the machines themselves.
        if (rank > 2) continue
        const b = p.hull
        const conf = Math.max(0, Math.min(1, (MAX_DIST + 0.1 - d) / 0.4))
        if (conf <= 0.01) continue
        const y0 = b.y0 ?? 0

        ctx.strokeStyle = `rgb(${inkStr} / ${(0.3 * conf).toFixed(2)})`
        ctx.lineWidth = 1
        ctx.beginPath()
        for (const y of [y0, b.h]) {
          line(b.minX, y, b.minZ, b.maxX, y, b.minZ)
          line(b.maxX, y, b.minZ, b.maxX, y, b.maxZ)
          line(b.maxX, y, b.maxZ, b.minX, y, b.maxZ)
          line(b.minX, y, b.maxZ, b.minX, y, b.minZ)
        }
        line(b.minX, y0, b.minZ, b.minX, b.h, b.minZ)
        line(b.maxX, y0, b.minZ, b.maxX, b.h, b.minZ)
        line(b.maxX, y0, b.maxZ, b.maxX, b.h, b.maxZ)
        line(b.minX, y0, b.maxZ, b.minX, b.h, b.maxZ)
        ctx.stroke()

        const tag = project(p.x, b.h + 0.05, p.z)
        if (tag) {
          ctx.fillStyle = `rgb(${inkStr} / ${(0.5 * conf).toFixed(2)})`
          ctx.fillText(p.label, tag.x + 6, tag.y)
          ctx.strokeStyle = `rgb(${inkStr} / ${(0.3 * conf).toFixed(2)})`
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
