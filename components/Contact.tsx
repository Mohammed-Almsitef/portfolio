import { getAppearance, getContact, getSite, getSocials } from '@/lib/content'
import CopyEmail from './CopyEmail'
import Section from './Section'
import SocialLink from './SocialLink'
import { t, type Locale } from '@/lib/locale'
import { CARD_SURFACE, CARD_TONE_WASH, EYEBROW } from '@/lib/styles'
import Icon from './Icon'

/** The marks beside the labels in the detail card. */
const GLYPH = 'size-3.5 shrink-0 text-accent'

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
  const [site, socials, contact, appearance] = await Promise.all([
    getSite(locale),
    getSocials(locale),
    getContact(locale),
    getAppearance(),
  ])

  const iconsOnly = appearance.contactLinks === 'icons'

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
        <dl
          // The accent is this card's tone, so the shared wash can be reused
          // as-is rather than spelling the gradient out a second time.
          style={{ '--tone': 'var(--accent-tone)' } as React.CSSProperties}
          className={`space-y-6 self-start p-6 ${CARD_SURFACE} ${CARD_TONE_WASH}`}
        >
          <div>
            <dt className={`flex items-center gap-2 ${EYEBROW}`}>
              <Icon name="pin" className={GLYPH} />
              {t(locale, 'basedIn')}
            </dt>
            <dd className="mt-1.5 text-sm">{site.location}</dd>
          </div>
          {contact.responseTime && (
            <div>
              <dt className={`flex items-center gap-2 ${EYEBROW}`}>
                <Icon name="clock" className={GLYPH} />
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
      {/* A short row of marks reads as a cluster, so it is centred — and the
          label with it, since a left-aligned heading over centred icons only
          looks like a mistake. The cards keep to the left, where they line up
          with the headline and the rest of the column. */}
      {socials.length > 0 && (
        <div className={`mt-14 ${iconsOnly ? 'text-center' : ''}`}>
          <h3 className={EYEBROW}>{t(locale, 'findMeOn')}</h3>
          {/* Icons wrap in a row and are sized by their own content; cards need a
              grid to line up. */}
          <ul
            className={
              iconsOnly
                ? 'mt-4 flex flex-wrap justify-center gap-3'
                : 'mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3'
            }
          >
            {socials.map((s) => (
              <li key={s.href}>
                <SocialLink social={s} style={appearance.contactLinks} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  )
}
