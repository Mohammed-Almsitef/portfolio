/**
 * The MA monogram: a roman M interlocked with an italic A.
 *
 * The A leans into the M and stands in front of it, so the M's right stem
 * tapers away into the A's diagonal and the two initials share one structure.
 * A hairline gap separates them where they cross, as in an engraved monogram.
 *
 * The letterforms are Instrument Serif (the site's display face, SIL Open Font
 * License) converted to outlines, so the mark never depends on a font loading.
 * The M is ink; the A carries the accent. Colours come from `--logo-ink` /
 * `--logo-accent` (globals.css). Source files and spec: assets/brand/.
 */

const M = 'M315.0 -10.0Q311.0 -10.0 306.0 -13.0Q301.0 -16.0 299.0 -26.0L148.0 -639.0Q147.0 -646.0 142.0 -645.5Q137.0 -645.0 137.0 -638.0L117.0 -86.0Q116.0 -58.0 126.0 -43.5Q136.0 -29.0 161.0 -25.0L174.0 -23.0Q187.0 -22.0 187.0 -11.0Q187.0 0.0 172.0 0.0H29.0Q14.0 0.0 14.0 -11.0Q14.0 -22.0 27.0 -23.0L40.0 -25.0Q66.0 -29.0 75.5 -43.5Q85.0 -58.0 86.0 -86.0L106.0 -654.0Q107.0 -675.0 100.0 -682.0Q93.0 -689.0 70.0 -693.0L47.0 -697.0Q34.0 -700.0 34.0 -709.0Q34.0 -720.0 49.0 -720.0H169.0Q200.0 -720.0 207.0 -690.0L328.0 -191.0Q330.0 -184.0 334.5 -184.0Q339.0 -184.0 340.0 -191.0L466.0 -695.0Q472.0 -720.0 498.0 -720.0H616.0Q631.0 -720.0 631.0 -709.0Q631.0 -700.0 618.0 -697.0L595.0 -693.0Q574.0 -689.0 567.0 -682.0Q560.0 -675.0 561.0 -654.0L581.0 -66.0Q582.0 -45.0 588.0 -38.0Q594.0 -31.0 615.0 -27.0L638.0 -23.0Q651.0 -20.0 651.0 -11.0Q651.0 0.0 636.0 0.0H455.0Q440.0 0.0 440.0 -11.0Q440.0 -20.0 453.0 -23.0L476.0 -27.0Q497.0 -31.0 504.0 -38.0Q511.0 -45.0 510.0 -66.0L493.0 -638.0Q493.0 -645.0 488.5 -645.5Q484.0 -646.0 482.0 -640.0L330.0 -26.0Q328.0 -16.0 323.5 -13.0Q319.0 -10.0 315.0 -10.0Z'
const A = 'M428.0 0.0Q416.0 0.0 416.0 -10.0Q416.0 -19.0 432.0 -23.0L448.0 -26.0Q468.0 -30.0 482.5 -45.5Q497.0 -61.0 510.0 -89.0L809.0 -714.0Q814.0 -724.0 819.0 -727.0Q824.0 -730.0 828.0 -730.0Q833.0 -730.0 836.5 -727.0Q840.0 -724.0 840.0 -714.0L851.0 -80.0Q852.0 -52.0 858.0 -41.5Q864.0 -31.0 883.0 -26.0L896.0 -23.0Q908.0 -20.0 908.0 -11.0Q908.0 0.0 891.0 0.0H726.0Q713.0 0.0 713.0 -10.0Q713.0 -21.0 733.0 -23.0L753.0 -25.0Q770.0 -27.0 776.5 -36.0Q783.0 -45.0 783.0 -67.0L781.0 -222.0Q781.0 -248.0 754.0 -248.0H647.0Q621.0 -248.0 608.0 -222.0L543.0 -88.0Q516.0 -31.0 561.0 -25.0L575.0 -23.0Q590.0 -21.0 590.0 -11.0Q590.0 0.0 573.0 0.0ZM651.0 -278.0H763.0Q780.0 -278.0 780.0 -295.0L778.0 -568.0H773.0L642.0 -295.0Q638.0 -288.0 641.0 -283.0Q644.0 -278.0 651.0 -278.0Z'
/** The A as a solid silhouette: what the M is cut away behind. */
const A_SILHOUETTE = 'M814 -730 L840 -730 L908 0 L416 0 Z'

/** Width and cap height of the mark, in font units. */
const W = 947
const CAP = 720

/**
 * Optical compensation. `stroke` thickens the outlines so hairline serifs
 * survive at small sizes; `gap` widens the separation so it does not close up.
 */
const WEIGHTS = {
  /** 48px and above. */
  regular: { stroke: 0, gap: 30 },
  /** ~32px. */
  medium: { stroke: 10, gap: 32 },
  /** ~24px. */
  small: { stroke: 20, gap: 38 },
  /** 16px — the minimum size. */
  tiny: { stroke: 30, gap: 46 },
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
  const { stroke, gap } = WEIGHTS[weight]
  const pad = 30 + stroke
  const maskId = `${id}-cut`
  const box = { x: -200, y: -CAP - 200, width: W + 400, height: CAP + 400 }

  return (
    <svg
      viewBox={`${-pad} ${-CAP - pad} ${W + pad * 2} ${CAP + pad * 2}`}
      className={className}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      focusable="false"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" {...box}>
          <rect {...box} fill="#fff" />
          <path d={A_SILHOUETTE} fill="#000" stroke="#000" strokeWidth={gap + stroke} strokeLinejoin="round" />
        </mask>
      </defs>
      <path d={M} fill={ink} stroke={ink} strokeWidth={stroke} strokeLinejoin="round" mask={`url(#${maskId})`} />
      <path d={A} fill={accent} stroke={accent} strokeWidth={stroke} strokeLinejoin="round" />
    </svg>
  )
}
