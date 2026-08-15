/**
 * A scattered field of robot line-art, sitting behind a section's content.
 *
 * Placement is pseudo-random but derived from a seed, so the server and the
 * client render the same arrangement — a real `Math.random()` here would
 * produce a hydration mismatch on every load. Each section passes its own id,
 * so every section gets a different but stable scatter.
 */

type V3 = [number, number, number]

/**
 * Isometric projection. X runs right-and-down, Z left-and-down, Y is up, so a
 * box drawn through it shows its top and two sides — the shapes are built from
 * real 3D geometry rather than drawn as flat icons.
 */
const ISO_X = Math.cos(Math.PI / 6)
function iso([x, y, z]: V3): [number, number] {
  return [(x - z) * ISO_X, (x + z) * 0.5 - y]
}

function toPath(points: V3[], close = true) {
  const d = points
    .map((p, i) => {
      const [x, y] = iso(p)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join('')
  return close ? `${d}Z` : d
}

/** The three faces of an axis-aligned box that face the camera. */
function box(c: V3, size: V3): string[] {
  const [cx, cy, cz] = c
  const [w, h, d] = size.map((n) => n / 2) as V3
  const x0 = cx - w
  const x1 = cx + w
  const y0 = cy - h
  const y1 = cy + h
  const z0 = cz - d
  const z1 = cz + d
  return [
    // top
    toPath([
      [x0, y1, z0],
      [x1, y1, z0],
      [x1, y1, z1],
      [x0, y1, z1],
    ]),
    // the +x side
    toPath([
      [x1, y0, z0],
      [x1, y1, z0],
      [x1, y1, z1],
      [x1, y0, z1],
    ]),
    // the +z side
    toPath([
      [x0, y0, z1],
      [x0, y1, z1],
      [x1, y1, z1],
      [x1, y0, z1],
    ]),
  ]
}

/** A circle in the plane spanned by `u` and `v` — wheels, rotors, turrets. */
function ring(c: V3, r: number, u: V3, v: V3, segs = 16): string {
  const pts: V3[] = Array.from({ length: segs }, (_, i) => {
    const t = (i / segs) * Math.PI * 2
    const co = Math.cos(t) * r
    const si = Math.sin(t) * r
    return [c[0] + u[0] * co + v[0] * si, c[1] + u[1] * co + v[1] * si, c[2] + u[2] * co + v[2] * si]
  })
  return toPath(pts)
}

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}

/**
 * A square-section beam between two points — limbs, legs, masts and arms.
 * Built with a frame perpendicular to the beam, so it stays solid-looking at
 * any angle instead of collapsing to a line.
 */
function beam(a: V3, b: V3, w: number): string[] {
  const dir = norm(sub(b, a))
  const ref: V3 = Math.abs(dir[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0]
  const r = norm(cross(dir, ref))
  const u = norm(cross(r, dir))
  const corner = (p: V3, sr: number, su: number): V3 => [
    p[0] + r[0] * w * sr + u[0] * w * su,
    p[1] + r[1] * w * sr + u[1] * w * su,
    p[2] + r[2] * w * sr + u[2] * w * su,
  ]
  const signs: [number, number][] = [
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1],
  ]
  const capA = signs.map(([s1, s2]) => corner(a, s1, s2))
  const capB = signs.map(([s1, s2]) => corner(b, s1, s2))
  return [
    toPath(capA),
    toPath(capB),
    ...capA.map((p, i) => toPath([p, capB[i]], false)),
  ]
}

const HORIZONTAL: [V3, V3] = [
  [1, 0, 0],
  [0, 0, 1],
]
const AXLE_Z: [V3, V3] = [
  [1, 0, 0],
  [0, 1, 0],
]

/** Quadrotor: body, four booms, rotor discs, landing legs. */
const DRONE = [
  ...box([0, 7, 0], [8, 4, 8]),
  ...[
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1],
  ].flatMap(([sx, sz]) => [
    ...beam([sx * 3, 7, sz * 3], [sx * 7.5, 8, sz * 7.5], 0.5),
    ring([sx * 7.5, 8.8, sz * 7.5], 3.4, ...HORIZONTAL, 14),
    ...beam([sx * 3, 5, sz * 3], [sx * 4.5, 0, sz * 4.5], 0.5),
  ]),
]

/** Manipulator: turret base, two links, gripper. */
const ARM = [
  ring([0, 0, 0], 6, ...HORIZONTAL),
  ring([0, 2.5, 0], 6, ...HORIZONTAL),
  ...[0, 1, 2, 3].map((i) => {
    const t = (i / 4) * Math.PI * 2
    const x = Math.cos(t) * 6
    const z = Math.sin(t) * 6
    return toPath([[x, 0, z] as V3, [x, 2.5, z] as V3], false)
  }),
  ...box([0, 5, 0], [5, 5, 5]),
  ...beam([0, 7.5, 0], [7, 15, 0], 1.2),
  ...beam([7, 15, 0], [2, 21, 0], 1),
  ...beam([2, 21, 0], [-1, 23, 1.6], 0.5),
  ...beam([2, 21, 0], [-1, 23, -1.6], 0.5),
]

/** Quadruped: body, head, four two-segment legs. */
const QUADRUPED = [
  ...box([0, 9, 0], [16, 6, 8]),
  ...box([10.5, 10, 0], [5, 4, 5]),
  ...[
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1],
  ].flatMap(([sx, sz]) => [
    ...beam([sx * 5, 6, sz * 3.5], [sx * 6.5, 3, sz * 3.5], 0.6),
    ...beam([sx * 6.5, 3, sz * 3.5], [sx * 5, 0, sz * 3.5], 0.5),
  ]),
]

/** Humanoid: torso, head, arms, legs. */
const HUMANOID = [
  ...beam([2.5, 9, 0], [2.5, 0, 0], 1),
  ...beam([-2.5, 9, 0], [-2.5, 0, 0], 1),
  ...box([0, 14, 0], [7, 10, 5]),
  ...beam([0, 19, 0], [0, 20, 0], 1.2),
  ...box([0, 22.5, 0], [4.5, 4.5, 4.5]),
  ...beam([4.5, 18, 0], [6, 10, 0], 0.8),
  ...beam([-4.5, 18, 0], [-6, 10, 0], 0.8),
]

/** Wheeled rover: deck, sensor mast, four wheels. */
const ROVER = [
  ...box([0, 5.5, 0], [16, 4, 9]),
  ...beam([4, 7.5, 0], [4, 13, 0], 0.7),
  ...box([4, 14.5, 0], [4.5, 3, 4.5]),
  ...[
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1],
  ].map(([sx, sz]) => ring([sx * 5, 3, sz * 5.5], 3, ...AXLE_Z, 12)),
]

const SHAPES: string[][] = [DRONE, ARM, QUADRUPED, HUMANOID, ROVER]

/**
 * A composed arrangement rather than a random scatter: the two gutters are
 * staggered against each other so no two machines sit at the same height, and
 * sizes alternate heavy/light down the column so the eye travels rather than
 * reading a row of equal marks. Tilts lean away from the content.
 */
const LAYOUT = [
  { side: 'left', top: 5, size: 104, tilt: -7, tone: '--tone-blue' },
  { side: 'right', top: 18, size: 74, tilt: 8, tone: '--tone-teal' },
  { side: 'left', top: 36, size: 78, tilt: 6, tone: '--tone-violet' },
  { side: 'right', top: 49, size: 110, tilt: -6, tone: '--tone-amber' },
  { side: 'left', top: 68, size: 72, tilt: 9, tone: '--tone-cyan' },
  { side: 'right', top: 81, size: 90, tilt: -8, tone: '--tone-emerald' },
] as const

function hash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export default function RobotField({
  seed,
  count = LAYOUT.length,
}: {
  /** Anything stable and distinct per section — the section id works. */
  seed: string
  count?: number
}) {
  // The only thing the seed decides is which machine the cycle starts on, so
  // each section leads with a different one while the composition stays fixed.
  const offset = hash(seed) % SHAPES.length

  return (
    <div
      aria-hidden="true"
      data-print-hide
      // Only from `lg` up: below that the content fills the full width and
      // there is no gutter to sit in without landing on the text.
      className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block"
    >
      {LAYOUT.slice(0, count).map(({ side, top, size, tilt, tone }, i) => {
        const paths = SHAPES[(i + offset) % SHAPES.length]
        // A left-gutter machine is pinned by its right edge and vice versa, so
        // both anchor off the same distance from the middle.
        const anchor = side === 'left' ? 'right' : 'left'
        return (
          <div
            key={i}
            className="absolute"
            style={{
              // Anchored to the content edge, not to a percentage of the
              // viewport: this keeps every machine outside the text column at
              // any width, and simply pushes them off-screen when there is no
              // gutter left to occupy. The 12px reclaims part of the
              // container's own padding, which holds no text.
              [anchor]: `calc(50% + var(--container-page) / 2 - 12px)`,
              top: `${top}%`,
              width: size,
              height: size,
              opacity: 0.3,
              color: `rgb(var(${tone}))`,
              // Right-hand machines face back toward the content.
              transform: `rotate(${tilt}deg) scaleX(${side === 'right' ? -1 : 1})`,
            }}
          >
            {/* One viewBox for every machine, sized to the tallest — so they
                keep their relative scale instead of each filling the frame. */}
            <svg
              viewBox="-22 -32 44 44"
              className="size-full"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {paths.map((d, j) => (
                <path key={j} d={d} />
              ))}
            </svg>
          </div>
        )
      })}
    </div>
  )
}
