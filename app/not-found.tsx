import Link from 'next/link'
import Aurora from '@/components/Aurora'
import Logo from '@/components/Logo'
import { t } from '@/lib/locale'

/**
 * A branded 404 instead of the framework default, with the two ways back a
 * lost visitor usually wants.
 */
export default function NotFound() {
  return (
    <>
      <Aurora />
      <main id="main" className="mx-auto flex min-h-svh max-w-2xl flex-col items-start justify-center px-6">
        <Link href="/" aria-label="Home" className="mb-10">
          <Logo id="nf-logo" weight="medium" className="h-10 w-auto" />
        </Link>
        <p className="font-mono text-sm text-accent">{t('en', 'nfKicker')}</p>
        <h1 className="text-gradient mt-3 text-[clamp(2.25rem,6vw,3.75rem)] font-semibold leading-tight tracking-[-0.035em]">
          {t('en', 'nfTitle')}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-body">
          {t('en', 'nfBody')}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn-primary rounded-xl px-6 py-3 text-sm font-semibold">
            {t('en', 'nfHome')}
          </Link>
          <Link href="/#projects" className="btn-ghost rounded-xl px-6 py-3 text-sm font-medium">
            {t('en', 'nfProjects')}
          </Link>
        </div>
      </main>
    </>
  )
}
