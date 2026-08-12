'use client'

import { useEffect, useState } from 'react'

type Mode = 'light' | 'system' | 'dark'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function resolve(mode: Mode): 'light' | 'dark' {
  if (mode === 'system') return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
  return mode
}

const ICONS: Record<Mode, React.ReactNode> = {
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </>
  ),
  system: (
    <>
      <rect x="2.5" y="4" width="19" height="12.5" rx="2" />
      <path d="M9 20h6M12 16.5V20" />
    </>
  ),
  dark: <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" />,
}

const LABELS: Record<Mode, string> = {
  light: 'Light theme',
  system: 'Match system theme',
  dark: 'Dark theme',
}

export default function ThemeToggle() {
  // Starts at 'system' on both server and client, then corrects after mount —
  // reading localStorage during render would desync hydration.
  const [mode, setMode] = useState<Mode>('system')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme')
      if (stored === 'light' || stored === 'dark') setMode(stored)
    } catch {
      // storage unavailable — stay on system
    }
  }, [])

  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.theme = resolve(mode)
    }
    apply()

    try {
      if (mode === 'system') localStorage.removeItem('theme')
      else localStorage.setItem('theme', mode)
    } catch {
      // preference just won't persist
    }

    if (mode !== 'system') return
    // Keep following the OS while 'system' is selected.
    const mq = window.matchMedia(DARK_QUERY)
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [mode])

  return (
    <div
      role="group"
      aria-label="Colour theme"
      data-print-hide
      className="flex items-center gap-0.5 rounded-lg border border-border bg-surface/70 p-0.5 backdrop-blur-sm"
    >
      {(['light', 'system', 'dark'] as Mode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          aria-pressed={mode === m}
          aria-label={LABELS[m]}
          title={LABELS[m]}
          className={`flex size-7 items-center justify-center rounded-md transition-colors ${
            mode === m
              ? 'bg-accent/15 text-accent'
              : 'text-muted hover:bg-border/60 hover:text-text'
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-[15px]"
            aria-hidden="true"
          >
            {ICONS[m]}
          </svg>
        </button>
      ))}
    </div>
  )
}
