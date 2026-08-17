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
      {/* Stacked on a phone and side by side from lg. The photo is first in the
          DOM either way, so the column order needs no `order-*`: on a narrow
          screen it simply reads as a portrait above the bio. */}
      <div className="flex w-full flex-col items-center gap-8 lg:flex-row lg:gap-20">
        {/* Set in the manager under About. Hidden entirely if none is set,
            rather than leaving a broken image or a reserved gap. */}
        {about.photo && (
          <div className="shrink-0 lg:p-6">
            <Image
              src={about.photo}
              alt={site.name}
              // The real pixel size of the source, so the box reserved during
              // load has the photo's own aspect ratio and nothing shifts.
              width={1024}
              height={1137}
              className="h-auto w-44 rounded-2xl object-cover sm:w-56 lg:w-100"
            />
          </div>
        )}
        {/* `items center` was two dead classes, and the grid-cols track list
            never applied to a flex container. */}
        <div className="flex w-full flex-col gap-12 md:max-w-2xl md:gap-16">
          {about.paragraphs.map((p, i) => (
            <p key={i} className="leading-relaxed text-body md:text-justify md:text-[1.0625rem]">
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
              <dt className="mono-label mt-2 font-mono text-[0.6875rem] uppercase tracking-wider text-muted">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>
      )}
    </Section>
  )
}
