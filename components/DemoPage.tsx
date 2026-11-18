import Link from 'next/link'
import Aurora from '@/components/Aurora'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'
import SlamViewport from '@/components/SlamViewport'
import ThemeToggle from '@/components/ThemeToggle'
import { getSite } from '@/lib/content'
import { dir, localePath, t, type Locale } from '@/lib/locale'
import { simLabels } from '@/lib/simLabels'

/**
 * The robot simulation on its own page, large, with a plain explanation of
 * what is running. Shareable on its own.
 */
export default async function DemoPage({ locale }: { locale: Locale }) {
  const site = await getSite(locale)
  const steps = [
    ['demoStep1Title', 'demoStep1'],
    ['demoStep2Title', 'demoStep2'],
    ['demoStep3Title', 'demoStep3'],
    ['demoStep4Title', 'demoStep4'],
    ['demoStep5Title', 'demoStep5'],
  ] as const

  return (
    <div dir={dir(locale)} lang={locale}>
      <Aurora />
      <header data-print-hide className="sticky top-0 z-40 border-b border-border bg-bg/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href={localePath(locale)}
            aria-label={site.name}
            className="tap items-center gap-2.5 text-[0.9375rem] font-semibold tracking-tight hover:text-accent"
          >
            <Logo id="demo-logo" weight="medium" className="h-9 w-auto shrink-0" />
            <span className="hidden sm:inline">{site.name}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={localePath(locale)}
              className="tap gap-1.5 whitespace-nowrap text-sm text-muted transition-colors hover:text-accent"
            >
              <span aria-hidden="true" className="inline-block rtl:-scale-x-100">
                ←
              </span>
              {t(locale, 'home')}
            </Link>
            {site.resumeUrl && (
              <a
                href={site.resumeUrl}
                className="btn-ghost hidden h-9 items-center rounded-lg px-3 text-sm font-medium sm:inline-flex"
              >
                {t(locale, 'cv')}
              </a>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-6 pb-24 pt-12 md:pt-16">
        <p className="mono-label font-mono text-sm text-accent">{t(locale, 'demoKicker')}</p>
        <h1 className="mt-3 max-w-3xl text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.035em]">
          {t(locale, 'demoTitle')}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-body">{t(locale, 'demoLead')}</p>

        <div data-print-hide className="mt-10">
          <SlamViewport labels={simLabels(locale)} />
        </div>

        <h2 className="mt-16 text-2xl font-semibold tracking-tight">{t(locale, 'demoHow')}</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map(([title, body], i) => (
            <li key={title} className="glass rounded-2xl p-5">
              <p className="flex items-baseline gap-2 font-semibold tracking-tight">
                <span className="font-mono text-xs text-accent">{i + 1}</span>
                {t(locale, title)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-body">{t(locale, body)}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted">{t(locale, 'demoNote')}</p>
        <Link
          href={localePath(locale, '/#projects')}
          className="btn-primary mt-8 inline-flex rounded-xl px-6 py-3 text-sm font-semibold"
        >
          {t(locale, 'demoCta')}
        </Link>
      </main>
      <Footer locale={locale} />
    </div>
  )
}
