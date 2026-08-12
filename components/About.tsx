import Image from 'next/image'
import { getAbout, getSite } from '@/lib/content'
import CountUp from './CountUp'
import Section from './Section'

export default async function About({ title, index }: { title: string; index: string }) {
  const [about, site] = await Promise.all([getAbout(), getSite()])

  return (
    <Section id="about" title={title} index={index}>
      <div className="grid gap-12 md:grid-cols-[1.55fr_1fr] md:gap-16">
        <div className="space-y-5">
          {about.paragraphs.map((p, i) => (
            <p key={i} className="leading-relaxed text-body md:text-[1.0625rem]">
              {p}
            </p>
          ))}
        </div>

        <div>
          {/* Intrinsic dimensions match the source file, so the frame takes the
              photo's own 2:3 ratio and nothing is cropped. */}
          <Image
            src={about.photo}
            alt={site.name}
            width={841}
            height={1264}
            sizes="(max-width: 768px) 65vw, 256px"
            className="w-full max-w-64 rounded-xl border border-border"
          />
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
