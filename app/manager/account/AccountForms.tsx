'use client'

import { useActionState } from 'react'

import { changePasswordAction, removePasswordAction, type FormState } from '../actions'
import { Field, Message, Submit } from '../ui'

export function ChangePasswordForm({ needsCurrent }: { needsCurrent: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    changePasswordAction,
    undefined,
  )

  return (
    <form action={action} className="space-y-4">
      {needsCurrent && (
        <Field label="Current password" name="current" autoComplete="current-password" />
      )}
      <Field label="New password" name="next" autoComplete="new-password" />
      <Field label="Confirm new password" name="confirm" autoComplete="new-password" />

      {state?.error && <Message tone="error">{state.error}</Message>}
      {state?.notice && <Message tone="ok">{state.notice}</Message>}

      <Submit pending={pending}>Save password</Submit>
    </form>
  )
}

/**
 * Kept behind a <details> rather than component state so the form exists in
 * the document either way — a destructive action shouldn't depend on a hook
 * having run, and it keeps the disclosure keyboard-accessible for free.
 */
export function RemovePasswordForm({ needsCurrent }: { needsCurrent: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    removePasswordAction,
    undefined,
  )

  return (
    <details className="group">
      <summary className="tap cursor-pointer list-none rounded-lg border border-border-strong px-4 py-2.5 text-sm font-medium text-text transition hover:border-rose-500/60 group-open:mb-4">
        Remove password protection…
      </summary>

      <form action={action} className="space-y-4">
        <Message tone="error">
          This leaves the manager open to anyone who knows the URL. Saving still needs a GitHub
          account with write access to the repo, but the editor itself becomes public.
        </Message>

        {needsCurrent && (
          <Field label="Current password" name="current" autoComplete="current-password" />
        )}
        <Field
          label="Type REMOVE to confirm"
          name="confirm"
          type="text"
          autoComplete="off"
          placeholder="REMOVE"
        />

        {state?.error && <Message tone="error">{state.error}</Message>}
        {state?.notice && <Message tone="ok">{state.notice}</Message>}

        <button
          type="submit"
          disabled={pending}
          className="tap w-full rounded-lg border border-rose-500/60 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-text transition hover:bg-rose-500/20 disabled:opacity-60"
        >
          {pending ? 'Working…' : 'Remove password'}
        </button>
      </form>
    </details>
  )
}
