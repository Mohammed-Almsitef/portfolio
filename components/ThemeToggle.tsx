'use client'

import Icon from './Icon'
import { useTheme, type ThemeMode } from '@/lib/theme'
import { CONTROL_BUTTON } from '@/lib/styles'

const LABELS: Record<ThemeMode, string> = {
  light: 'Light theme',
  dark: 'Dark theme',
}

export default function ThemeToggle() {
  // The mode is shared with every other control that can change it — see
  // lib/theme. Holding a private copy here is what used to let this icon go
  // stale when the theme was flipped from the command palette instead.
  const { mode, setTheme } = useTheme()

  // Shows the icon of the theme a click switches TO, not the one currently
  // active — a sun on a dark page promises light, not "you are in the dark".
  const next: ThemeMode = mode === 'light' ? 'dark' : 'light'

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
      title={`Current: ${LABELS[mode]}\nClick to switch to ${next}`}
      className={`${CONTROL_BUTTON} cursor-pointer`}
      data-print-hide
    >
      <Icon name={next === 'dark' ? 'moon' : 'sun'} className="size-5" />
    </button>
  )
}
