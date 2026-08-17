'use client'

import { useEffect, useState } from 'react'
import { t, type Locale } from '@/lib/locale'

export default function CopyEmail({ email, locale = 'en' }: { email: string; locale?: Locale }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 1800)
    return () => clearTimeout(id)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
    } catch {
      // clipboard blocked (insecure context or denied permission) — the
      // adjacent mailto link is still the primary path
    }
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <a
        href={`mailto:${email}`}
        className="inline-flex min-w-0 items-center gap-2 rounded-md bg-accent px-4 py-2.5 sm:gap-2.5 sm:px-5 text-sm font-medium text-bg shadow-[0_6px_20px_-10px_var(--btn-glow)] transition-opacity hover:opacity-90"
      >
        {/* The address is the label, so the mark is decoration — and the first
            thing to go on a narrow screen, where dropping it is what keeps the
            address and the copy button on one line. */}
        <svg
          viewBox="0 0 24 24"
          className="hidden size-4 shrink-0 sm:block"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3.75 5.25h16.5A1.5 1.5 0 0 1 21.75 6.75v10.5a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6.75a1.5 1.5 0 0 1 1.5-1.5ZM2.6 6.1 12 12.9l9.4-6.8" />
        </svg>
        {/* Latin address inside an RTL line: without an explicit direction the
            punctuation drifts to the wrong end. */}
        <span dir="ltr">{email}</span>
      </a>
      <button
        type="button"
        onClick={copy}
        className="rounded-md border border-border px-3 py-2.5 font-mono text-xs text-muted transition-colors hover:border-muted hover:text-text"
      >
        {copied ? `${t(locale, 'copied')} ✓` : t(locale, 'copy')}
      </button>
    </span>
  )
}
