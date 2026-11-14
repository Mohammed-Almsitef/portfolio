import { getAbout, getContact, getSite } from '@/lib/content'
import AboutPhoto from './AboutPhoto'
import Section from './Section'
import { t, type Locale } from '@/lib/locale'
import { CARD_SURFACE, EYEBROW } from '@/lib/styles'

export default async function About({
  title,
  locale = 'en',
}: {
  title: string
  locale?: Locale
}) {
  const [about, site, contact] = await Promise.all([getAbout(locale), getSite(locale), getContact(locale)])

  // Only facts that appear nowhere else on the page: role, education and
  // figures already have their own homes.
  const facts = [
    { k: t(locale, 'factLocation'), v: site.location },
    contact.timezone && { k: t(locale, 'timezone'), v: contact.timezone },
    about.languages && { k: t(locale, 'languages'), v: about.languages },
  ].filter(Boolean) as { k: string; v: string }[]

  return (
    <Section id="about" title={title}>
      <div className="grid items-start gap-12 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-16">
        {/* Set in the manager under About. Hidden entirely if none is set. */}
        {about.photo && (
          <div className="mx-auto lg:mx-0">
            <AboutPhoto
              src={about.photo}
              alt={site.name}
              backdrop={about.photoBackdrop}
              onPhones={about.photoOnPhones}
            />
          </div>
        )}

        <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-12">
          <div className="max-w-2xl space-y-5">
            {about.paragraphs.map((p, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? 'text-lg leading-relaxed text-text md:text-xl md:leading-relaxed'
                    : 'leading-relaxed text-body md:text-[1.0625rem]'
                }
              >
                {p}
              </p>
            ))}
          </div>

          {facts.length > 0 && (
            <aside className={`self-start p-6 ${CARD_SURFACE}`}>
              <h3 className={EYEBROW}>{t(locale, 'quickFacts')}</h3>
              <dl className="mt-5 space-y-4">
                {facts.map((f) => (
                  <div key={f.k}>
                    <dt className="text-xs text-muted">{f.k}</dt>
                    <dd className="mt-0.5 text-sm font-medium leading-snug">{f.v}</dd>
                  </div>
                ))}
              </dl>
              {site.resumeUrl && (
                <a
                  href={site.resumeUrl}
                  className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-border-strong px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
                >
                  {t(locale, 'downloadCv')}
                </a>
              )}
            </aside>
          )}
        </div>
      </div>
    </Section>
  )
}
