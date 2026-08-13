'use client'

import { useActionState } from 'react'

import { loginAction, type FormState } from '../actions'
import { Field, Message, Submit } from '../ui'

export default function LoginForm({ from, storeError }: { from: string; storeError: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, undefined)

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="from" value={from} />

      <Field label="Password" name="password" autoComplete="current-password" autoFocus />

      {storeError && !state?.error && (
        <Message tone="error">
          The password store is unavailable, so sign-in is closed until it responds.
        </Message>
      )}
      {state?.error && <Message tone="error">{state.error}</Message>}

      <Submit pending={pending}>Sign in</Submit>
    </form>
  )
}
