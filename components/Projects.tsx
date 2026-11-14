import Image from 'next/image'
import Link from 'next/link'
import { getProjects, type Project } from '@/lib/content'
import { outbound } from '@/lib/links'
import { localePath, t, type Locale } from '@/lib/locale'
import ProjectClip from './ProjectClip'
import ProjectVisual from './ProjectVisual'
import Reveal from './Reveal'
import Section from './Section'
import Spotlight from './Spotlight'
import TagList from './TagList'
import { CARD_SURFACE } from '@/lib/styles'

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
      {...outbound(href)}
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

function Body({
  p,
  index,
  locale,
  lead = false,
}: {
  p: Project
  index: number
  locale: Locale
  lead?: boolean
}) {
  return (
    <div className={`flex flex-1 flex-col p-6 ${lead ? 'md:p-9' : 'md:p-7'}`}>
      <div className="flex items-center justify-between gap-4 font-mono text-xs">
        <span className="text-[rgb(var(--tone))]">
          {String(index + 1).padStart(2, '0')}
          {lead && (
            <span className="mono-label ms-3 rounded-full border border-[rgb(var(--tone)/0.35)] px-2 py-0.5 uppercase tracking-wider">
              {t(locale, 'featured')}
            </span>
          )}
        </span>
        <span className="shrink-0 text-muted">{p.year}</span>
      </div>

      <h3
        className={`mt-4 font-semibold tracking-[-0.02em] ${lead ? 'text-2xl md:text-[2rem] md:leading-tight' : 'text-xl'}`}
      >
        {/* The title is the card's link, stretched over the whole card by its
            own ::after. One link with real text beats an unlabelled overlay. */}
        <Link
          href={localePath(locale, `/projects/${p.slug}`)}
          className="after:absolute after:inset-0 after:content-['']"
        >
          {p.title}
        </Link>
      </h3>

      <p className={`mt-4 flex-1 leading-relaxed text-body ${lead ? 'md:text-[1.0625rem]' : ''}`}>
        {p.summary}
      </p>

      <TagList tags={lead ? p.tags : p.tags.slice(0, 6)} locale={locale} className="mt-6" litByCardHover />

      <div className="relative mt-6 flex flex-wrap items-center gap-5 border-t border-border pt-5">
        <span className="mono-label pointer-events-none inline-flex items-center gap-1.5 font-mono text-xs text-[rgb(var(--tone))]">
          {t(locale, 'caseStudy')}
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-200 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
          >
            →
          </span>
        </span>
        {/* `relative` lifts these clear of the title's stretched ::after. */}
        {p.repoUrl && <ProjectLink href={p.repoUrl}>{t(locale, 'source')}</ProjectLink>}
        {p.videoUrl && <ProjectLink href={p.videoUrl}>{t(locale, 'video')}</ProjectLink>}
      </div>
    </div>
  )
}

function Card({
  p,
  i,
  locale,
  lead = false,
}: {
  p: Project
  i: number
  locale: Locale
  lead?: boolean
}) {
  return (
    <Spotlight
      style={
        {
          '--tone': `var(--tone-${p.tone})`,
          // Spotlight already reads --card-glow; re-point it rather than
          // teaching the component about tones.
          '--card-glow': 'rgb(var(--tone) / 0.16)',
        } as React.CSSProperties
      }
      className={`ticks group h-full overflow-hidden ${CARD_SURFACE} transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-[rgb(var(--tone)/0.45)]`}
      innerClassName={`flex h-full flex-col ${lead ? 'md:flex-row' : ''}`}
    >
      <Cover
        p={p}
        className={lead ? 'h-56 shrink-0 md:h-auto md:w-[46%]' : 'h-44 shrink-0'}
      />
      <Body p={p} index={i} locale={locale} lead={lead} />
    </Spotlight>
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
  const [lead, ...rest] = projects

  return (
    <Section id="projects" title={title} tone="raised">
      {lead && (
        <Reveal className="mb-5">
          <Card p={lead} i={0} locale={locale} lead />
        </Reveal>
      )}
      <ul className="grid gap-5 md:grid-cols-2">
        {rest.map((p, i) => (
          <li key={p.slug}>
            {/* Staggered so the grid assembles rather than appearing at once. */}
            <Reveal delay={Math.min(i, 3) * 70} className="h-full">
              <Card p={p} i={i + 1} locale={locale} />
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  )
}
