import { getSite, getSocials } from '@/lib/content'
import CopyEmail from './CopyEmail'
import Section from './Section'
import type { Locale } from '@/lib/locale'

/**
 * The single home for how to reach me. Availability and focus areas are stated
 * once in the hero and deliberately not repeated here; this section carries the
 * contact record — the links, where I am, and how fast I answer.
 */
export default async function Contact({
  title,
  index,
  locale = 'en',
}: {
  title: string
  index: string
  locale?: Locale
}) {
  const [site, socials] = await Promise.all([getSite(locale), getSocials(locale)])

  return (
    <Section id="contact" title={title} index={index}>
      <div className="grid gap-12 md:grid-cols-[1.4fr_1fr] md:gap-16">
        <div>
          <p className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight tracking-tight">
            Let's work together.
          </p>
          <p className="mt-5 leading-relaxed text-body md:text-[1.0625rem]">
            I'm open to full-time roles, contract work, and interesting collaborations
            especially anything involving autonomy in the real world. Email is the fastest way to
            reach me.
          </p>

          <div className="mt-9">
            <CopyEmail email={site.email} />
          </div>

          {/* The only place the social links appear. */}
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap font-mono text-sm text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
                >
                  {s.label} <span aria-hidden="true"></span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <dl className="space-y-6 self-start rounded-xl border border-border bg-surface p-6">
          <div>
            <dt className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted">
              Based in
            </dt>
            <dd className="mt-1.5 text-sm">{site.location}</dd>
          </div>
          <div>
            <dt className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted">
              Response time
            </dt>
            <dd className="mt-1.5 text-sm">Within a couple of days</dd>
          </div>
        </dl>
      </div>
    </Section>
  )
}
