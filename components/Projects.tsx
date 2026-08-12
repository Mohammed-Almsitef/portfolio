import Image from 'next/image'
import Link from 'next/link'
import { getProjects, type Project } from '@/lib/content'
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
      className={`group/link tap gap-1 font-mono text-xs underline-offset-4 transition-colors hover:underline ${
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

function Cover({ p, className }: { p: Project; className: string }) {
  const sideFade = Boolean(p.featured)
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

function Body({ p, index }: { p: Project; index: number }) {
  return (
    <div className="flex flex-1 flex-col p-6 md:p-7">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-medium tracking-tight md:text-xl">
          <span aria-hidden="true" className="mr-3 font-mono text-xs text-[rgb(var(--tone))]">
            {String(index + 1).padStart(2, '0')}
          </span>
          {p.title}
        </h3>
        <span className="shrink-0 font-mono text-xs text-muted">{p.year}</span>
      </div>

      <p className="mt-4 flex-1 leading-relaxed text-body">{p.summary}</p>

      <ul className="mt-6 flex flex-wrap gap-2" aria-label="Technologies used">
        {p.tags.map((t) => (
          <li
            key={t}
            className="rounded-md border border-[rgb(var(--tone)/0.25)] bg-bg/50 px-2 py-1 font-mono text-xs text-muted transition-colors group-hover:border-[rgb(var(--tone)/0.55)]"
          >
            {t}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-5 border-t border-border pt-5">
        <Link
          href={`/projects/${p.slug}`}
          className="tap gap-1 font-mono text-xs text-[rgb(var(--tone))] underline-offset-4 hover:underline"
        >
          Read the case study
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          >
            →
          </span>
        </Link>
        {p.repoUrl && <ProjectLink href={p.repoUrl}>Source</ProjectLink>}
        {p.videoUrl && <ProjectLink href={p.videoUrl}>Video</ProjectLink>}
      </div>
    </div>
  )
}

export default async function Projects({ title, index }: { title: string; index: string }) {
  const projects = await getProjects()

  return (
    <Section id="projects" title={title} index={index} tone="raised">
      <ul className="grid gap-5 md:grid-cols-2">
        {projects.map((p, i) => (
          <li key={p.title} className={p.featured ? 'md:col-span-2' : ''}>
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
                innerClassName={`flex h-full flex-col ${p.featured ? 'md:flex-row' : ''}`}
              >
                <Cover
                  p={p}
                  className={p.featured ? 'h-44 shrink-0 md:h-auto md:w-[42%]' : 'h-40 shrink-0'}
                />
                <Body p={p} index={i} />
              </Spotlight>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  )
}
