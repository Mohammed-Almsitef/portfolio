import Link from 'next/link'
import { notFound } from 'next/navigation'
import { arabicEnabled, getProjects, getSite } from '@/lib/content'
import { dir, localePath, t, type Locale } from '@/lib/locale'
import Footer from '@/components/Footer'
import LanguageSwitch from '@/components/LanguageSwitch'
import ProjectClip from '@/components/ProjectClip'
import ProjectVisual from '@/components/ProjectVisual'
import ScrollProgress from '@/components/ScrollProgress'
import VideoEmbed from '@/components/VideoEmbed'

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-[rgb(var(--tone))]">
        {title}
      </h2>
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

  const index = projects.findIndex((p) => p.slug === slug)
  const next = projects[(index + 1) % projects.length]

  return (
    <div
      dir={dir(locale)}
      lang={locale}
      style={{ '--tone': `var(--tone-${project.tone})` } as React.CSSProperties}
    >
      <ScrollProgress />

      <header data-print-hide className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href={localePath(locale)}
            className="tap font-mono text-sm font-medium tracking-tight transition-colors hover:text-accent"
          >
            {site.name}
          </Link>
          {/* The case study has its own header rather than the site nav, so the
              switch has to be repeated here — otherwise a reader who lands on a
              project from search has no way to change language. */}
          <div className="flex items-center gap-4">
            <Link
              href={localePath(locale, '/#projects')}
              className="tap font-mono text-xs text-muted transition-colors hover:text-accent"
            >
              <span aria-hidden="true" className="rtl:-scale-x-100 inline-block">
                ←
              </span>{' '}
              {t(locale, 'allProjects')}
            </Link>
            {hasArabic && <LanguageSwitch locale={locale} />}
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-6 pb-24 pt-14 md:pt-20">
        <p className="font-mono text-xs text-muted">
          <span className="text-[rgb(var(--tone))]">{String(index + 1).padStart(2, '0')}</span> ·{' '}
          {project.year}
        </p>

        <h1 className="mt-4 text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.08] tracking-[-0.03em]">
          {project.title}
        </h1>

        <p className="mt-5 text-lg leading-relaxed text-body">{project.summary}</p>

        <ul className="mt-7 flex flex-wrap gap-2" aria-label={t(locale, 'technologiesUsed')}>
          {project.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-md border border-[rgb(var(--tone)/0.3)] bg-surface px-2 py-1 font-mono text-xs text-muted"
            >
              {tag}
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-wrap gap-5">
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tap gap-1 font-mono text-xs text-[rgb(var(--tone))] underline-offset-4 hover:underline"
            >
              {t(locale, 'source')} <span aria-hidden="true">↗</span>
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tap gap-1 font-mono text-xs text-[rgb(var(--tone))] underline-offset-4 hover:underline"
            >
              {t(locale, 'liveDemo')} <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>

        {/* Proof it runs, before any of the prose. A self-hosted clip is the
            strongest form of that, so it wins over an embed or the art. */}
        <div className="mt-10">
          {project.clip ? (
            <ProjectClip
              src={project.clip}
              poster={project.image}
              title={project.title}
              className="aspect-video w-full rounded-xl border border-border"
            />
          ) : project.videoUrl ? (
            <VideoEmbed url={project.videoUrl} title={project.title} />
          ) : (
            <ProjectVisual
              kind={project.visual}
              className="aspect-video w-full rounded-xl border border-border"
            />
          )}
        </div>

        <Block title={t(locale, 'theProblem')}>
          <p className="leading-relaxed text-body">{project.problem}</p>
        </Block>

        <Block title={t(locale, 'whatIBuilt')}>
          <p className="leading-relaxed text-body">{project.solution}</p>
        </Block>

        <Block title={t(locale, 'howItWorks')}>
          <Bullets items={project.how} />
        </Block>

        {project.testing && (
          <Block title={t(locale, 'howItWasTested')}>
            <p className="leading-relaxed text-body">{project.testing}</p>
          </Block>
        )}

        <Block title={t(locale, 'results')}>
          <Bullets items={project.results} />
        </Block>

        <Block title={t(locale, 'whatILearned')}>
          <Bullets items={project.lessons} />
        </Block>

        {project.role && (
          <Block title={t(locale, 'myRole')}>
            <p className="leading-relaxed text-body">{project.role}</p>
          </Block>
        )}

        <nav
          data-print-hide
          aria-label={t(locale, 'projectNavigation')}
          className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8"
        >
          <Link
            href={localePath(locale, '/#projects')}
            className="tap font-mono text-xs text-muted transition-colors hover:text-accent"
          >
            <span aria-hidden="true" className="rtl:-scale-x-100 inline-block">
              ←
            </span>{' '}
            {t(locale, 'allProjects')}
          </Link>
          <Link
            href={localePath(locale, `/projects/${next.slug}`)}
            className="tap text-end font-mono text-xs text-muted transition-colors hover:text-accent"
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
