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

/**
 * A composed arrangement rather than a random scatter: the two gutters are
 * staggered against each other so no two machines sit at the same height, and
 * sizes alternate heavy/light down the column so the eye travels rather than
 * reading a row of equal marks. Tilts lean away from the content.
 */
const LAYOUT = [
  { side: 'left', top: 5, size: 80, tilt: -7, tone: '--tone-blue' },
  { side: 'right', top: 18, size: 56, tilt: 8, tone: '--tone-teal' },
  { side: 'left', top: 36, size: 58, tilt: 6, tone: '--tone-violet' },
  { side: 'right', top: 49, size: 84, tilt: -6, tone: '--tone-amber' },
  { side: 'left', top: 68, size: 54, tilt: 9, tone: '--tone-cyan' },
  { side: 'right', top: 81, size: 68, tilt: -8, tone: '--tone-emerald' },
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
        const Shape = SHAPES[(i + offset) % SHAPES.length]
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
            <Shape className="size-full [&_*]:fill-none [&_*]:stroke-current [&_*]:[stroke-linecap:round] [&_*]:[stroke-linejoin:round] [&_*]:[stroke-width:1.6]" />
          </div>
        )
      })}
    </div>
  )
}
