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
import TagList from '@/components/TagList'
import ExternalGlyph from '@/components/ExternalGlyph'
import VideoEmbed from '@/components/VideoEmbed'
import { BLOCK_HEADING } from '@/lib/styles'

/** The two source/demo links under the title, which share one treatment. */
const TONE_LINK =
  'mono-label tap gap-1 font-mono text-xs text-[rgb(var(--tone))] underline-offset-4 hover:underline'

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border pt-10 first:border-0 first:pt-0">
      <h2 className="mb-5 text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
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
      style={{ '--tone': `var(--tone-${project.tone})` } as React.CSSProperties}
    >
      <Aurora />
      <ScrollProgress />

      <header data-print-hide className="sticky top-0 z-40 border-b border-border bg-bg/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href={localePath(locale)}
            className="mono-label tap items-center gap-2.5 font-mono text-sm font-medium tracking-tight transition-colors hover:text-accent"
          >
            <Logo id="case-study-logo" weight="medium" className="h-9 w-auto shrink-0" />
            {/* Same trade as the site nav: on a phone the mark stands alone
                rather than wrapping the name onto two lines. */}
            <span className="hidden truncate sm:inline">{site.name}</span>
          </Link>
          {/* The case study has its own header rather than the site nav, so the
              switch has to be repeated here — otherwise a reader who lands on a
              project from search has no way to change language. */}
          <div className="flex items-center gap-4">
            <Link
              href={localePath(locale, '/#projects')}
              className="mono-label tap whitespace-nowrap font-mono text-xs text-muted transition-colors hover:text-accent"
            >
              <span aria-hidden="true" className="rtl:-scale-x-100 inline-block">
                ←
              </span>{' '}
              {t(locale, 'allProjects')}
            </Link>
            {hasArabic && <LanguageSwitch locale={locale} hrefs={languageHrefs} />}
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

          <h1 className="text-gradient mt-4 text-[clamp(2.1rem,4.4vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em]">
            {project.title}
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-body">{project.summary}</p>
        </div>

        {/* Proof it runs, before any of the prose. A self-hosted clip is the
            strongest form of that, so it wins over an embed or the art. */}
        <div>
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
              {t(locale, 'keyResults')}
            </h2>
            <ul className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
              {project.results.map((r, i) => (
                <li
                  key={i}
                  className="glass glow-border rounded-2xl p-5 text-[0.9375rem] leading-relaxed text-body [border-top:2px_solid_rgb(var(--tone))]"
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

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="glass rounded-2xl p-6">
              <h2 className={`${BLOCK_HEADING} mb-5 text-muted`}>{t(locale, 'projectFacts')}</h2>
              <dl className="space-y-5 text-sm">
                {project.role && (
                  <div>
                    <dt className="text-xs text-muted">{t(locale, 'myRole')}</dt>
                    <dd className="mt-1 leading-relaxed">{project.role}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-muted">{t(locale, 'factYear')}</dt>
                  <dd className="mt-1">{project.year}</dd>
                </div>
                {project.tags.length > 0 && (
                  <div>
                    <dt className="text-xs text-muted">{t(locale, 'factStack')}</dt>
                    <dd className="mt-2">
                      <TagList tags={project.tags} locale={locale} />
                    </dd>
                  </div>
                )}
                {(project.repoUrl || project.liveUrl) && (
                  <div>
                    <dt className="text-xs text-muted">{t(locale, 'links')}</dt>
                    <dd className="mt-1.5 flex flex-wrap gap-4">
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
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <nav aria-label={t(locale, 'projectNavigation')} data-print-hide className="mt-6 hidden px-1 lg:block">
              <ul className="space-y-2 border-s border-border text-sm">
                {[
                  ['problem', t(locale, 'theProblem')],
                  ['solution', t(locale, 'whatIBuilt')],
                  ['how', t(locale, 'howItWorks')],
                  ...(project.testing ? [['testing', t(locale, 'howItWasTested')]] : []),
                  ['lessons', t(locale, 'whatILearned')],
                ].map(([id, label]) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className="-ms-px block border-s border-transparent ps-4 text-muted transition-colors hover:border-[rgb(var(--tone))] hover:text-text"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>

        <nav
          data-print-hide
          aria-label={t(locale, 'projectNavigation')}
          className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8"
        >
          <Link
            href={localePath(locale, '/#projects')}
            className="mono-label tap font-mono text-xs text-muted transition-colors hover:text-accent"
          >
            <span aria-hidden="true" className="rtl:-scale-x-100 inline-block">
              ←
            </span>{' '}
            {t(locale, 'allProjects')}
          </Link>
          <Link
            href={localePath(locale, `/projects/${next.slug}`)}
            className="mono-label tap text-end font-mono text-xs text-muted transition-colors hover:text-accent"
          >
            {t(locale, 'next')}: {next.title}{' '}
            <span aria-hidden="true" className="rtl:-scale-x-100 inline-block">
              →
            </span>
          </Link>
        </nav>
      </main>

      <Footer locale={locale} />
    </div>
  )
}
