/**
 * Which platform a social link points at.
 *
 * The manager only asks for a label and a URL, because that is all an owner
 * should have to think about. The icon and the handle shown under it are
 * derived from the URL here, so adding a link never means also picking an
 * icon — though the manager keeps an override for the cases where the host
 * doesn't give it away (a personal domain, a self-hosted Mastodon).
 */
export type PlatformId =
  | 'github'
  | 'linkedin'
  | 'x'
  | 'facebook'
  | 'instagram'
  | 'whatsapp'
  | 'telegram'
  | 'youtube'
  | 'gmail'
  | 'email'
  | 'scholar'
  | 'orcid'
  | 'researchgate'
  | 'stackoverflow'
  | 'discord'
  | 'medium'
  | 'website'

/**
 * How the second line of a link tile reads.
 *
 * `at` suits the platforms where the last path segment *is* the handle
 * (github.com/name, t.me/name). `plain` is for identifiers that aren't
 * handles — a phone number on wa.me. `host` is for links whose path is an
 * opaque id (a Scholar `?user=` query) or simply a site, where the domain
 * says more than the path does.
 */
type HandleStyle = 'at' | 'plain' | 'host' | 'email'

/**
 * Which of the site's tones a platform borrows.
 *
 * Deliberately the palette's own tones rather than the real brand colours: six
 * literal brand hues in one grid fight each other and fight the accent, and
 * GitHub's near-black would vanish on the dark theme. These are picked to sit
 * *near* each brand — emerald for WhatsApp, rose for Instagram — so the grid
 * still reads at a glance while staying one family with the rest of the page.
 */
type Tone =
  | 'blue'
  | 'violet'
  | 'purple'
  | 'cyan'
  | 'rose'
  | 'emerald'
  | 'amber'
  | 'teal'
  | 'lime'

type Platform = {
  /** Name shown when the CMS label is empty. */
  name: string
  /** Hostnames that identify this platform, without `www.`. */
  hosts: string[]
  handle: HandleStyle
  tone: Tone
}

const PLATFORMS: Record<PlatformId, Platform> = {
  github: { name: 'GitHub', hosts: ['github.com', 'gist.github.com'], handle: 'at', tone: 'purple' },
  linkedin: { name: 'LinkedIn', hosts: ['linkedin.com'], handle: 'at', tone: 'blue' },
  x: { name: 'X', hosts: ['x.com', 'twitter.com'], handle: 'at', tone: 'violet' },
  facebook: {
    name: 'Facebook',
    hosts: ['facebook.com', 'fb.com', 'fb.me'],
    handle: 'at',
    tone: 'cyan',
  },
  instagram: { name: 'Instagram', hosts: ['instagram.com'], handle: 'at', tone: 'rose' },
  whatsapp: {
    name: 'WhatsApp',
    hosts: ['wa.me', 'whatsapp.com', 'api.whatsapp.com'],
    handle: 'plain',
    tone: 'emerald',
  },
  telegram: {
    name: 'Telegram',
    hosts: ['t.me', 'telegram.me', 'telegram.org'],
    handle: 'at',
    tone: 'cyan',
  },
  youtube: { name: 'YouTube', hosts: ['youtube.com', 'youtu.be'], handle: 'at', tone: 'rose' },
  gmail: { name: 'Gmail', hosts: ['mail.google.com'], handle: 'email', tone: 'rose' },
  email: { name: 'Email', hosts: [], handle: 'email', tone: 'teal' },
  scholar: { name: 'Google Scholar', hosts: ['scholar.google.com'], handle: 'host', tone: 'blue' },
  orcid: { name: 'ORCID', hosts: ['orcid.org'], handle: 'plain', tone: 'lime' },
  researchgate: { name: 'ResearchGate', hosts: ['researchgate.net'], handle: 'host', tone: 'teal' },
  stackoverflow: {
    name: 'Stack Overflow',
    hosts: ['stackoverflow.com', 'stackexchange.com'],
    handle: 'host',
    tone: 'amber',
  },
  discord: { name: 'Discord', hosts: ['discord.com', 'discord.gg'], handle: 'host', tone: 'violet' },
  medium: { name: 'Medium', hosts: ['medium.com'], handle: 'at', tone: 'emerald' },
  website: { name: 'Website', hosts: [], handle: 'host', tone: 'teal' },
}

export const PLATFORM_IDS = Object.keys(PLATFORMS) as PlatformId[]

export function platformName(id: PlatformId) {
  return PLATFORMS[id].name
}

export function platformTone(id: PlatformId) {
  return PLATFORMS[id].tone
}

/** `www.` carries no information and only makes the handle line longer. */
function bareHost(host: string) {
  return host.replace(/^www\./, '').toLowerCase()
}

/**
 * A URL is only parseable once it has a scheme. The manager's URL field does
 * not insist on one, so a pasted `github.com/name` has to be given `https://`
 * before it can be read — and before it can be followed, hence `hrefOf`.
 */
function parse(href: string) {
  try {
    return new URL(/^[a-z][a-z0-9+.-]*:/i.test(href) ? href : `https://${href}`)
  } catch {
    return null
  }
}

/** The href to actually put in the anchor: schemeless input gets `https://`. */
export function hrefOf(href: string) {
  return parse(href)?.href ?? href
}

/**
 * The platform a link belongs to, from its host — falling back to the label,
 * so a link typed as a handle rather than a URL still gets its icon.
 */
export function detectPlatform(href: string, label = ''): PlatformId {
  const url = parse(href)

  if (url?.protocol === 'mailto:') {
    return url.pathname.toLowerCase().endsWith('@gmail.com') ? 'gmail' : 'email'
  }
  if (url?.protocol === 'tel:') return 'whatsapp'

  if (url) {
    const host = bareHost(url.hostname)
    for (const id of PLATFORM_IDS) {
      if (PLATFORMS[id].hosts.some((h) => host === h || host.endsWith(`.${h}`))) return id
    }
  }

  const named = label.trim().toLowerCase()
  if (named) {
    const match = PLATFORM_IDS.find(
      (id) => id === named || PLATFORMS[id].name.toLowerCase() === named,
    )
    if (match) return match
  }

  return 'website'
}

/**
 * The line under the label: a handle, a number, or a domain.
 *
 * Returns null when it would only repeat the label — a tile reading
 * "Website / website" is noise.
 */
export function handleOf(href: string, platform: PlatformId): string | null {
  const url = parse(href)
  if (!url) return null

  const style = PLATFORMS[platform].handle

  if (url.protocol === 'mailto:') return decodeURIComponent(url.pathname) || null
  if (style === 'email') return null

  const host = bareHost(url.hostname)
  if (style === 'host') return host

  // LinkedIn nests the handle (`/in/name`, `/company/name`) and trailing
  // slashes are common in pasted URLs, so take the last non-empty segment.
  const segments = url.pathname.split('/').filter(Boolean).map(decodeURIComponent)
  const last = segments.at(-1)
  if (!last) return host || null

  const bare = last.replace(/^@/, '')
  if (style === 'at') return `@${bare}`
  // A wa.me path is a phone number in international form; the leading `+` is
  // part of reading it as one.
  return /^\d{6,}$/.test(bare) ? `+${bare}` : bare
}
