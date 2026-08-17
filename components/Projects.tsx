import Image from 'next/image'
import Link from 'next/link'
import { getProjects, type Project } from '@/lib/content'
import { localePath, t, type Locale } from '@/lib/locale'
import ProjectClip from './ProjectClip'
import ProjectVisual from './ProjectVisual'
import Reveal from './Reveal'
import Section from './Section'
import Spotlight from './Spotlight'

function ProjectLink({
  href,
  children,
  primary = false,
}: {
  href: string
  children: React.ReactNode
  primary?: boolean
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`mono-label group/link tap gap-1 font-mono text-xs underline-offset-4 transition-colors hover:underline ${
        primary ? 'text-[rgb(var(--tone))]' : 'text-muted hover:text-text'
      }`}
    >
      {children}
      <span
        aria-hidden="true"
        className="transition-transform duration-200 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
      >
        ↗
      </span>
    </a>
  )
}

/**
 * Cover art, in descending order of how much it proves.
 *
 * A clip of the thing running outranks a screenshot, which outranks the
 * generated art — so a project earns a better cover by having better evidence,
 * without anyone editing this file.
 */
function Cover({ p, className }: { p: Project; className: string }) {
  const sideFade = Boolean(p.featured)

  if (p.clip) {
    return <ProjectClip src={p.clip} poster={p.image} title={p.title} className={className} />
  }
  if (p.image) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={p.image}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
    )
  }
  return <ProjectVisual kind={p.visual} className={className} sideFade={sideFade} />
}

function Body({ p, index, locale }: { p: Project; index: number; locale: Locale }) {
  return (
    <div className="flex flex-1 flex-col p-6 md:p-7">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-medium tracking-tight md:text-xl">
          <span aria-hidden="true" className="me-3 font-mono text-xs text-[rgb(var(--tone))]">
            {String(index + 1).padStart(2, '0')}
          </span>
          {/* The title is the card's link, stretched over the whole card by its
              own ::after. One link with real text beats an unlabelled overlay:
              the accessible name is the project, and the card still reads as a
              single target to a screen reader rather than a bare region. */}
          <Link
            href={localePath(locale, `/projects/${p.slug}`)}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {p.title}
          </Link>
        </h3>
        <span className="shrink-0 font-mono text-xs text-muted">{p.year}</span>
      </div>

      <p className="mt-4 flex-1 leading-relaxed text-body">{p.summary}</p>

      <ul className="mt-6 flex flex-wrap gap-2" aria-label={t(locale, 'technologiesUsed')}>
        {p.tags.map((t) => (
          <li
            key={t}
            className="rounded-md border border-[rgb(var(--tone)/0.25)] bg-bg/50 px-2 py-1 font-mono text-xs text-muted transition-colors group-hover:border-[rgb(var(--tone)/0.55)]"
          >
            {t}
          </li>
        ))}
      </ul>

      {/* `relative` lifts these clear of the title's stretched ::after, which
          would otherwise swallow their clicks. Hidden entirely when a project
          has neither, rather than leaving a rule above empty space. */}
      {(p.repoUrl || p.videoUrl) && (
        <div className="relative mt-6 flex flex-wrap items-center gap-5 border-t border-border pt-5">
          {p.repoUrl && <ProjectLink href={p.repoUrl}>{t(locale, 'source')}</ProjectLink>}
          {p.videoUrl && <ProjectLink href={p.videoUrl}>{t(locale, 'video')}</ProjectLink>}
        </div>
      )}
    </div>
  )
}

export default async function Projects({
  title,
  locale = 'en',
}: {
  title: string
  locale?: Locale
}) {
  const projects = await getProjects(locale)

  return (
    <Section id="projects" title={title} tone="raised">
      {/* Every card takes one column, featured or not, so each row always holds
          two. Featured still decides ordering, just not footprint. */}
      <ul className="grid gap-5 md:grid-cols-2">
        {projects.map((p, i) => (
          <li key={p.title}>
            {/* Staggered so the grid assembles rather than appearing at once. */}
            <Reveal delay={Math.min(i, 3) * 70} className="h-full">
              <Spotlight
                style={
                  {
                    '--tone': `var(--tone-${p.tone})`,
                    // Spotlight already reads --card-glow; re-point it rather
                    // than teaching the component about tones.
                    '--card-glow': 'rgb(var(--tone) / 0.16)',
                  } as React.CSSProperties
                }
                className="group h-full overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--card-shadow)] transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-[rgb(var(--tone)/0.45)]"
                innerClassName="flex h-full flex-col"
              >
                {/* The side-by-side cover was sized for a full-width card; in
                    a half-width column it left no room for the copy. */}
                <Cover p={p} className="h-40 shrink-0" />
                <Body p={p} index={i} locale={locale} />
              </Spotlight>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  )
}
