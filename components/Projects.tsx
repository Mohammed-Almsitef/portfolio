import Image from 'next/image'
import Link from 'next/link'
import { getProjects, type Project } from '@/lib/content'
import { outbound } from '@/lib/links'
import { localePath, t, type Locale } from '@/lib/locale'
import ProjectClip from './ProjectClip'
import ProjectVisual from './ProjectVisual'
import Reveal from './Reveal'
import Section from './Section'

/**
 * Cover art, in descending order of how much it proves: a clip outranks a
 * photo, which outranks the generated drawing.
 */
function Cover({ p, className }: { p: Project; className: string }) {
  if (p.clip) return <ProjectClip src={p.clip} poster={p.image} title={p.title} className={className} />
  if (p.image) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image src={p.image} alt="" fill sizes="(max-width: 768px) 100vw, 320px" className="object-cover" />
      </div>
    )
  }
  return <ProjectVisual kind={p.visual} className={className} />
}

/**
 * Selected work as an editorial index: one row per project — number and
 * year, a serif title, the summary, the stack in a line — with the cover as a
 * small figure beside it. The whole row is the link to the case study.
 */
export default async function Projects({ title, locale = 'en' }: { title: string; locale?: Locale }) {
  const projects = await getProjects(locale)

  return (
    <Section id="projects" title={title}>
      <ol className="divide-y divide-border border-y border-border">
        {projects.map((p, i) => (
          <li key={p.slug}>
            <Reveal delay={Math.min(i, 3) * 60}>
              <article
                style={{ '--tone': `var(--tone-${p.tone})` } as React.CSSProperties}
                className="group relative grid gap-6 py-9 md:grid-cols-[minmax(0,1fr)_17rem] md:gap-10"
              >
                <div className="min-w-0">
                  <p className="flex items-baseline gap-3 font-mono text-xs text-muted">
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    <span aria-hidden="true">/</span>
                    <span>{p.year}</span>
                  </p>
                  <h3 className="font-display mt-3 text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.08]">
                    {/* Stretched link: the whole row opens the case study. */}
                    <Link
                      href={localePath(locale, `/projects/${p.slug}`)}
                      className="decoration-1 underline-offset-[0.18em] after:absolute after:inset-0 after:content-[''] group-hover:underline"
                    >
                      {p.title}
                    </Link>
                  </h3>
                  <p className="mt-4 max-w-2xl leading-relaxed text-body">{p.summary}</p>
                  <p className="mt-4 text-sm text-muted">{p.tags.slice(0, 5).join(' · ')}</p>
                  <div className="relative mt-5 flex flex-wrap items-center gap-5 text-sm">
                    <span className="pointer-events-none font-medium text-text">
                      {t(locale, 'caseStudy')}{' '}
                      <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1 rtl:-scale-x-100">
                        →
                      </span>
                    </span>
                    {p.repoUrl && (
                      <a {...outbound(p.repoUrl)} className="ed-link relative z-1 text-muted hover:text-text">
                        {t(locale, 'source')} ↗
                      </a>
                    )}
                    {p.videoUrl && (
                      <a {...outbound(p.videoUrl)} className="ed-link relative z-1 text-muted hover:text-text">
                        {t(locale, 'video')} ↗
                      </a>
                    )}
                  </div>
                </div>
                <Cover
                  p={p}
                  className="aspect-[16/10] w-full self-start overflow-hidden rounded-lg border border-border bg-elevated transition-transform duration-500 group-hover:scale-[1.015]"
                />
              </article>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  )
}
