import Image from 'next/image'
import { getAbout, getSite } from '@/lib/content'
import CountUp from './CountUp'
import Section from './Section'
import type { Locale } from '@/lib/locale'
import imgProfile from '@/public/profile.png'

export default async function About({
  title,
  index,
  locale = 'en',
}: {
  title: string
  index: string
  locale?: Locale
}) {
  const [about, site] = await Promise.all([getAbout(locale), getSite(locale)])

  return (
    <Section id="about" title={title} index={index}>
      <div className='flex gap-20 w-full items-center'>
        <div className='hidden lg:inline p-6'>
          <Image
            src={imgProfile}
            alt={site.name}
            className="w-100"
          />
        </div>
        <div className="md:max-w-2xl flex flex-col w-full items center gap-12 md:grid-cols-[1.55fr_1fr] md:gap-16">
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
