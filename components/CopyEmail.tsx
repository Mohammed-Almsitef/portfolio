'use client'

import { t, type Locale } from '@/lib/locale'
import { useCopyToClipboard } from '@/lib/hooks'
import Icon from './Icon'

export default function CopyEmail({ email, locale = 'en' }: { email: string; locale?: Locale }) {
  const { copied, copy } = useCopyToClipboard()

  return (
    <span className="flex max-w-full items-center gap-2">
      <a
        href={`mailto:${email}`}
        className="btn-primary inline-flex min-w-0 items-center gap-2 rounded-xl px-3.5 py-3 text-[0.8125rem] font-medium sm:gap-2.5 sm:px-5 sm:text-sm"
      >
        {/* The address is the label, so the mark is decoration — and the first
            thing to go on a narrow screen, where dropping it is what keeps the
            address and the copy button on one line. */}
        <Icon name="mail" className="hidden size-4 shrink-0 sm:block" />
        {/* Latin address inside an RTL line: without an explicit direction the
            punctuation drifts to the wrong end. */}
        <span dir="ltr" className="truncate">{email}</span>
      </a>
      <button
        type="button"
        onClick={() => copy(email)}
        className="btn-ghost shrink-0 rounded-xl px-3 py-3 text-xs text-muted hover:text-text sm:px-3.5"
      >
        {copied ? `${t(locale, 'copied')} ✓` : t(locale, 'copy')}
      </button>
    </span>
  )
}
