import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Projects from '@/components/Projects'
import OpenSource from '@/components/OpenSource'
import Skills from '@/components/Skills'
import Experience from '@/components/Experience'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import BackToTop from '@/components/BackToTop'
import ScrollProgress from '@/components/ScrollProgress'
import { arabicEnabled, getSections, getSite, type SectionEntry } from '@/lib/content'
import { dir, t, type Locale } from '@/lib/locale'

/**
 * Section order and visibility come from content/sections.json, edited in the
 * manager. Adding a component here is the only code change a new section
 * needs — everything else follows from the data.
 */
const SECTIONS = {
  about: About,
  projects: Projects,
  openSource: OpenSource,
  skills: Skills,
  experience: Experience,
  contact: Contact,
} as const

/**
 * One page, rendered in either language.
 *
 * `dir` sits on this wrapper rather than on <html> so that adding Arabic did
 * not require moving every existing route under a `[locale]` segment — the
 * English URLs are already indexed and linked, and `dir` mirrors everything
 * inside the element it is set on either way.
 */
export default async function HomePage({ locale }: { locale: Locale }) {
  const [sections, site, hasArabic] = await Promise.all([
    getSections(locale),
    getSite(locale),
    arabicEnabled(),
  ])

  return (
    <div dir={dir(locale)} lang={locale}>
      {/* First tab stop: lets keyboard and screen-reader users jump the nav. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-bg"
      >
        {t(locale, 'skipToContent')}
      </a>

      <ScrollProgress />
      <Nav
        siteName={site.name}
        sections={sections}
        locale={locale}
        languageHrefs={hasArabic ? { en: '/', ar: '/ar' } : undefined}
        availableForWork={site.availableForWork}
      />

      <main id="main">
        <Hero locale={locale} />
        {sections.map((section: SectionEntry) => {
          const Section = SECTIONS[section.key]
          return Section ? (
            <Section
              key={section.key}
              title={section.label}
              locale={locale}
            />
          ) : null
        })}
      </main>

      <Footer locale={locale} />
      <BackToTop label={t(locale, 'backToTop')} />
    </div>
  )
}
