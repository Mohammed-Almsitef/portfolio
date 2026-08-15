'use client'

import { useEffect, useState } from 'react'

type Mode = 'light' | 'dark'

const ICONS: Record<Mode, React.ReactNode> = {
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </>
  ),
  dark: <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" />,
}

const LABELS: Record<Mode, string> = {
  light: 'Light theme',
  dark: 'Dark theme',
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>('light')

  // Adopt whatever the pre-paint script already resolved onto <html>, rather
  // than assuming a default here. That script knows the site-wide default from
  // the manager and the visitor's stored choice; duplicating either would mean
  // two sources of truth that drift, and a first click that goes the wrong way.
  useEffect(() => {
    const current = document.documentElement.dataset.theme
    if (current === 'light' || current === 'dark') setMode(current)
  }, [])

  // Written on click only, never on mount. Persisting the resolved mode as a
  // side effect of rendering would stamp the site-wide default into a
  // first-time visitor's storage, and a later change to that default would
  // then never reach them.
  const toggleTheme = () => {
    const picked: Mode = mode === 'light' ? 'dark' : 'light'
    setMode(picked)
    document.documentElement.dataset.theme = picked
    try {
      localStorage.setItem('theme', picked)
    } catch {
      // preference just won't persist
    }
  }

  // Shows the icon of the theme a click switches TO, not the one currently
  // active — a sun on a dark page promises light, not "you are in the dark".
  const next: Mode = mode === 'light' ? 'dark' : 'light'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} theme`}
      title={`Current: ${LABELS[mode]}\nClick to switch to ${mode === 'light' ? 'dark' : 'light'}`}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface/70 backdrop-blur-sm transition-colors hover:bg-border/60 hover:text-text cursor-pointer"
      data-print-hide
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        {ICONS[next]}
      </svg>
    </button>
  )
}
