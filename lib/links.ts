/**
 * Outbound links.
 *
 * Every URL on this site comes from the manager, which means every one of them
 * is whatever was pasted into a text field: a bare `github.com/name` with no
 * scheme, a `mailto:`, or a proper address. Two decisions follow from that, and
 * they were being made — or missed — separately at each of the eight places a
 * link is rendered:
 *
 *   - A schemeless URL has to be given `https://`, or the browser reads it as a
 *     path relative to the current page and the link 404s on our own domain.
 *   - Only a link that actually leaves the browser should open a new tab. A
 *     `mailto:` handed to `target="_blank"` hands the visitor the mail client
 *     *and* an empty tab to close afterwards.
 *
 * `outbound()` returns the anchor props, so a call site states the intent once
 * and cannot get half of it right.
 */

/**
 * A URL is only parseable once it has a scheme, and the manager's URL field
 * does not insist on one.
 */
function parse(href: string): URL | null {
  try {
    return new URL(/^[a-z][a-z0-9+.-]*:/i.test(href) ? href : `https://${href}`)
  } catch {
    return null
  }
}

/** The href to put in the anchor: schemeless input gets `https://`. */
export function hrefOf(href: string): string {
  return parse(href)?.href ?? href
}

/** Whether following this link leaves the browser, and so earns a new tab. */
export function isExternal(href: string): boolean {
  return /^https?:/i.test(hrefOf(href))
}

/**
 * Anchor props for a link out of the site. Spread it:
 *
 *   <a {...outbound(project.repoUrl)}>Source</a>
 */
export function outbound(href: string) {
  const resolved = hrefOf(href)

  return resolved && isExternal(resolved)
    ? { href: resolved, target: '_blank' as const, rel: 'noopener noreferrer' }
    : { href: resolved }
}
