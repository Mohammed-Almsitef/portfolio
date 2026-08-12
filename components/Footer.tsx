import { site } from '@/data/content'
import SectionRule from './SectionRule'

/**
 * Identity and copyright only. Role, location and the social links each have a
 * single home elsewhere on the page, so the footer does not restate them.
 */
export default function Footer() {
  return (
    <footer data-print-hide>
      <SectionRule />

      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-10">
        <p className="font-mono text-sm">{site.name}</p>
        <p className="font-mono text-xs text-muted">
          © {new Date().getFullYear()} · Built with Next.js
        </p>
      </div>
    </footer>
  )
}
