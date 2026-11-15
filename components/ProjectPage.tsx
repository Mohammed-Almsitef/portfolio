import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { arabicEnabled, getProjects, getSite } from '@/lib/content'
import { dir, localePath, t, type Locale } from '@/lib/locale'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'
import { outbound } from '@/lib/links'
import LanguageSwitch from '@/components/LanguageSwitch'
import ProjectClip from '@/components/ProjectClip'
import ProjectVisual from '@/components/ProjectVisual'
import ScrollProgress from '@/components/ScrollProgress'
import Aurora from '@/components/Aurora'
import FlowDiagram from '@/components/FlowDiagram'
import CaseToc from '@/components/CaseToc'
import CopyEmail from '@/components/CopyEmail'
import ThemeToggle from '@/components/ThemeToggle'
import ExternalGlyph from '@/components/ExternalGlyph'
import VideoEmbed from '@/components/VideoEmbed'
import { BLOCK_HEADING } from '@/lib/styles'

/** The two source/demo links under the title, which share one treatment. */
const TONE_LINK =
  'mono-label tap gap-1 font-mono text-xs text-[rgb(var(--tone))] underline-offset-4 hover:underline'

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border pt-10 first:border-0 first:pt-0">
      <h2 className="font-display t-3 mb-5">{title}</h2>
      {children}
    </section>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 leading-relaxed text-body">
          <span
            aria-hidden="true"
            className="mt-[0.6rem] size-1 shrink-0 rounded-full bg-[rgb(var(--tone))]"
          />
          {item}
        </li>
      ))}
    </ul>
  )
}

/**
 * One case study, in either language.
 *
 * The headings translate and the prose falls back to English, which is the
 * right default here: a reader looking at a controller write-up is reading
 * ROS, Nav2 and SLAM either way, and a half-machine-translated technical
 * paragraph reads worse than the original.
 */
export default async function ProjectPage({ slug, locale }: { slug: string; locale: Locale }) {
  const [projects, site, hasArabic] = await Promise.all([
    getProjects(locale),
    getSite(locale),
    arabicEnabled(),
  ])
  const project = projects.find((p) => p.slug === slug)
  if (!project) notFound()

  /**
   * The two sites hold different projects, so this case study may have no
   * counterpart. When it does not, the switch points at that language's home
   * rather than a page that does not exist.
   */
  const other: Locale = locale === 'ar' ? 'en' : 'ar'
  const otherProjects = hasArabic ? await getProjects(other) : []
  const otherHasIt = otherProjects.some((p) => p.slug === slug)
  const languageHrefs = {
    [locale]: localePath(locale, `/projects/${slug}`),
    [other]: otherHasIt ? localePath(other, `/projects/${slug}`) : localePath(other),
  } as Record<Locale, string>

  const index = projects.findIndex((p) => p.slug === slug)
  const next = projects[(index + 1) % projects.length]

  return (
    <div
      dir={dir(locale)}
      lang={locale}
      // One accent for the whole page; only the cover keeps the project's tone.
      style={{ '--tone': 'var(--accent-tone)' } as React.CSSProperties}
    >
      <Aurora />
      <ScrollProgress />

      <header data-print-hide className="sticky top-0 z-40 border-b border-border bg-bg/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href={localePath(locale)}
            aria-label={site.name}
            className="tap items-center gap-2.5 text-[0.9375rem] font-semibold tracking-tight transition-colors hover:text-accent"
          >
            <Logo id="case-study-logo" weight="medium" className="h-9 w-auto shrink-0" />
            {/* Same trade as the site nav: on a phone the mark stands alone
                rather than wrapping the name onto two lines. */}
            <span className="hidden truncate sm:inline">{site.name}</span>
          </Link>
          {/* The case study has its own header rather than the site nav, so the
              switch has to be repeated here — otherwise a reader who lands on a
              project from search has no way to change language. */}
          <div className="flex items-center gap-3">
            <Link
              href={localePath(locale, '/#projects')}
              className="tap gap-1.5 whitespace-nowrap text-sm text-muted transition-colors hover:text-accent"
            >
              <span aria-hidden="true" className="inline-block rtl:-scale-x-100">
                ←
              </span>
              {t(locale, 'allProjects')}
            </Link>
            {site.resumeUrl && (
              <a
                href={site.resumeUrl}
                className="btn-ghost hidden h-9 items-center rounded-lg px-3 text-sm font-medium sm:inline-flex"
              >
                {t(locale, 'cv')}
              </a>
            )}
            {hasArabic && <LanguageSwitch locale={locale} hrefs={languageHrefs} />}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-6 pb-24 pt-14 md:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
        <div>
          <p className="font-mono text-xs text-muted">
            <span className="text-[rgb(var(--tone))]">{String(index + 1).padStart(2, '0')}</span> ·{' '}
            {project.year}
          </p>

          <h1 className="font-display t-1 mt-4">
            {project.title}
          </h1>

          <p className="t-lead mt-6 text-body">{project.summary}</p>

          {/* Role first: on a team project the reader needs to know which
              part was mine before reading anything else. */}
          <dl className="mt-7 grid gap-x-8 gap-y-4 border-t border-border pt-6 text-sm sm:grid-cols-[auto_1fr]">
            {project.role && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted">{t(locale, 'myRole')}</dt>
                <dd className="mt-1 leading-relaxed">{project.role}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-muted">{t(locale, 'factYear')}</dt>
              <dd className="mt-1 whitespace-nowrap">{project.year}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t(locale, 'factStack')}</dt>
              <dd className="mt-1">{project.tags.slice(0, 5).join(' · ')}</dd>
            </div>
          </dl>
          {(project.repoUrl || project.liveUrl) && (
            <div className="mt-5 flex flex-wrap gap-5">
              {project.repoUrl && (
                <a {...outbound(project.repoUrl)} className={TONE_LINK}>
                  {t(locale, 'source')} <ExternalGlyph />
                </a>
              )}
              {project.liveUrl && (
                <a {...outbound(project.liveUrl)} className={TONE_LINK}>
                  {t(locale, 'liveDemo')} <ExternalGlyph />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Proof it runs, before any of the prose. A self-hosted clip is the
            strongest form of that, so it wins over an embed or the art. */}
        <div style={{ '--tone': `var(--tone-${project.tone})` } as React.CSSProperties}>
          {project.clip ? (
            <ProjectClip
              src={project.clip}
              poster={project.image}
              title={project.title}
              className="aspect-[16/10] w-full rounded-2xl border border-border"
            />
          ) : project.videoUrl ? (
            <VideoEmbed url={project.videoUrl} title={project.title} />
          ) : project.image ? (
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border">
              <Image
                src={project.image}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <ProjectVisual
              kind={project.visual}
              className="aspect-[16/10] w-full rounded-2xl border border-border"
            />
          )}
        </div>
        </div>

        {/* Outcomes first: a reader deciding whether to keep going gets the
            payoff before the narrative. */}
        {project.results.length > 0 && (
          <section aria-labelledby="key-results" className="mt-14">
            <h2 id="key-results" className={`${BLOCK_HEADING} text-[rgb(var(--tone))]`}>
              {t(locale, 'highlights')}
            </h2>
            <ul className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
              {project.results.map((r, i) => (
                <li
                  key={i}
                  className="glass glow-border rounded-2xl p-5 text-[0.9375rem] leading-relaxed text-body [border-top:2px_solid_var(--color-text)]"
                >
                  {r}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14">
          <article className="space-y-12">
            <Block id="problem" title={t(locale, 'theProblem')}>
              <p className="leading-relaxed text-body md:text-[1.0625rem]">{project.problem}</p>
            </Block>

            <Block id="solution" title={t(locale, 'whatIBuilt')}>
              <p className="leading-relaxed text-body md:text-[1.0625rem]">{project.solution}</p>
            </Block>

            <Block id="how" title={t(locale, 'howItWorks')}>
              {project.diagrams.map((d) => (
                <FlowDiagram key={d.title} title={d.title} stages={d.stages} note={d.note} />
              ))}
              <Bullets items={project.how} />
            </Block>

            {project.testing && (
              <Block id="testing" title={t(locale, 'howItWasTested')}>
                <p className="leading-relaxed text-body md:text-[1.0625rem]">{project.testing}</p>
              </Block>
            )}

            <Block id="lessons" title={t(locale, 'whatILearned')}>
              <Bullets items={project.lessons} />
            </Block>
          </article>

          <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <CaseToc
              title={t(locale, 'onThisPage')}
              items={[
                { id: 'problem', label: t(locale, 'theProblem') },
                { id: 'solution', label: t(locale, 'whatIBuilt') },
                { id: 'how', label: t(locale, 'howItWorks') },
                ...(project.testing ? [{ id: 'testing', label: t(locale, 'howItWasTested') }] : []),
                { id: 'lessons', label: t(locale, 'whatILearned') },
              ]}
            />
          </aside>
        </div>

        <div data-print-hide className="mt-20 grid gap-5 md:grid-cols-2">
          <Link
            href={localePath(locale, `/projects/${next.slug}`)}
            style={{ '--tone': `var(--tone-${next.tone})` } as React.CSSProperties}
            className="glass glow-border group flex flex-col overflow-hidden rounded-2xl"
          >
            <ProjectVisual kind={next.visual} className="h-48" />
            <div className="p-6">
              <p className="text-xs text-muted">{t(locale, 'nextProject')}</p>
              <p className="mt-1.5 text-lg font-semibold tracking-tight transition-colors group-hover:text-accent">
                {next.title}{' '}
                <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1 rtl:-scale-x-100">
                  →
                </span>
              </p>
            </div>
          </Link>

          <div className="glass flex flex-col justify-center rounded-2xl p-6 md:p-8">
            <p className="text-xl font-semibold tracking-tight">{t(locale, 'ctaTitle')}</p>
            <p className="mt-2 text-sm leading-relaxed text-body">{t(locale, 'ctaBody')}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <CopyEmail email={site.email} locale={locale} />
              {site.resumeUrl && (
                <a href={site.resumeUrl} className="btn-ghost rounded-xl px-5 py-3 text-sm font-medium">
                  {t(locale, 'downloadCv')}
                </a>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  )
}
