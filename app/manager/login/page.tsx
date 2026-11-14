import Link from 'next/link'
import { redirect } from 'next/navigation'

import { gateStatus, isSignedIn } from '@/lib/manager/auth'
import { storeConfigured } from '@/lib/manager/store'
import Logo from '@/components/Logo'
import { Message } from '../ui'
import LoginForm from './LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>
}) {
  const { from, error } = await searchParams

  if (await isSignedIn()) redirect(from || '/manager')

  const status = await gateStatus()

  // With no password in force there is nothing to ask for, so send them
  // straight through rather than showing a prompt that accepts anything.
  if (status.protection === 'open') redirect(from || '/manager')

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo id="login-logo" weight="regular" className="h-12 w-auto" label="Mohammed Almsitef" />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">Sign in to the manager</h1>
          <p className="mt-2 text-sm text-muted">This area edits the live site.</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-7">
      <LoginForm from={from || '/manager'} storeError={error === 'store'} />

      {/* Only true when a store exists to save a new password into; without
          one the password lives in Vercel and is changed there. */}
      {status.protection === 'required' && status.source === 'env' && storeConfigured() && (
        <div className="mt-5">
          <Message tone="ok">
            Using the bootstrap password from the environment. Set a permanent one from{' '}
            <strong>Account</strong> once you are in.
          </Message>
        </div>
      )}

        </div>
        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/" className="tap-inline hover:text-text">
            ← Back to the site
          </Link>
        </p>
      </div>
    </main>
  )
}
