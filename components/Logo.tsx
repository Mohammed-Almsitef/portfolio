/**
 * The MA ligature.
 *
 * One continuous geometry for both letters: a vertical M stem, the M's two
 * diagonals, and an A whose left leg *is* the M's second diagonal. The A's
 * crossbar starts exactly at the M's valley, so the letters share their
 * construction instead of overlapping. One stroke weight, round ends — the
 * same family as the site's Geist type.
 *
 * The A (its right leg and crossbar) carries the accent; the M is ink. Colours
 * come from `--logo-ink` / `--logo-accent` (globals.css), which hold the
 * correct pairing per theme: #1D4ED8 only on light grounds, #60A5FA only on
 * dark ones.
 *
 * Construction (120-unit grid): M = M26 94 V30 L52 70 L78 30; A = M78 30
 * L98 94; crossbar = M52 70 H90.5. The viewBox carries half a stroke of
 * clearance around the round ends. Source files: assets/brand/.
 */

const M = 'M26 94 V30 L52 70 L78 30'
const A = 'M78 30 L98 94'
const CROSSBAR = 'M52 70 H90.5'

/**
 * Optical weight compensation: smaller renderings get a heavier stroke so the
 * counters stay open and the mark keeps its colour at tab-icon size.
 */
const WEIGHTS = {
  /** 48px and above. */
  regular: 12,
  /** ~32px. */
  medium: 13,
  /** ~24px. */
  small: 14.5,
  /** 16px — the minimum size. */
  tiny: 16,
} as const

type LogoWeight = keyof typeof WEIGHTS

export default function Logo({
  // Kept for call-site compatibility; the mark no longer needs per-instance
  // ids now that it has no mask.
  id: _id,
  weight = 'medium',
  className,
  label,
  ink = 'var(--logo-ink)',
  accent = 'var(--logo-accent)',
}: {
  id: string
  weight?: LogoWeight
  className?: string
  /** Omit where the site name is already beside it — then the mark is decoration. */
  label?: string
  /** Overridden only where the theme cannot be read from CSS, as in the manager. */
  ink?: string
  accent?: string
}) {
  void _id
  const stroke = WEIGHTS[weight]
  const pad = stroke / 2 + 2

  return (
    <svg
      viewBox={`${26 - pad} ${30 - pad} ${72 + pad * 2} ${64 + pad * 2}`}
      className={className}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      focusable="false"
    >
      <g fill="none" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
        <path d={M} stroke={ink} />
        <path d={`${A} ${CROSSBAR}`} stroke={accent} />
      </g>
    </svg>
  )
}
