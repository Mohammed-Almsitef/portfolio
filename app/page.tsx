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

export default function Home() {
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
      <Nav />

      <main id="main">
        <Hero />
        <About />
        <Projects />
        <OpenSource />
        <Skills />
        <Experience />
        <Contact />
      </main>

      <Footer />
      <BackToTop />
    </>
  )
}
