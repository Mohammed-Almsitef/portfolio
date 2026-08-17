import Logo from '../Logo'

/**
 * The mark in the manager's sidebar.
 *
 * The same monogram as the site, so the manager reads as part of it. The colours
 * are passed in rather than read from `--logo-ink` / `--logo-accent`, because
 * the manager's light/dark setting is its own — independent of the site's — and
 * Keystatic hands us the resolved scheme. That is also what keeps the handoff's
 * rule intact: the ink-on-light pairing and the light-on-ink pairing are not
 * interchangeable.
 */
export default function BrandMark({ colorScheme }: { colorScheme: 'light' | 'dark' }) {
  const dark = colorScheme === 'dark'

  return (
    <Logo
      id="manager-logo"
      weight="medium"
      label="Mohammed Almsitef"
      ink={dark ? '#f3f2f2' : '#201e1d'}
      accent={dark ? '#60a5fa' : '#1d4ed8'}
      className="h-9 w-auto shrink-0"
    />
  )
}
