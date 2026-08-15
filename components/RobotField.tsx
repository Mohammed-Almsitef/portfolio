import { getAppearance } from '@/lib/content'

/**
 * A field of isometric robots, sitting in the margins beside a section.
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

/** A polygon in 3D. `ground` marks the contact shadow, always drawn first. */
type Face = { pts: V3[]; ground?: boolean }

const LIGHT = norm([0.4, 1, 0.55])

/**
 * Lambert-ish shading from the face normal, so a top face reads brighter than
 * a side and the volumes are legible without any outline doing the work.
 * Magnitude rather than sign, so winding order never has to be policed.
 *
 * The range can be this wide because each face is painted over an opaque
 * backing in the section's own ground colour — occlusion is that backing's
 * job, leaving the tint free to actually shade.
 */
function shade(pts: V3[]) {
  const n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])))
  const lambert = Math.abs(n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2])
  return 0.16 + lambert * 0.5
}

/** Painter's algorithm: in this isometric view, x + y + z grows toward camera. */
function depth(pts: V3[]) {
  let sum = 0
  for (const p of pts) sum += p[0] + p[1] + p[2]
  return sum / pts.length
}

function toPath(points: V3[]) {
  return (
    points
      .map((p, i) => {
        const [x, y] = iso(p)
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join('') + 'Z'
  )
}

/** The three faces of an axis-aligned box that face the camera. */
function box(c: V3, size: V3): Face[] {
  const [cx, cy, cz] = c
  const [w, h, d] = size.map((n) => n / 2) as V3
  const x0 = cx - w
  const x1 = cx + w
  const y0 = cy - h
  const y1 = cy + h
  const z0 = cz - d
  const z1 = cz + d
  return [
    {
      pts: [
        [x0, y1, z0],
        [x1, y1, z0],
        [x1, y1, z1],
        [x0, y1, z1],
      ],
    },
    {
      pts: [
        [x1, y0, z0],
        [x1, y1, z0],
        [x1, y1, z1],
        [x1, y0, z1],
      ],
    },
    {
      pts: [
        [x0, y0, z1],
        [x0, y1, z1],
        [x1, y1, z1],
        [x1, y0, z1],
      ],
    },
  ]
}

/** A disc in the plane spanned by `u` and `v` — wheels, rotors, turret plates. */
function disc(c: V3, r: number, u: V3, v: V3, segs = 16): Face {
  return {
    pts: Array.from({ length: segs }, (_, i) => {
      const t = (i / segs) * Math.PI * 2
      const co = Math.cos(t) * r
      const si = Math.sin(t) * r
      return [
        c[0] + u[0] * co + v[0] * si,
        c[1] + u[1] * co + v[1] * si,
        c[2] + u[2] * co + v[2] * si,
      ] as V3
    }),
  }
}

/** A short cylinder — turret bases, wheel treads, sensor pucks. */
function cylinder(c: V3, r: number, axis: V3, len: number, segs = 14): Face[] {
  const a = norm(axis)
  const ref: V3 = Math.abs(a[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0]
  const u = norm(cross(a, ref))
  const v = norm(cross(a, u))
  const capC = (s: number): V3 => [
    c[0] + a[0] * len * s,
    c[1] + a[1] * len * s,
    c[2] + a[2] * len * s,
  ]
  const top = disc(capC(0.5), r, u, v, segs)
  const bottom = disc(capC(-0.5), r, u, v, segs)
  const walls: Face[] = top.pts.map((p, i) => {
    const q = top.pts[(i + 1) % top.pts.length]
    const p2 = bottom.pts[i]
    const q2 = bottom.pts[(i + 1) % bottom.pts.length]
    return { pts: [p, q, q2, p2] }
  })
  return [bottom, ...walls, top]
}

/**
 * A square-section beam between two points — limbs, legs, masts and arms.
 * Built with a frame perpendicular to the beam, so it stays solid at any angle
 * instead of collapsing to a line.
 */
function beam(a: V3, b: V3, w: number): Face[] {
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
    { pts: capA },
    { pts: capB },
    ...capA.map((p, i) => ({
      pts: [p, capA[(i + 1) % 4], capB[(i + 1) % 4], capB[i]],
    })),
  ]
}

/** The contact patch on the floor — cheap grounding, and it reads as weight. */
function shadow(cx: number, cz: number, r: number): Face {
  return { ...disc([cx, 0, cz], r, [1, 0, 0], [0, 0, 1], 18), ground: true }
}

const CORNERS: [number, number][] = [
  [1, 1],
  [1, -1],
  [-1, -1],
  [-1, 1],
]

/** Left and right, for the things that come in pairs rather than fours. */
const SIDES = [1, -1]

/** Quadrotor: body, canopy, four booms with rotor hubs, landing skids. */
const DRONE: Face[] = [
  shadow(0, 0, 9),
  ...box([0, 6.5, 0], [9, 4, 9]),
  ...box([0, 9, 0], [5.5, 1.6, 5.5]),
  ...CORNERS.flatMap(([sx, sz]) => [
    // Booms leave from the body's corner rather than from inside it.
    ...beam([sx * 4.4, 6.5, sz * 4.4], [sx * 8, 7.6, sz * 8], 0.6),
    ...cylinder([sx * 8, 8.4, sz * 8], 1.1, [0, 1, 0], 1.4, 10),
    disc([sx * 8, 9.2, sz * 8], 3.6, [1, 0, 0], [0, 0, 1], 16),
    // Legs land on pads rather than stopping in mid-air.
    ...beam([sx * 3, 4.6, sz * 3], [sx * 5, 0.7, sz * 5], 0.55),
    ...box([sx * 5, 0.4, sz * 5], [2.6, 0.8, 2.6]),
  ]),
]

/** Manipulator: turret, shoulder, two links with a wrist and gripper. */
const ARM: Face[] = [
  shadow(0, 0, 7),
  ...cylinder([0, 1.4, 0], 6.4, [0, 1, 0], 2.8, 18),
  ...box([0, 5.2, 0], [6, 5, 6]),
  // Shoulder clears the turret box rather than sitting buried in it.
  ...cylinder([0, 8.6, 0], 1.9, [0, 0, 1], 5, 12),
  ...beam([0, 8.6, 0], [7, 15.5, 0], 1.3),
  ...cylinder([7, 15.5, 0], 1.6, [0, 0, 1], 4.2, 12),
  ...beam([7, 15.5, 0], [2, 21, 0], 1),
  ...cylinder([2, 21, 0], 1.1, [0, 0, 1], 3, 10),
  ...beam([2, 21, 0], [-1.2, 23, 1.8], 0.5),
  ...beam([2, 21, 0], [-1.2, 23, -1.8], 0.5),
]

/** Quadruped: body, sensor head, four two-segment legs with knee joints. */
const QUADRUPED: Face[] = [
  shadow(0, 0, 9),
  ...box([0, 9, 0], [17, 6, 9]),
  ...box([10.5, 10.5, 0], [5, 4, 5.5]),
  ...cylinder([12.5, 10.5, 0], 1.6, [1, 0, 0], 1.4, 12),
  // Hips ride outboard of the body, as a real quadruped's do — and, less
  // romantically, a joint buried inside a parent volume is one that centroid
  // depth sorting cannot resolve, so it ghosts through the panel above it.
  ...CORNERS.flatMap(([sx, sz]) => [
    ...cylinder([sx * 5.5, 6.4, sz * 5.4], 1.3, [0, 0, 1], 2, 10),
    ...beam([sx * 5.5, 6.2, sz * 5.4], [sx * 7, 3, sz * 5.4], 0.65),
    ...cylinder([sx * 7, 3, sz * 5.4], 0.95, [0, 0, 1], 1.5, 10),
    ...beam([sx * 7, 3, sz * 5.4], [sx * 5.5, 0.3, sz * 5.4], 0.5),
  ]),
]

/** Humanoid: torso, visored head, shouldered arms, jointed legs. */
const HUMANOID: Face[] = [
  shadow(0, 0, 6),
  // Legs and arms are paired across Z, the axis the torso is thin on, so both
  // of each are visible from this camera rather than hiding behind each other.
  ...SIDES.flatMap((s) => [
    ...beam([0, 9, s * 2.6], [0, 4.6, s * 2.8], 1.1),
    ...cylinder([0, 4.6, s * 2.8], 1.2, [1, 0, 0], 1.8, 10),
    ...beam([0, 4.6, s * 2.8], [0, 1, s * 2.8], 0.95),
    ...box([0.8, 0.5, s * 2.8], [4.4, 1, 2.6]),
  ]),
  ...box([0, 14, 0], [6, 10, 8]),
  ...cylinder([0, 19.4, 0], 1.3, [0, 1, 0], 1.8, 10),
  ...box([0, 22.6, 0], [5, 4.6, 5.4]),
  // Visor: a shallow lip on the face, not a block bolted to the side of it.
  ...box([2.2, 22.8, 0], [1.4, 2.2, 4]),
  ...SIDES.flatMap((s) => [
    ...cylinder([0, 18.4, s * 5], 1.4, [0, 0, 1], 1.8, 10),
    ...beam([0, 18.4, s * 5], [0.6, 10, s * 5.6], 0.85),
    ...cylinder([0.6, 10, s * 5.6], 1.1, [0, 0, 1], 1.6, 10),
  ]),
]

/** Wheeled rover: deck, mast, lidar puck, four wheels on hubs. */
const ROVER: Face[] = [
  shadow(0, 0, 9),
  ...box([0, 5.5, 0], [17, 4, 10]),
  ...box([-2, 8, 0], [7, 1.4, 7]),
  ...beam([4.5, 7.5, 0], [4.5, 12.5, 0], 0.8),
  ...cylinder([4.5, 13.8, 0], 2.6, [0, 1, 0], 2.6, 16),
  ...CORNERS.flatMap(([sx, sz]) => [
    ...cylinder([sx * 5.5, 3, sz * 5.6], 3, [0, 0, 1], 2.2, 14),
    ...cylinder([sx * 5.5, 3, sz * 5.6], 1.1, [0, 0, 1], 2.6, 8),
  ]),
]

const SHAPES: Face[][] = [DRONE, ARM, QUADRUPED, HUMANOID, ROVER]

/**
 * Sorted back to front once, at module load. Ground shadows come first so a
 * machine never paints its own contact patch over a leg.
 *
 * Each machine also gets its own viewBox, centred on its own bounds but sized
 * to the widest span across all five — so every one sits centred in its tile
 * while the group still keeps its relative scale: the rover reads low and wide
 * beside a tall manipulator, rather than both swelling to fill their frames.
 */
const RENDERED = (() => {
  const measured = SHAPES.map((faces) => {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const f of faces) {
      for (const p of f.pts) {
        const [x, y] = iso(p)
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
    return {
      cx: (minX + maxX) / 2,
      cy: (minY + maxY) / 2,
      span: Math.max(maxX - minX, maxY - minY),
      paths: faces
        .map((f) => ({
          d: toPath(f.pts),
          fill: f.ground ? 0.08 : shade(f.pts),
          ground: !!f.ground,
          z: depth(f.pts),
        }))
        .sort((a, b) => Number(b.ground) - Number(a.ground) || a.z - b.z),
    }
  })

  const span = Math.max(...measured.map((m) => m.span)) * 1.06
  return measured.map(({ cx, cy, paths }) => ({
    paths,
    viewBox: `${(cx - span / 2).toFixed(2)} ${(cy - span / 2).toFixed(2)} ${span.toFixed(2)} ${span.toFixed(2)}`,
  }))
})()

/** The full palette, so the field is as varied in hue as the skills grid. */
const TONES = [
  '--tone-blue',
  '--tone-rose',
  '--tone-teal',
  '--tone-purple',
  '--tone-amber',
  '--tone-cyan',
  '--tone-violet',
  '--tone-lime',
  '--tone-emerald',
]

/**
 * Composed arrangements rather than random scatter: the two gutters are
 * staggered against each other so no two machines sit at the same height, and
 * sizes alternate heavy and light down the column so the eye travels rather
 * than reading a row of equal marks. Tilts lean away from the content.
 *
 * Three of them, picked per section, so consecutive sections do not repeat the
 * same silhouette down the page.
 */
const LAYOUTS = [
  [
    { side: 'left', top: 4, size: 88, tilt: -7 },
    { side: 'right', top: 18, size: 62, tilt: 8 },
    { side: 'left', top: 36, size: 66, tilt: 6 },
    { side: 'right', top: 50, size: 92, tilt: -6 },
    { side: 'left', top: 68, size: 60, tilt: 9 },
    { side: 'right', top: 82, size: 76, tilt: -8 },
  ],
  [
    { side: 'right', top: 7, size: 70, tilt: 6 },
    { side: 'left', top: 21, size: 84, tilt: -9 },
    { side: 'right', top: 39, size: 60, tilt: 7 },
    { side: 'left', top: 54, size: 74, tilt: -5 },
    { side: 'right', top: 70, size: 88, tilt: 9 },
    { side: 'left', top: 85, size: 64, tilt: -7 },
  ],
  [
    { side: 'left', top: 9, size: 74, tilt: 8 },
    { side: 'right', top: 25, size: 66, tilt: -6 },
    { side: 'right', top: 44, size: 90, tilt: 7 },
    { side: 'left', top: 57, size: 62, tilt: -8 },
    { side: 'left', top: 73, size: 80, tilt: 5 },
    { side: 'right', top: 87, size: 70, tilt: -9 },
  ],
] as const

function hash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export default async function RobotField({
  seed,
  count = 6,
  tone = 'base',
}: {
  /** Anything stable and distinct per section — the section id works. */
  seed: string
  count?: number
  /** The ground the field sits on, so backing faces match it exactly. */
  tone?: 'base' | 'raised'
}) {
  // Read here rather than threading props down through every section: this is
  // a Server Component, and the reader is cached per request.
  const { decorShow, decorArrangement, decorWeight } = await getAppearance()
  if (!decorShow) return null

  const ground = tone === 'raised' ? 'var(--color-surface)' : 'var(--color-bg)'
  // The seed picks the arrangement, the machine the cycle starts on, and where
  // the palette starts — three independent rotations, so no two sections read
  // as the same composition in the same colours.
  const h = hash(seed)
  const pinned = { a: 0, b: 1, c: 2 }[decorArrangement as 'a' | 'b' | 'c']
  const layout = LAYOUTS[pinned ?? h % LAYOUTS.length]
  // Unsigned shifts: `>>` would coerce a hash above 2^31 to a negative int and
  // index off the front of the array.
  const shapeStart = (h >>> 4) % SHAPES.length
  const toneStart = (h >>> 9) % TONES.length

  return (
    <div
      aria-hidden="true"
      data-print-hide
      // Gutters only exist once the window is wider than the page container, so
      // the field waits until there is genuinely room beside the content: the
      // 44px margin plus the largest machine needs 136px of gutter, which a
      // 90rem container reaches at about 1712px.
      className={`robot-field pointer-events-none absolute inset-0 hidden overflow-hidden [@media(min-width:1720px)]:block ${
        decorWeight === 'soft' ? 'is-soft' : ''
      }`}
    >
      {layout.slice(0, count).map(({ side, top, size, tilt }, i) => {
        const machine = RENDERED[(i + shapeStart) % RENDERED.length]
        // Stride of two through nine tones: six distinct hues per section, and
        // adjacent machines never land on neighbouring shades.
        const tone = TONES[(i * 2 + toneStart) % TONES.length]
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
              // any width. The 44px is clear air past the container, so
              // nothing crowds the copy.
              [anchor]: `calc(50% + var(--container-page) / 2 + 44px)`,
              top: `${top}%`,
              width: size,
              height: size,
              // Weight comes from `.robot-field` in the stylesheet, so the
              // whole field can be tuned without touching the geometry.
              opacity: 'var(--robot-alpha)',
              filter: 'var(--robot-glow)',
              color: `rgb(var(${tone}))`,
              // Right-hand machines face back toward the content.
              transform: `rotate(${tilt}deg) scaleX(${side === 'right' ? -1 : 1})`,
            }}
          >
            <svg
              viewBox={machine.viewBox}
              className="size-full"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="0.45"
              strokeLinejoin="round"
            >
              {machine.paths.map(({ d, fill, ground: isShadow }, j) => (
                <g key={j}>
                  {/* Opaque backing in the section's own ground colour: this is
                      what hides the geometry behind, so the tint above it is
                      free to shade rather than having to be near-solid. */}
                  {!isShadow && <path d={d} fill={ground} stroke={ground} />}
                  <path
                    d={d}
                    style={{
                      fillOpacity: `calc(${fill.toFixed(3)} * var(--robot-fill))`,
                      // The contact patch is a soft blot, not an outlined disc.
                      strokeOpacity: isShadow ? 0 : 'var(--robot-stroke)',
                    }}
                  />
                </g>
              ))}
            </svg>
          </div>
        )
      })}
    </div>
  )
}
