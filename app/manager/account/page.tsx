import Link from 'next/link'
import { redirect } from 'next/navigation'

import { gateStatus, isSignedIn } from '@/lib/manager/auth'
import { storeConfigured } from '@/lib/manager/store'
import { signOutAction } from '../actions'
import { Card, Message } from '../ui'
import { ChangePasswordForm, RemovePasswordForm } from './AccountForms'

export default async function AccountPage() {
  const status = await gateStatus()

  // This page sits outside the proxy's matcher, so it does its own check
  // rather than assuming the gate ran.
  if (status.protection === 'required' && !(await isSignedIn())) {
    redirect('/manager/login?from=/manager/account')
  }

  const hasStore = storeConfigured()
  const protectionOn = status.protection === 'required'

  return (
    <div className="space-y-5">
      <Card
        title="Manager account"
        description="Controls the password on /keystatic. Content itself is edited in the manager."
      >
        <div className="space-y-5">
          {!hasStore && (
            <Message tone="error">
              No password store is configured, so the manager is open and the password cannot be
              changed here. Add a Redis store and set its variables to enable this.
            </Message>
          )}

          {hasStore && !protectionOn && (
            <Message tone="error">
              The manager currently has <strong>no password</strong>. Set one below.
            </Message>
          )}

          {protectionOn && status.source === 'env' && (
            <Message tone="ok">
              Signing in with the bootstrap password from the environment. Saving a password below
              replaces it, after which you can delete <code>MANAGER_PASSWORD</code>.
            </Message>
          )}

          <ChangePasswordForm needsCurrent={protectionOn} />
        </div>
      </Card>

      {hasStore && protectionOn && (
        <Card title="Danger zone">
          <RemovePasswordForm needsCurrent={protectionOn} />
        </Card>
      )}

      <div className="flex items-center justify-between text-sm">
        <Link href="/keystatic" className="tap-inline underline underline-offset-4 hover:text-text">
          ← Back to the manager
        </Link>
        <form action={signOutAction}>
          <button type="submit" className="tap-inline underline underline-offset-4 hover:text-text">
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
