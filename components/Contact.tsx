import { getContact, getSite, getSocials } from '@/lib/content'
import CopyEmail from './CopyEmail'
import Section from './Section'
import SocialIcon from './SocialIcon'
import Spotlight from './Spotlight'
import { t, type Locale } from '@/lib/locale'

/**
 * The eyebrow over each block, so the section reads as a record, not a list.
 *
 * Latin gets the mono, uppercased, letter-spaced treatment. Arabic gets none of
 * it: the mono face carries no Arabic, so the text falls back glyph by glyph and
 * loses its joins — and globals.css flips anything `.font-mono` to LTR, which
 * reverses an Arabic label outright. Case and letter-spacing are Latin devices
 * too, so the Arabic side keeps only the size and the colour.
 */
function eyebrow(locale: Locale) {
  return locale === 'ar'
    ? 'text-xs text-muted'
    : 'font-mono text-[0.6875rem] uppercase tracking-wider text-muted'
}

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

  const label = eyebrow(locale)

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
            <h3 className={label}>{t(locale, 'emailMe')}</h3>
            <div className="mt-3">
              <CopyEmail email={site.email} locale={locale} />
            </div>
          </div>
        </div>

        {/* Same card language as the link tiles below — rounded to the same
            radius, washed in the accent instead of a platform tone. */}
        <dl className="space-y-6 self-start rounded-2xl border border-border bg-surface bg-[linear-gradient(135deg,rgb(var(--accent-tone)/0.07),transparent_62%)] p-6 shadow-[var(--card-shadow)]">
          <div>
            <dt className={`flex items-center gap-2 ${label}`}>
              <Glyph d="M12 21.5s7-5.8 7-11a7 7 0 1 0-14 0c0 5.2 7 11 7 11Z M12 12.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
              {t(locale, 'basedIn')}
            </dt>
            <dd className="mt-1.5 text-sm">{site.location}</dd>
          </div>
          {contact.responseTime && (
            <div>
              <dt className={`flex items-center gap-2 ${label}`}>
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
          <h3 className={label}>{t(locale, 'findMeOn')}</h3>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {socials.map((s) => {
              // Only a link that leaves the browser gets a new tab; a mailto:
              // handed to _blank leaves an empty one behind.
              const external = /^https?:/i.test(s.href)

              return (
                <li key={s.href}>
                  <Spotlight
                    style={
                      {
                        '--tone': `var(--tone-${s.tone})`,
                        // Spotlight reads --card-glow; re-point it at this
                        // platform's tone, the same way a project card does.
                        '--card-glow': 'rgb(var(--tone) / 0.16)',
                      } as React.CSSProperties
                    }
                    // The tone wash is a background *image* layered over
                    // bg-surface's colour, so it needs no element of its own and
                    // still sits under Spotlight's hover glow.
                    className="group h-full rounded-2xl border border-border bg-surface bg-[linear-gradient(135deg,rgb(var(--tone)/0.07),transparent_62%)] shadow-[var(--card-shadow)] transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-[rgb(var(--tone)/0.45)]"
                  >
                    <a
                      href={s.href}
                      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : undefined)}
                      className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5"
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[rgb(var(--tone)/0.28)] bg-[rgb(var(--tone)/0.12)] text-[rgb(var(--tone))] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] transition-transform duration-300 group-hover:scale-105">
                        <SocialIcon platform={s.platform} className="size-[1.1875rem]" />
                      </span>

                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-snug tracking-tight">
                          {s.label}
                        </span>
                        {s.handle && (
                          <span
                            dir="ltr"
                            className="mt-0.5 block truncate font-mono text-xs text-muted transition-colors group-hover:text-[rgb(var(--tone))]"
                          >
                            {s.handle}
                          </span>
                        )}
                      </span>

                      {/* Rises rather than slides: a horizontal nudge would have
                          to be mirrored on the Arabic side. */}
                      <span
                        aria-hidden="true"
                        className="ms-auto shrink-0 font-mono text-xs text-muted opacity-60 transition-[transform,color,opacity] duration-300 group-hover:-translate-y-0.5 group-hover:text-[rgb(var(--tone))] group-hover:opacity-100"
                      >
                        {external ? '↗' : '→'}
                      </span>
                    </a>
                  </Spotlight>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Section>
  )
}
