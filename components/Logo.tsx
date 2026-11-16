/**
 * The MA monogram: a geometric M and an A drawn as a heading arrow.
 *
 * The A is the marker a robot's pose is drawn with on a map — a pointed arrow
 * with a notched base — so the initials carry the subject of the work. Both
 * letters are constructed on one grid (120 units tall, flat-cut terminals),
 * not taken from a typeface. The M is ink; the arrow carries the accent.
 *
 * Colours come from `--logo-ink` / `--logo-accent` (globals.css), which flip
 * inside navy bands. Source files and spec: assets/brand/.
 */

/** The M's centre line; it is stroked, then cut flat at the cap and baseline. */
const M = 'M14 140 V0 L62 82 L110 0 V140'
const ARROW = 'M124 120 L172 0 L220 120 L172 92 Z'

/** Optical compensation: the M's stroke thickens as the mark shrinks. */
const STROKES = {
  /** 48px and above. */
  regular: 24,
  /** ~32px. */
  medium: 25,
  /** ~24px. */
  small: 27,
  /** 16px — the minimum size. */
  tiny: 29,
} as const

type LogoWeight = keyof typeof STROKES

export default function Logo({
  id,
  weight = 'medium',
  className,
  label,
  ink = 'var(--logo-ink)',
  accent = 'var(--logo-accent)',
}: {
  /** Unique per instance: several marks can share a page, and clip ids must not collide. */
  id: string
  weight?: LogoWeight
  className?: string
  /** Omit where the site name is already beside it — then the mark is decoration. */
  label?: string
  /** Overridden only where the theme cannot be read from CSS, as in the manager. */
  ink?: string
  accent?: string
}) {
  const stroke = STROKES[weight]
  const clipId = `${id}-cap`

  return (
    <svg
      viewBox="-6 -6 234 132"
      className={className}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      focusable="false"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="-20" y="0" width="160" height="120" />
        </clipPath>
      </defs>
      <path
        d={M}
        fill="none"
        stroke={ink}
        strokeWidth={stroke}
        strokeLinejoin="miter"
        strokeMiterlimit={10}
        clipPath={`url(#${clipId})`}
      />
      <path d={ARROW} fill={accent} />
    </svg>
  )
}
