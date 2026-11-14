'use client'

import { useState } from 'react'

type Labels = {
  title: string
  name: string
  email: string
  message: string
  send: string
  sending: string
  sent: string
  error: string
}

const FIELD =
  'w-full rounded-xl border border-border bg-bg/50 px-4 py-3 text-sm text-text placeholder:text-muted transition-colors focus:border-accent focus:outline-none'

/**
 * A short contact form delivered by Formspree. Rendered only when a form ID
 * is set in the manager. A hidden "_gotcha" field catches bots; on any
 * failure the visitor is pointed at the email address instead.
 */
export default function ContactForm({
  formId,
  email,
  labels,
}: {
  formId: string
  email: string
  labels: Labels
}) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setState('sending')
    try {
      const res = await fetch(`https://formspree.io/f/${formId}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(e.currentTarget),
      })
      setState(res.ok ? 'sent' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <p role="status" className="glass rounded-2xl p-6 text-sm leading-relaxed text-body">
        {labels.sent}
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="glass space-y-4 rounded-2xl p-6" aria-label={labels.title}>
      <p className="font-semibold tracking-tight">{labels.title}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="sr-only">{labels.name}</span>
          <input name="name" required autoComplete="name" placeholder={labels.name} className={FIELD} />
        </label>
        <label className="block">
          <span className="sr-only">{labels.email}</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={labels.email}
            className={FIELD}
          />
        </label>
      </div>
      <label className="block">
        <span className="sr-only">{labels.message}</span>
        <textarea
          name="message"
          required
          minLength={10}
          rows={5}
          placeholder={labels.message}
          className={`${FIELD} resize-y`}
        />
      </label>
      {/* Bots fill every field; people never see this one. */}
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={state === 'sending'}
          className="btn-primary rounded-xl px-6 py-3 text-sm font-semibold disabled:opacity-60"
        >
          {state === 'sending' ? labels.sending : labels.send}
        </button>
        {state === 'error' && (
          <p role="alert" className="text-sm text-[rgb(var(--tone-rose))]">
            {labels.error}{' '}
            <a href={`mailto:${email}`} className="underline underline-offset-4">
              {email}
            </a>
          </p>
        )}
      </div>
    </form>
  )
}
