/**
 * The ↗ that marks a link as leaving the site.
 *
 * Decorative: `outbound()` has already given the anchor `target="_blank"`, and
 * the link text says where it goes, so announcing an arrow adds nothing.
 */
export default function ExternalGlyph() {
  return <span aria-hidden="true">↗</span>
}
