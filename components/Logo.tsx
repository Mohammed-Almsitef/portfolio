/**
 * The MA monogram.
 *
 * Geometry, weights and colours come from the design handoff and are not ours
 * to adjust: a geometric M and a geometric A at one stroke weight, where the A
 * crosses the M and knocks a *transparent* gap out of it — hence the mask on the
 * M rather than a background-coloured stroke over it, so the mark works on any
 * ground.
 *
 * Three things the handoff is explicit about, all reflected here:
 *
 *   - The viewBox is fixed at `-6 -34 208 172`. Its padding accommodates the
 *     mitre spikes at the M's valley and the A's apex, so tightening it clips
 *     the points. It also carries the required clear space of one stroke weight
 *     on all four sides.
 *   - Small renderings step the weight up, and below 24px the accent is dropped
 *     so the whole mark is one ink. See WEIGHTS.
 *   - The mask stroke is always the mark's stroke + 16.
 *
 * The two colours are the brand's own, held in `--logo-ink` and `--logo-accent`
 * (globals.css) rather than the site's accent token: the accent is
 * user-selectable in the manager, and the handoff forbids recolouring the mark
 * outside its palette — "never #1D4ED8 on a dark ground or #60A5FA on a light
 * one" is precisely what those two variables encode.
 */

const M = 'M20 104 V16 L66 104 L112 16 V104'
const A = 'M108 104 L140 16 L172 104'
const CROSSBAR = 'M118 76 H162'

/**
 * Optical weight compensation, from the handoff's table. `size` is the rendered
 * size the pairing was drawn for; `mono` drops the accent, which it requires at
 * 24px and below.
 */
const WEIGHTS = {
  /** 48px and above. */
  regular: { stroke: 15, mask: 31, mono: false },
  /** 32px. */
  medium: { stroke: 17, mask: 33, mono: false },
  /** 24px. */
  small: { stroke: 18, mask: 34, mono: true },
  /** 16px — the minimum size. */
  tiny: { stroke: 19, mask: 35, mono: true },
} as const

export type LogoWeight = keyof typeof WEIGHTS

export default function Logo({
  id,
  weight = 'medium',
  className,
  label,
  ink = 'var(--logo-ink)',
  accent = 'var(--logo-accent)',
}: {
  /**
   * Unique per instance: several of these can be inlined in one document, and
   * duplicate mask ids would collide.
   */
  id: string
  weight?: LogoWeight
  className?: string
  /** Omit where the site name is already beside it — then the mark is decoration. */
  label?: string
  /** Overridden only where the theme cannot be read from CSS, as in the manager. */
  ink?: string
  accent?: string
}) {
  const { stroke, mask, mono } = WEIGHTS[weight]
  const maskId = `${id}-seam`
  const legs = mono ? ink : accent

  return (
    <svg
      viewBox="-6 -34 208 172"
      className={className}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      focusable="false"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="-6" y="-34" width="208" height="172">
          <rect x="-6" y="-34" width="208" height="172" fill="#fff" />
          <path
            d={A}
            stroke="#000"
            strokeWidth={mask}
            fill="none"
            strokeLinejoin="miter"
            strokeLinecap="butt"
          />
        </mask>
      </defs>

      {/* Draw order is part of the spec: masked M, then the A's legs, then the
          crossbar. */}
      <g fill="none" strokeLinejoin="miter" strokeLinecap="butt" strokeWidth={stroke}>
        <path d={M} stroke={ink} mask={`url(#${maskId})`} />
        <path d={A} stroke={legs} />
        <path d={CROSSBAR} stroke={legs} />
      </g>
    </svg>
  )
}
