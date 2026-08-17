import Link from 'next/link'
import { redirect } from 'next/navigation'

import { gateStatus, isSignedIn } from '@/lib/manager/auth'
import { storeConfigured } from '@/lib/manager/store'
import { signOutAction } from '../actions'
import { Card, Message } from '../ui'
import { ChangePasswordForm, RemovePasswordForm } from './AccountForms'

/**
 * Never prerendered.
 *
 * Without this the page is baked at build time, when there are no runtime
 * environment variables: the gate check below resolves once, against an
 * unconfigured store, and is then served to everyone as static HTML — so the
 * redirect never runs and the page reports whichever state the build machine
 * happened to see. It has to be rendered per request to say anything true.
 */
export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const status = await gateStatus()

  // Belt and braces: the proxy covers this path too, but a page that can show
  // whether protection is on should not depend on the matcher staying correct.
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
        {/* Four states, and the difference between them is what to do next. The
            no-store cases used to share one message that said the manager was
            open — which stopped being true once MANAGER_PASSWORD started being
            honoured on its own. */}
        <div className="space-y-5">
          {!hasStore && protectionOn && (
            <Message tone="ok">
              Protected by <code>MANAGER_PASSWORD</code> from the environment. There is no password
              store, so it cannot be changed here — edit that variable and redeploy. Add a Redis
              store if you would rather manage the password on this screen.
            </Message>
          )}

          {!hasStore && !protectionOn && (
            <Message tone="error">
              The manager has <strong>no password</strong>: anyone with the link can edit the site.
              Set <code>MANAGER_PASSWORD</code> in your hosting environment to close it now, or add
              a Redis store to set and change the password from here.
            </Message>
          )}

          {hasStore && !protectionOn && (
            <Message tone="error">
              The manager currently has <strong>no password</strong>. Set one below.
            </Message>
          )}

          {hasStore && protectionOn && status.source === 'env' && (
            <Message tone="ok">
              Signing in with the bootstrap password from the environment. Saving a password below
              replaces it, after which you can delete <code>MANAGER_PASSWORD</code>.
            </Message>
          )}

          {/* With no store there is nowhere to write a hash, so the form would
              only ever return an error. */}
          {hasStore && <ChangePasswordForm needsCurrent={protectionOn} />}
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
