/**
 * The MA monogram, for a robotics and AI engineer.
 *
 * The M is a linkage: four bold links joined at five pierced pivots. The
 * pivots read two ways at once — the joints of a robot arm, and the nodes of
 * a network — which is the pairing in the job title. The A is a heading
 * arrow, the marker a robot's pose is drawn with on a map.
 *
 * Constructed on one grid (120 units tall), not taken from a typeface. The M
 * is ink; the arrow carries the accent. Colours come from `--logo-ink` /
 * `--logo-accent` (globals.css), which flip inside navy bands. Spec and
 * source files: assets/brand/.
 */

/** The M's five joints, in order along the linkage. */
const JOINTS: [number, number][] = [
  [16, 108],
  [16, 12],
  [62, 84],
  [108, 12],
  [108, 108],
]
const LINKS = `M${JOINTS.map(([x, y]) => `${x} ${y}`).join(' L')}`
const ARROW = 'M124 120 L172 0 L220 120 L172 92 Z'

/**
 * Optical compensation. The links thicken as the mark shrinks; the pivots
 * shrink with it and are dropped at 16px, where they would only be noise.
 */
const WEIGHTS = {
  /** 48px and above. */
  regular: { stroke: 24, pivot: 5.5 },
  /** ~32px. */
  medium: { stroke: 24, pivot: 5.5 },
  /** ~24px. */
  small: { stroke: 25, pivot: 5 },
  /** 16px — the minimum size. */
  tiny: { stroke: 26, pivot: 0 },
} as const

type LogoWeight = keyof typeof WEIGHTS

export default function Logo({
  id,
  weight = 'medium',
  className,
  label,
  ink = 'var(--logo-ink)',
  accent = 'var(--logo-accent)',
}: {
  /** Unique per instance: several marks can share a page, and mask ids must not collide. */
  id: string
  weight?: LogoWeight
  className?: string
  /** Omit where the site name is already beside it — then the mark is decoration. */
  label?: string
  /** Overridden only where the theme cannot be read from CSS, as in the manager. */
  ink?: string
  accent?: string
}) {
  const { stroke, pivot } = WEIGHTS[weight]
  const maskId = `${id}-pivots`

  return (
    <svg
      viewBox="-6 -6 234 132"
      className={className}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      focusable="false"
    >
      {pivot > 0 && (
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="-10" y="-10" width="140" height="140">
            <rect x="-10" y="-10" width="140" height="140" fill="#fff" />
            {JOINTS.map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={pivot} fill="#000" />
            ))}
          </mask>
        </defs>
      )}
      <path
        d={LINKS}
        fill="none"
        stroke={ink}
        strokeWidth={stroke}
        strokeLinejoin="round"
        strokeLinecap="round"
        mask={pivot > 0 ? `url(#${maskId})` : undefined}
      />
      <path d={ARROW} fill={accent} />
    </svg>
  )
}
