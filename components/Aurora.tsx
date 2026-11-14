/**
 * The page's ambient light: three blurred glows in the accent, violet and cyan
 * tones drifting slowly behind everything (styles in globals.css, `.aurora`).
 * Pure CSS, so it costs no JavaScript and stops under reduced motion.
 */
export default function Aurora() {
  return (
    <div aria-hidden="true" className="aurora">
      <span />
      <span />
      <span />
    </div>
  )
}
