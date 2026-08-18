import {
  getAbout,
  getEducation,
  getSite,
  getSkillGroups,
  getSocials,
  type Social,
} from '@/lib/content'
import type { Locale } from '@/lib/locale'

/**
 * The Person and WebSite entities, as JSON-LD.
 *
 * A search engine ranking a *name* is not matching a string, it is deciding
 * which entity a query refers to and which page represents it. Title tags and a
 * sitemap don't answer that; `sameAs` does. Listing the profiles that already
 * rank for this name — GitHub, LinkedIn, X — is what lets a crawler merge them
 * with this domain into one person rather than treating the site as an unrelated
 * page that happens to repeat some words.
 *
 * Everything here is read from the CMS, so the graph cannot drift away from what
 * the page actually says. Nothing is asserted that a visitor cannot also see:
 * the claims a crawler reads and the claims on the page are the same claims.
 */

/** Contact methods are not identities, so they are no use as `sameAs` edges. */
const NOT_A_PROFILE = new Set(['whatsapp', 'email', 'gmail'])

function profileUrls(socials: Social[]) {
  return socials
    .filter((s) => !NOT_A_PROFILE.has(s.platform) && /^https?:/i.test(s.href))
    .map((s) => s.href)
}

export default async function StructuredData({ locale = 'en' }: { locale?: Locale }) {
  const [site, socials, skills, education, about] = await Promise.all([
    getSite(locale),
    getSocials(locale),
    getSkillGroups(locale),
    getEducation(locale),
    getAbout(locale),
  ])

  const home = locale === 'ar' ? `${site.url}/ar` : site.url
  const [city, ...rest] = site.location.split(',').map((part) => part.trim())

  const person = {
    '@type': 'Person',
    // A stable id, so both language pages describe one person rather than two.
    '@id': `${site.url}#person`,
    name: site.name,
    alternateName: [...site.alternateNames].filter(Boolean),
    url: site.url,
    jobTitle: site.role,
    description: site.tagline,
    email: `mailto:${site.email}`,
    ...(about.photo ? { image: `${site.url}${about.photo}` } : {}),
    ...(city
      ? {
          address: {
            '@type': 'PostalAddress',
            addressLocality: city,
            ...(rest.length ? { addressCountry: rest[rest.length - 1] } : {}),
          },
        }
      : {}),
    // Flattened: the groups are a layout on the page, not a fact about him.
    knowsAbout: [...site.domains, ...skills.flatMap((g) => g.items)],
    ...(education.length
      ? {
          alumniOf: education.map((e) => ({
            '@type': 'EducationalOrganization',
            name: e.school,
          })),
        }
      : {}),
    sameAs: profileUrls(socials),
  }

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      person,
      {
        '@type': 'WebSite',
        '@id': `${site.url}#website`,
        url: home,
        name: `${site.name} — ${site.role}`,
        inLanguage: locale === 'ar' ? 'ar' : 'en',
        publisher: { '@id': `${site.url}#person` },
      },
      {
        '@type': 'ProfilePage',
        '@id': `${home}#page`,
        url: home,
        mainEntity: { '@id': `${site.url}#person` },
        isPartOf: { '@id': `${site.url}#website` },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      // Server-rendered from CMS text, so a crawler sees it in the HTML rather
      // than after hydration — and JSON.stringify escapes the content.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  )
}
