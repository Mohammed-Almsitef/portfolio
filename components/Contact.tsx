import { getContact, getSite, getSocials } from '@/lib/content'
import CopyEmail from './CopyEmail'
import Section from './Section'
import SocialLink from './SocialLink'
import { t, type Locale } from '@/lib/locale'

/**
 * The eyebrow over each block, so the section reads as a record, not a list.
 *
 * `mono-label` is what keeps this readable in Arabic — see globals.css.
 */
const EYEBROW = 'mono-label font-mono text-[0.6875rem] uppercase tracking-wider text-muted'

/** A small outline mark beside a label in the detail card. */
function Glyph({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3.5 shrink-0 text-accent"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}

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
            <h3 className={EYEBROW}>{t(locale, 'emailMe')}</h3>
            <div className="mt-3">
              <CopyEmail email={site.email} locale={locale} />
            </div>
          </div>
        </div>

        {/* Same card language as the link tiles below — rounded to the same
            radius, washed in the accent instead of a platform tone. */}
        <dl className="space-y-6 self-start rounded-2xl border border-border bg-surface bg-[linear-gradient(135deg,rgb(var(--accent-tone)/0.07),transparent_62%)] p-6 shadow-[var(--card-shadow)]">
          <div>
            <dt className={`flex items-center gap-2 ${EYEBROW}`}>
              <Glyph d="M12 21.5s7-5.8 7-11a7 7 0 1 0-14 0c0 5.2 7 11 7 11Z M12 12.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
              {t(locale, 'basedIn')}
            </dt>
            <dd className="mt-1.5 text-sm">{site.location}</dd>
          </div>
          {contact.responseTime && (
            <div>
              <dt className={`flex items-center gap-2 ${EYEBROW}`}>
                <Glyph d="M12 3.75a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5Z M12 7.75V12l3 1.75" />
                {t(locale, 'responseTime')}
              </dt>
              <dd className="mt-1.5 text-sm">{contact.responseTime}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* The only place the social links appear. Full width rather than tucked
          under the headline: they are a grid of equals, and three across leaves
          no dead column beside the card. */}
      {socials.length > 0 && (
        <div className="mt-14">
          <h3 className={EYEBROW}>{t(locale, 'findMeOn')}</h3>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {socials.map((s) => (
              <li key={s.href}>
                <SocialLink social={s} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  )
}
