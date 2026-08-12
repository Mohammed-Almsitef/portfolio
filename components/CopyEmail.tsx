'use client'

import { useEffect, useState } from 'react'

export default function CopyEmail({ email }: { email: string }) {
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
    <span className="inline-flex flex-wrap items-center gap-2">
      <a
        href={`mailto:${email}`}
        className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
      >
        {email}
      </a>
      <button
        type="button"
        onClick={copy}
        className="rounded-md border border-border px-3 py-2.5 font-mono text-xs text-muted transition-colors hover:border-muted hover:text-text"
      >
        {copied ? 'copied ✓' : 'copy'}
      </button>
    </span>
  )
}
