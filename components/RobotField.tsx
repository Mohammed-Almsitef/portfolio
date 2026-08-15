/**
 * A scattered field of robot line-art, sitting behind a section's content.
 *
 * Placement is pseudo-random but derived from a seed, so the server and the
 * client render the same arrangement — a real `Math.random()` here would
 * produce a hydration mismatch on every load. Each section passes its own id,
 * so every section gets a different but stable scatter.
 */

type Shape = (props: { className?: string }) => React.ReactElement

/** Quadrotor, front view: body, arms, rotor discs, landing skids. */
const Drone: Shape = (p) => (
  <svg viewBox="0 0 48 48" {...p}>
    <rect x="18" y="19" width="12" height="8" rx="2" />
    <path d="M18 22 6 17M30 22l12-5" />
    <ellipse cx="6" cy="16" rx="6" ry="1.8" />
    <ellipse cx="42" cy="16" rx="6" ry="1.8" />
    <path d="M20 27v6M28 27v6M14 33h20" />
  </svg>
)

/** Manipulator, side view: turret base, two links, joints, gripper. */
const Arm: Shape = (p) => (
  <svg viewBox="0 0 48 48" {...p}>
    <path d="M13 42h22M16 42v-5h16v5" />
    <path d="M24 37V27M24 27l11 -12M35 15 24 8" />
    <circle cx="24" cy="27" r="2.4" />
    <circle cx="35" cy="15" r="2.2" />
    <path d="m24 8-5-2M24 8l-3 4" />
  </svg>
)

/** Quadruped, side view: body, head, four two-segment legs. */
const Quadruped: Shape = (p) => (
  <svg viewBox="0 0 48 48" {...p}>
    <rect x="11" y="17" width="25" height="9" rx="2.5" />
    <path d="M36 19h6v6h-6" />
    <path d="M15 26l-3 7 3 6M21 26l3 7-3 6M28 26l-3 7 3 6M34 26l3 7-3 6" />
  </svg>
)

/** Humanoid: head, torso, swung arms, stance legs. */
const Humanoid: Shape = (p) => (
  <svg viewBox="0 0 48 48" {...p}>
    <circle cx="24" cy="9" r="4.2" />
    <path d="M24 13.5v3" />
    <rect x="18.5" y="16.5" width="11" height="13" rx="2.5" />
    <path d="M18.5 19 13 29M29.5 19 35 29" />
    <path d="M21 29.5 20 42M27 29.5 28 42" />
  </svg>
)

/** Wheeled rover: deck, sensor mast, wheels. */
const Rover: Shape = (p) => (
  <svg viewBox="0 0 48 48" {...p}>
    <rect x="9" y="20" width="30" height="10" rx="2.5" />
    <path d="M31 20v-7" />
    <rect x="27" y="7" width="8" height="6" rx="1.5" />
    <circle cx="17" cy="33" r="4" />
    <circle cx="31" cy="33" r="4" />
  </svg>
)

const SHAPES: Shape[] = [Drone, Arm, Quadruped, Humanoid, Rover]

/** Small deterministic PRNG — enough spread for scatter, stable across renders. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

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
  count = 9,
}: {
  /** Anything stable and distinct per placement — a section id works. */
  seed: string
  count?: number
}) {
  const rand = mulberry32(hash(seed))

  const items = Array.from({ length: count }, (_, i) => {
    const Shape = SHAPES[Math.floor(rand() * SHAPES.length)]
    return {
      key: i,
      Shape,
      // Kept off the vertical centre band, where headings and body copy sit.
      left: rand() * 92,
      top: rand() * 84,
      size: 46 + rand() * 66,
      tilt: (rand() - 0.5) * 22,
      // Varied weight, so the field reads as depth rather than a stamped grid.
      opacity: 0.1 + rand() * 0.1,
      flip: rand() > 0.5,
    }
  })

  return (
    <div
      aria-hidden="true"
      data-print-hide
      className="pointer-events-none absolute inset-0 overflow-hidden"
      // `muted` rather than a border token: it is the one neutral that stays
      // legible against both the light and the dark ground.
      style={{ color: 'var(--color-muted)' }}
    >
      {items.map(({ key, Shape, left, top, size, tilt, opacity, flip }) => (
        <div
          key={key}
          className="absolute"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: size,
            height: size,
            opacity,
            transform: `rotate(${tilt}deg) scaleX(${flip ? -1 : 1})`,
          }}
        >
          <Shape className="size-full [&_*]:fill-none [&_*]:stroke-current [&_*]:[stroke-linecap:round] [&_*]:[stroke-linejoin:round] [&_*]:[stroke-width:1.6]" />
        </div>
      ))}
    </div>
  )
}
