/**
 * The MA monogram: a bold M with an A locked into its right side.
 *
 * The A stands in front and slices the M's right stem at its own angle, with
 * a narrow gap between them, so the two initials read as one shape while the
 * M stays whole. The letterforms are Space Grotesk Bold (the site's display
 * face, SIL Open Font License) converted to outlines, so the mark never
 * depends on a font loading. The M is ink; the A carries the accent.
 *
 * Colours come from `--logo-ink` / `--logo-accent` (globals.css), which flip
 * inside navy bands. Source files and spec: assets/brand/.
 */

const M = 'M66 0V-700H311L432 -90H450L571 -700H816V0H688V-603H670L550 0H332L212 -603H194V0Z'
const A = 'M750 0 934 -700H1164L1348 0H1212L1174 -154H924L886 0ZM955 -276H1143L1058 -617H1040Z'
/** The A as a solid silhouette: what the M is cut away behind. */
const A_SILHOUETTE = 'M934 -700 L1164 -700 L1348 0 L750 0 Z'

/** Left edge, right edge and cap height of the mark, in font units. */
const X0 = 66
const X1 = 1348
const CAP = 700

/**
 * Optical compensation: the gap between the letters widens as the mark
 * shrinks, so it does not close up. The letters are already bold, so they
 * need no thickening.
 */
const GAPS = {
  /** 48px and above. */
  regular: 34,
  /** ~32px. */
  medium: 40,
  /** ~24px. */
  small: 50,
  /** 16px — the minimum size. */
  tiny: 62,
} as const

type LogoWeight = keyof typeof GAPS

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
  const gap = GAPS[weight]
  const pad = 24
  const maskId = `${id}-cut`
  const box = { x: X0 - 200, y: -CAP - 200, width: X1 - X0 + 400, height: CAP + 400 }

  return (
    <svg
      viewBox={`${X0 - pad} ${-CAP - pad} ${X1 - X0 + pad * 2} ${CAP + pad * 2}`}
      className={className}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      focusable="false"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" {...box}>
          <rect {...box} fill="#fff" />
          <path d={A_SILHOUETTE} fill="#000" stroke="#000" strokeWidth={gap} strokeLinejoin="round" />
        </mask>
      </defs>
      <path d={M} fill={ink} mask={`url(#${maskId})`} />
      <path d={A} fill={accent} />
    </svg>
  )
}
