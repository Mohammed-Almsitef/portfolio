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
  const [mode, setMode] = useState<Mode>('dark')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme')
      if (stored === 'light' || stored === 'dark') {
        setMode(stored)
        document.documentElement.dataset.theme = stored
      } else {
        document.documentElement.dataset.theme = 'dark'
      }
    } catch {
      document.documentElement.dataset.theme = 'dark'
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('theme', mode)
      document.documentElement.dataset.theme = mode
    } catch {
      // preference just won't persist
    }
  }, [mode])

  const toggleTheme = () => {
    setMode(mode === 'light' ? 'dark' : 'light')
  }

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
        {ICONS[mode]}
      </svg>
    </button>
  )
}