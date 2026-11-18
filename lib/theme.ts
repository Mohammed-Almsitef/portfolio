'use client'

import { useEffect, useState } from 'react'

/**
 * The resolved colour mode, shared by every control that can change it.
 *
 * The mode lives on `<html data-theme>`, written before first paint by the
 * inline script in app/layout.tsx. This module is the only thing that writes
 * it afterwards, and it notifies subscribers when it does — otherwise two
 * controls that both toggle the theme each keep their own `useState` copy and
 * one goes stale the moment the other is used.
 */
export type ThemeMode = 'light' | 'dark'

const subscribers = new Set<(mode: ThemeMode) => void>()

/** Reads what the pre-paint script (or a previous toggle) stamped on <html>. */
function currentTheme(): ThemeMode {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode
  try {
    // '-v2': choices saved on the previous design are not carried over, so
    // every visitor starts on the default (light) until they pick again.
    localStorage.setItem('theme-v2', mode)
  } catch {
    // preference just won't persist
  }
  subscribers.forEach((notify) => notify(mode))
}

/**
 * Subscribe to the colour mode and get a setter back.
 *
 * Returns 'light' on the first render rather than reading the DOM, because the
 * pre-paint script may have replaced the server's `data-theme` with a stored
 * choice — reading it during render would be a hydration mismatch. The real value arrives in the mount effect.
 */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>('light')

  useEffect(() => {
    setMode(currentTheme())
    subscribers.add(setMode)
    return () => {
      subscribers.delete(setMode)
    }
  }, [])

  return { mode, setTheme: applyTheme }
}
