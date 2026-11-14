/**
 * Outline glyphs for the interface.
 *
 * The sibling of SocialIcon, which carries the *brand* marks: those are filled
 * logos with fixed shapes, these are line drawings that take the current text
 * colour. Keeping them in one table is what stops the same glyph being redrawn
 * per call site — the envelope in particular used to exist twice, at two
 * different stroke weights, in CopyEmail and in SocialIcon.
 *
 * 1.6 is the one stroke weight, matching SocialIcon's outline branch so the
 * generic marks sit at the same weight as the logos beside them.
 */

/** Shared with SocialIcon's `email` mark, which draws the same envelope. */
export const MAIL_PATH =
  'M3.75 5.25h16.5A1.5 1.5 0 0 1 21.75 6.75v10.5a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6.75a1.5 1.5 0 0 1 1.5-1.5ZM2.6 6.1 12 12.9l9.4-6.8'

const GLYPHS = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  mail: <path d={MAIL_PATH} />,
  pin: (
    <path d="M12 21.5s7-5.8 7-11a7 7 0 1 0-14 0c0 5.2 7 11 7 11Z M12 12.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
  ),
  clock: <path d="M12 3.75a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5Z M12 7.75V12l3 1.75" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </>
  ),
  moon: <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" />,
} as const

export type GlyphName = keyof typeof GLYPHS

/**
 * Decorative by default: every call site so far sits beside its own label, so
 * announcing the glyph too would just say the same thing twice.
 */
export default function Icon({ name, className }: { name: GlyphName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS[name]}
    </svg>
  )
}
