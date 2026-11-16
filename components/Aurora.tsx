/**
 * The page's ambient light: two still, blurred glows in the accent blue, top
 * left and bottom right (styles in globals.css, `.aurora`; the third span is
 * hidden). Pure CSS, no JavaScript.
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
