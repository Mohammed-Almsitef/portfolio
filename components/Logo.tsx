/**
 * The MA monogram, for a robotics and AI engineer.
 *
 * Two bold, forward-leaning letters cut from one block: the M's last stroke
 * and the A's first run parallel, separated by a single slash. The M carries
 * four pierced pivots, like the joints of a linkage; the A's counter is a
 * round core, like a node or a sensor. Constructed on one grid (120 units
 * tall), not taken from a typeface. The M is ink; the A carries the accent,
 * as a blue-to-indigo gradient — the same pairing as the headline and the
 * primary button.
 *
 * Colours come from `--logo-ink` / `--logo-accent` / `--logo-accent-2`
 * (globals.css), set per theme. Spec and source files: assets/brand/.
 */

const M =
  'M0 120 L18 0 L46 0 L28 120 Z M38.5 50 L46 0 L94.75 75 L70 120 Z M70 120 L136 0 L170 0 L104 120 Z'
/** The A's outer shape and the opening under its crossbar. */
const A_BODY = 'M114 120 L180 0 L222 0 L255.6 120 Z M146 120 L161.4 92 L215.8 92 L223.6 120 Z'
/** The A's counter as a plain triangle, used where the core would be too small. */
const A_COUNTER = 'M197.4 26.5 L209.6 70 L173.5 70 Z'
const CORE = { cx: 194.5, cy: 57 }
const PIVOTS: [number, number][] = [
  [16.1, 106],
  [29.9, 14],
  [94.7, 106],
  [145.3, 14],
]

/**
 * Optical simplification: details that would turn to noise are dropped as the
 * mark shrinks. The letters themselves never change.
 */
const DETAIL = {
  /** 48px and above. */
  regular: { pivot: 5.2, core: 7.5 },
  /** ~32px. */
  medium: { pivot: 5.2, core: 7.5 },
  /** ~24px: the core only. */
  small: { pivot: 0, core: 8 },
  /** 16px: plain letters. */
  tiny: { pivot: 0, core: 0 },
} as const

type LogoWeight = keyof typeof DETAIL

export default function Logo({
  id,
  weight = 'medium',
  className,
  label,
  ink = 'var(--logo-ink)',
  accent = 'var(--logo-accent)',
  accent2 = 'var(--logo-accent-2)',
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
  /** Second gradient stop for the A; pass the same as `accent` for a flat fill. */
  accent2?: string
}) {
  const { pivot, core } = DETAIL[weight]
  const maskId = `${id}-detail`
  const gradId = `${id}-accent`
  const masked = pivot > 0 || core > 0

  return (
    <svg
      viewBox="-6 -6 268 132"
      className={className}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      focusable="false"
    >
      <defs>
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="114" y1="120" x2="256" y2="0">
          <stop offset="0" style={{ stopColor: accent }} />
          <stop offset="1" style={{ stopColor: accent2 }} />
        </linearGradient>
        {masked && (
          <mask id={maskId} maskUnits="userSpaceOnUse" x="-10" y="-10" width="280" height="140">
            <rect x="-10" y="-10" width="280" height="140" fill="#fff" />
            {pivot > 0 &&
              PIVOTS.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={pivot} fill="#000" />)}
            {core > 0 && <circle cx={CORE.cx} cy={CORE.cy} r={core} fill="#000" />}
          </mask>
        )}
      </defs>
      <g mask={masked ? `url(#${maskId})` : undefined}>
        <path d={M} fill={ink} />
        <path d={core > 0 ? A_BODY : `${A_BODY} ${A_COUNTER}`} fill={`url(#${gradId})`} fillRule="evenodd" />
      </g>
    </svg>
  )
}
