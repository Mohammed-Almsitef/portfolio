/**
 * A case-study flow diagram: stages in order, joined by arrows. A row on wide
 * screens, a column on phones, mirrored for Arabic. Plain HTML rather than an
 * image, so it stays sharp, themeable, translatable and readable by screen
 * readers as an ordered list.
 */
export default function FlowDiagram({
  title,
  stages,
  note,
}: {
  title: string
  stages: { label: string; detail: string[] }[]
  note?: string
}) {
  return (
    <figure className="glass not-prose my-8 rounded-2xl p-5 md:p-7">
      <figcaption className="mb-5 text-sm font-semibold text-text">
        <span className="mono-label">{title}</span>
      </figcaption>
      <ol className="flex flex-col items-stretch gap-0 lg:flex-row">
        {stages.map((st, i) => (
          <li key={i} className="flex flex-col items-stretch lg:min-w-0 lg:flex-1 lg:flex-row">
            <div className="rounded-xl border border-[rgb(var(--tone)/0.35)] bg-[rgb(var(--tone)/0.06)] p-4 lg:flex-1">
              <p className="flex items-baseline gap-2 font-semibold tracking-tight">
                <span className="font-mono text-xs text-[rgb(var(--tone))]">{i + 1}</span>
                {st.label}
              </p>
              {st.detail.length > 0 && (
                <ul className="mt-2 space-y-1 text-[0.8125rem] leading-snug text-muted">
                  {st.detail.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
            {i < stages.length - 1 && (
              <span
                aria-hidden="true"
                className="flex shrink-0 items-center justify-center py-1.5 text-[rgb(var(--tone))] lg:px-1.5 lg:py-0"
              >
                <svg viewBox="0 0 24 24" className="size-5 rotate-90 lg:rotate-0 rtl:lg:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14m-5-5 5 5-5 5" />
                </svg>
              </span>
            )}
          </li>
        ))}
      </ol>
      {note && <p className="mt-5 text-sm leading-relaxed text-muted">{note}</p>}
    </figure>
  )
}
