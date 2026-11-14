import Nav from '@/components/Nav'
import CommandPalette from '@/components/CommandPalette'
import Hero from '@/components/Hero'
import Aurora from '@/components/Aurora'
import About from '@/components/About'
import Projects from '@/components/Projects'
import OpenSource from '@/components/OpenSource'
import Skills from '@/components/Skills'
import Experience from '@/components/Experience'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import BackToTop from '@/components/BackToTop'
import ScrollProgress from '@/components/ScrollProgress'
import StructuredData from '@/components/StructuredData'
import {
  arabicEnabled,
  getProjects,
  getSections,
  getSite,
  getSocials,
  type SectionEntry,
} from '@/lib/content'
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
  const [sections, site, hasArabic, projects, socials] = await Promise.all([
    getSections(locale),
    getSite(locale),
    arabicEnabled(),
    getProjects(locale),
    getSocials(locale),
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

      {/* Machine-readable identity, for the name query. */}
      <StructuredData locale={locale} />

      <Aurora />
      <ScrollProgress />
      <Nav
        siteName={site.name}
        sections={sections}
        locale={locale}
        languageHrefs={hasArabic ? { en: '/', ar: '/ar' } : undefined}
        resumeUrl={site.resumeUrl || undefined}
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
      <CommandPalette
        locale={locale}
        sections={sections}
        projects={projects.map((p) => ({ slug: p.slug, title: p.title, year: p.year }))}
        email={site.email}
        resumeUrl={site.resumeUrl}
        socials={socials.map((s) => ({ label: s.label, href: s.href }))}
      />
    </div>
  )
}
