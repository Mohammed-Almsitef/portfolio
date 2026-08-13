import Link from 'next/link'
import { redirect } from 'next/navigation'

import { gateStatus, isSignedIn } from '@/lib/manager/auth'
import { Card, Message } from '../ui'
import LoginForm from './LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>
}) {
  const { from, error } = await searchParams

  if (await isSignedIn()) redirect(from || '/keystatic')

  const status = await gateStatus()

  // With no password in force there is nothing to ask for, so send them
  // straight through rather than showing a prompt that accepts anything.
  if (status.protection === 'open') redirect(from || '/keystatic')

  return (
    <Card title="Manager sign in" description="This area edits the live site. Sign in to continue.">
      <LoginForm from={from || '/keystatic'} storeError={error === 'store'} />

      {status.protection === 'required' && status.source === 'env' && (
        <div className="mt-5">
          <Message tone="ok">
            Using the bootstrap password from the environment. Set a permanent one from{' '}
            <strong>Account</strong> once you are in.
          </Message>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/" className="tap-inline underline underline-offset-4 hover:text-text">
          Back to the site
        </Link>
      </p>
    </Card>
  )
}
