'use client'

import { t, type Locale } from '@/lib/locale'
import { useCopyToClipboard } from '@/lib/hooks'
import Icon from './Icon'

export default function CopyEmail({ email, locale = 'en' }: { email: string; locale?: Locale }) {
  const { copied, copy } = useCopyToClipboard()

  return (
    <span className="flex flex-wrap items-center gap-2">
      <a
        href={`mailto:${email}`}
        className="btn-primary inline-flex min-w-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium sm:gap-2.5 sm:px-5"
      >
        {/* The address is the label, so the mark is decoration — and the first
            thing to go on a narrow screen, where dropping it is what keeps the
            address and the copy button on one line. */}
        <Icon name="mail" className="hidden size-4 shrink-0 sm:block" />
        {/* Latin address inside an RTL line: without an explicit direction the
            punctuation drifts to the wrong end. */}
        <span dir="ltr">{email}</span>
      </a>
      <button
        type="button"
        onClick={() => copy(email)}
        className="btn-ghost rounded-xl px-3.5 py-3 font-mono text-xs text-muted hover:text-text"
      >
        {copied ? `${t(locale, 'copied')} ✓` : t(locale, 'copy')}
      </button>
    </span>
  )
}
