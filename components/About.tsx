import Image from 'next/image'
import { getAbout, getSite } from '@/lib/content'
import CountUp from './CountUp'
import Section from './Section'
import type { Locale } from '@/lib/locale'

export default async function About({
  title,
  locale = 'en',
}: {
  title: string
  locale?: Locale
}) {
  const [about, site] = await Promise.all([getAbout(locale), getSite(locale)])

  return (
    <Section id="about" title={title}>
      <div className="flex w-full items-center gap-20">
        {/* Set in the manager under About. Hidden entirely if none is set,
            rather than leaving a broken image or a reserved gap. */}
        {about.photo && (
          <div className="hidden shrink-0 p-6 lg:block">
            <Image
              src={about.photo}
              alt={site.name}
              width={400}
              height={400}
              className="h-auto w-100 rounded-2xl object-cover"
            />
          </div>
        )}
        {/* `items center` was two dead classes, and the grid-cols track list
            never applied to a flex container. */}
        <div className="flex w-full flex-col gap-12 md:max-w-2xl md:gap-16">
          {about.paragraphs.map((p, i) => (
            <p key={i} className="leading-relaxed text-body md:text-[1.0625rem] text-justify">
              {p}
            </p>
          ))}
        </div>
      </div>

      {about.stats.length > 0 && (
        <dl className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          {about.stats.map((s) => (
            <div key={s.label} className="bg-bg p-6">
              <dd className="text-3xl font-semibold tracking-tight tabular-nums md:text-4xl">
                <CountUp value={s.value} />
              </dd>
              <dt className="mt-2 font-mono text-[0.6875rem] uppercase tracking-wider text-muted">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>
      )}
    </Section>
  )
}
