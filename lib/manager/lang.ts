/**
 * The manager's language switch.
 *
 * The English and Arabic sites are separate content trees (content/ and
 * content/ar/), so Keystatic has a collection or singleton for each. Rather
 * than listing all of them at once, the manager shows one language at a time:
 * the same menu, in the same order, with the keys of the chosen language.
 *
 * The choice lives in localStorage (it is only a view preference) and is read
 * by the Keystatic page, which rebuilds the menu from NAVIGATION below.
 */

export type ManagerLang = 'en' | 'ar'

export const LANG_KEY = 'manager-lang'

/** The menu, in the order sections appear on the site. */
export const NAVIGATION: Record<ManagerLang, Record<string, string[]>> = {
  en: {
    'Page content': ['about', 'projects', 'skills', 'experience', 'teaching', 'openSource', 'posts', 'contact'],
    Profile: ['site', 'socials', 'education', 'publications'],
    Settings: ['sections', 'appearance', 'uiText'],
  },
  ar: {
    'Page content': ['aboutAr', 'projectsAr', 'skillsAr', 'experienceAr', 'teachingAr', 'openSourceAr', 'contactAr'],
    Profile: ['siteAr', 'socialsAr', 'educationAr', 'publicationsAr'],
    Settings: ['arabicSettings', 'sectionsAr', 'appearance', 'uiTextAr'],
  },
}

/** English key → Arabic key, for keys that exist in both languages. */
const PAIRS: Record<string, string> = Object.fromEntries(
  ['about', 'projects', 'skills', 'experience', 'teaching', 'openSource', 'contact', 'site', 'socials', 'education', 'publications', 'sections', 'uiText'].map(
    (k) => [k, `${k}Ar`],
  ),
)
const REVERSE: Record<string, string> = Object.fromEntries(Object.entries(PAIRS).map(([en, ar]) => [ar, en]))

/** Suffix the Arabic labels carry in the config; dropped in the Arabic view. */
export const AR_LABEL_SUFFIX = ' · Arabic'

export function readLang(): ManagerLang {
  try {
    return localStorage.getItem(LANG_KEY) === 'ar' ? 'ar' : 'en'
  } catch {
    return 'en'
  }
}

/**
 * Where to go after switching: the same screen in the other language when it
 * has one (/keystatic/singleton/about → /keystatic/singleton/aboutAr), the
 * list when an entry's slug may differ, and the dashboard otherwise.
 */
export function counterpartPath(pathname: string, to: ManagerLang): string {
  const m = pathname.match(/^\/keystatic(?:\/branch\/[^/]+)?\/(collection|singleton)\/([^/]+)(\/item\/[^/]+)?/)
  const base = pathname.match(/^\/keystatic(?:\/branch\/[^/]+)?/)?.[0] ?? '/keystatic'
  if (!m) return pathname
  const [, kind, key, item] = m
  const other = to === 'ar' ? PAIRS[key] : REVERSE[key]
  if (!other) return base
  // Projects share slugs across languages, so an open entry maps across.
  return `${base}/${kind}/${other}${item ?? ''}`
}

/** The language a screen belongs to, or null for shared screens and the dashboard. */
export function langOfPath(pathname: string): ManagerLang | null {
  const key = pathname.match(/\/(?:collection|singleton)\/([^/]+)/)?.[1]
  if (!key) return null
  if (key in REVERSE || key === 'arabicSettings') return 'ar'
  if (key in PAIRS || key === 'posts') return 'en'
  return null
}
