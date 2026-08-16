import { getContact, getSite, getSocials } from '@/lib/content'
import CopyEmail from './CopyEmail'
import Section from './Section'
import { t, type Locale } from '@/lib/locale'

/**
 * The single home for how to reach me. Availability and focus areas are stated
 * once in the hero and deliberately not repeated here; this section carries the
 * contact record — the links, where I am, and how fast I answer.
 */
export default async function Contact({
  title,
  locale = 'en',
}: {
  title: string
  locale?: Locale
}) {
  const [site, socials, contact] = await Promise.all([
    getSite(locale),
    getSocials(locale),
    getContact(locale),
  ])

  return (
    <Section id="contact" title={title}>
      <div className="grid gap-12 md:grid-cols-[1.4fr_1fr] md:gap-16">
        <div>
          <p className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight tracking-tight">
            {contact.headline}
          </p>
          {contact.blurb && (
            <p className="mt-5 leading-relaxed text-body md:text-[1.0625rem]">{contact.blurb}</p>
          )}

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
              {t(locale, 'basedIn')}
            </dt>
            <dd className="mt-1.5 text-sm">{site.location}</dd>
          </div>
          {contact.responseTime && (
            <div>
              <dt className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted">
                {t(locale, 'responseTime')}
              </dt>
              <dd className="mt-1.5 text-sm">{contact.responseTime}</dd>
            </div>
          )}
        </dl>
      </div>
    </Section>
  )
}
