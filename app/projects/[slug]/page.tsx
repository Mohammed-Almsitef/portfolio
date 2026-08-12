import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { projects, site } from '@/data/content'
import Footer from '@/components/Footer'
import ProjectVisual from '@/components/ProjectVisual'
import ScrollProgress from '@/components/ScrollProgress'
import VideoEmbed from '@/components/VideoEmbed'

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)
  if (!project) return {}

  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: `${project.title} — ${site.name}`,
      description: project.summary,
      type: 'article',
    },
  }
}

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

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)
  if (!project) notFound()

  const index = projects.findIndex((p) => p.slug === slug)
  const next = projects[(index + 1) % projects.length]

  return (
    <div style={{ '--tone': `var(--tone-${project.tone})` } as React.CSSProperties}>
      <ScrollProgress />

      <header data-print-hide className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/"
            className="tap font-mono text-sm font-medium tracking-tight transition-colors hover:text-accent"
          >
            {site.name}
          </Link>
          <Link
            href="/#projects"
            className="tap font-mono text-xs text-muted transition-colors hover:text-accent"
          >
            ← All projects
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-6 pb-24 pt-14 md:pt-20">
        <p className="font-mono text-xs text-muted">
          <span className="text-[rgb(var(--tone))]">
            {String(index + 1).padStart(2, '0')}
          </span>{' '}
          · {project.year}
        </p>

        <h1 className="mt-4 text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.08] tracking-[-0.03em]">
          {project.title}
        </h1>

        <p className="mt-5 text-lg leading-relaxed text-body">{project.summary}</p>

        <ul className="mt-7 flex flex-wrap gap-2" aria-label="Technologies used">
          {project.tags.map((t) => (
            <li
              key={t}
              className="rounded-md border border-[rgb(var(--tone)/0.3)] bg-surface px-2 py-1 font-mono text-xs text-muted"
            >
              {t}
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
              Source <span aria-hidden="true">↗</span>
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tap gap-1 font-mono text-xs text-[rgb(var(--tone))] underline-offset-4 hover:underline"
            >
              Live demo <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>

        {/* Proof it runs, before any of the prose. */}
        <div className="mt-10">
          {project.videoUrl ? (
            <VideoEmbed url={project.videoUrl} title={project.title} />
          ) : (
            <ProjectVisual
              kind={project.visual}
              className="aspect-video w-full rounded-xl border border-border"
            />
          )}
        </div>

        <Block title="The problem">
          <p className="leading-relaxed text-body">{project.problem}</p>
        </Block>

        <Block title="What I built">
          <p className="leading-relaxed text-body">{project.solution}</p>
        </Block>

        <Block title="How it works">
          <Bullets items={project.how} />
        </Block>

        {project.testing && (
          <Block title="How it was tested">
            <p className="leading-relaxed text-body">{project.testing}</p>
          </Block>
        )}

        <Block title="Results">
          <Bullets items={project.results} />
        </Block>

        <Block title="What I learned">
          <Bullets items={project.lessons} />
        </Block>

        {project.role && (
          <Block title="My role">
            <p className="leading-relaxed text-body">{project.role}</p>
          </Block>
        )}

        <nav
          data-print-hide
          aria-label="Project navigation"
          className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8"
        >
          <Link
            href="/#projects"
            className="tap font-mono text-xs text-muted transition-colors hover:text-accent"
          >
            ← All projects
          </Link>
          <Link
            href={`/projects/${next.slug}`}
            className="tap text-right font-mono text-xs text-muted transition-colors hover:text-accent"
          >
            Next: {next.title} →
          </Link>
        </nav>
      </main>

      <Footer />
    </div>
  )
}
