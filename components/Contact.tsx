import { getContact, getSite, getSocials } from '@/lib/content'
import ContactForm from './ContactForm'
import CopyEmail from './CopyEmail'
import Section from './Section'
import SocialIcon from './SocialIcon'
import { outbound } from '@/lib/links'
import { t, type Locale } from '@/lib/locale'
import { CARD_SURFACE, EYEBROW } from '@/lib/styles'

/**
 * How to reach me, in the order a recruiter acts: the pitch, email (copyable),
 * the CV, then profiles as labelled links rather than a row of bare logos.
 * The facts beside it are the ones people filter on: where, when, how fast.
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

  const details = [
    { k: t(locale, 'basedIn'), v: site.location },
    contact.timezone && { k: t(locale, 'timezone'), v: contact.timezone },
    contact.responseTime && { k: t(locale, 'responseTime'), v: contact.responseTime },
  ].filter(Boolean) as { k: string; v: string }[]

  return (
    <Section id="contact" title={title}>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
        <div className="max-w-2xl">
          <p className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight tracking-tight">
            {contact.headline}
          </p>
          {contact.blurb && (
            <p className="mt-5 leading-relaxed text-body md:text-[1.0625rem]">{contact.blurb}</p>
          )}

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <CopyEmail email={site.email} locale={locale} />
            {site.resumeUrl && (
              <a
                href={site.resumeUrl}
                className="btn-ghost inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />
                </svg>
                {t(locale, 'downloadCv')}
              </a>
            )}
          </div>

          {socials.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {socials.map((s) => (
                <li key={s.href}>
                  <a
                    {...outbound(s.href)}
                    className="tap gap-2 text-sm font-medium text-body transition-colors hover:text-accent"
                  >
                    <SocialIcon platform={s.platform} className="size-4 text-muted" />
                    {s.label}
                    <span aria-hidden="true" className="text-muted">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-5 self-start">
          <dl className={`space-y-5 p-6 ${CARD_SURFACE}`}>
            {details.map((d) => (
              <div key={d.k}>
                <dt className={EYEBROW}>{d.k}</dt>
                <dd className="mt-1.5 text-sm font-medium">{d.v}</dd>
              </div>
            ))}
          </dl>
          {contact.formspreeId && (
            <ContactForm
              formId={contact.formspreeId}
              email={site.email}
              labels={{
                title: t(locale, 'formTitle'),
                name: t(locale, 'formName'),
                email: t(locale, 'formEmail'),
                message: t(locale, 'formMessage'),
                send: t(locale, 'formSend'),
                sending: t(locale, 'formSending'),
                sent: t(locale, 'formSent'),
                error: t(locale, 'formError'),
              }}
            />
          )}
        </div>
      </div>
    </Section>
  )
}
