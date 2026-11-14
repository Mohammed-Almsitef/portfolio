/**
 * Small shared pieces for the manager screens.
 *
 * Deliberately plain: these are utility pages, so they borrow the site's
 * colour tokens but none of its motion or ornament.
 */

export function Card({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <h2 className="text-lg font-semibold tracking-tight text-text">{title}</h2>
      {description && <p className="mt-2 text-sm leading-relaxed text-body">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  )
}

export function Field({
  label,
  name,
  type = 'password',
  autoComplete,
  autoFocus,
  placeholder,
}: {
  label: string
  name: string
  type?: string
  autoComplete?: string
  autoFocus?: boolean
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-text">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border-strong bg-bg px-3 py-2.5 text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
      />
    </label>
  )
}

/**
 * The submit button for every manager form.
 *
 * `destructive` exists so the "remove password" button is a variant rather
 * than a fork: it had copied the whole button — the pending ternary included —
 * only to change the colours.
 */
export function Submit({
  pending,
  destructive = false,
  children,
}: {
  pending: boolean
  destructive?: boolean
  children: React.ReactNode
}) {
  const tone = destructive
    ? 'border border-rose-500/60 bg-rose-500/10 text-sm text-text hover:bg-rose-500/20'
    : 'bg-accent text-white hover:bg-accent-alt'

  return (
    <button
      type="submit"
      disabled={pending}
      className={`tap w-full rounded-lg px-4 py-2.5 font-medium transition disabled:opacity-60 ${tone}`}
    >
      {pending ? 'Working…' : children}
    </button>
  )
}

/** The error / success pair every form ends with. */
export function FormResult({ state }: { state?: { error?: string; notice?: string } }) {
  return (
    <>
      {state?.error && <Message tone="error">{state.error}</Message>}
      {state?.notice && <Message tone="ok">{state.notice}</Message>}
    </>
  )
}

/**
 * The theme switches on `[data-theme]`, which Tailwind's `dark:` variant does
 * not track — so the tone lives in the border and background tint while the
 * text stays on the theme's own colour. That reads correctly in both palettes
 * instead of guessing at a fixed shade.
 */
export function Message({ tone, children }: { tone: 'error' | 'ok'; children: React.ReactNode }) {
  const styles =
    tone === 'error'
      ? 'border-rose-500/50 bg-rose-500/10'
      : 'border-emerald-500/50 bg-emerald-500/10'

  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border px-3 py-2 text-sm text-text ${styles}`}
    >
      {children}
    </p>
  )
}
