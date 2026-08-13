'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { attemptLogin, changePassword, endSession, removePassword } from '@/lib/manager/auth'

export type FormState = { error?: string; notice?: string } | undefined

/**
 * Client address, used only to scope login rate limiting.
 *
 * x-forwarded-for is set by Vercel's edge and can be spoofed when the app is
 * run without a proxy in front of it — that only lets an attacker fragment
 * their own rate-limit bucket, so it never grants access.
 */
async function clientIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
}

/** Only same-origin manager paths, so `?from=` can't bounce you off-site. */
function safeRedirect(target: FormDataEntryValue | null): string {
  const value = typeof target === 'string' ? target : ''
  return value.startsWith('/') && !value.startsWith('//') ? value : '/keystatic'
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get('password') ?? '')
  const destination = safeRedirect(formData.get('from'))

  if (!password) return { error: 'Enter your password.' }

  const result = await attemptLogin(password, await clientIp())

  if (!result.ok) {
    const suffix =
      result.remaining !== undefined && result.remaining > 0 && result.remaining <= 3
        ? ` ${result.remaining} attempt${result.remaining === 1 ? '' : 's'} left.`
        : ''
    return { error: result.error + suffix }
  }

  redirect(destination)
}

export async function signOutAction(): Promise<void> {
  await endSession()
  redirect('/manager/login')
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const current = String(formData.get('current') ?? '')
  const next = String(formData.get('next') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (next !== confirm) return { error: 'The new passwords do not match.' }

  const result = await changePassword(current, next)
  if (!result.ok) return { error: result.error }

  return { notice: 'Password updated. Use the new one next time you sign in.' }
}

export async function removePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const current = String(formData.get('current') ?? '')

  if (String(formData.get('confirm') ?? '') !== 'REMOVE') {
    return { error: 'The confirmation did not match, so nothing was changed.' }
  }

  const result = await removePassword(current)
  if (!result.ok) return { error: result.error }

  return { notice: 'Password protection removed. Anyone with the link can now open the manager.' }
}
