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
        className="inline-flex min-w-0 items-center gap-2 rounded-md bg-accent px-4 py-2.5 sm:gap-2.5 sm:px-5 text-sm font-medium text-bg shadow-[0_6px_20px_-10px_var(--btn-glow)] transition-opacity hover:opacity-90"
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
        className="rounded-md border border-border px-3 py-2.5 font-mono text-xs text-muted transition-colors hover:border-muted hover:text-text"
      >
        {copied ? `${t(locale, 'copied')} ✓` : t(locale, 'copy')}
      </button>
    </span>
  )
}
