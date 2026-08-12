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
import { getSections, getSite, type SectionEntry } from '@/lib/content'

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

export default async function Home() {
  const [sections, site] = await Promise.all([getSections(), getSite()])

  return (
    <>
      {/* First tab stop: lets keyboard and screen-reader users jump the nav. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-bg"
      >
        Skip to content
      </a>

      <ScrollProgress />
      <Nav siteName={site.name} sections={sections} />

      <main id="main">
        <Hero />
        {sections.map((section: SectionEntry) => {
          const Section = SECTIONS[section.key]
          return Section ? (
            <Section key={section.key} title={section.label} index={section.index} />
          ) : null
        })}
      </main>

      <Footer />
      <BackToTop />
    </>
  )
}
