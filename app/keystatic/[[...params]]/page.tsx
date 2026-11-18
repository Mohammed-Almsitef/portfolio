'use client'

import { useEffect, useMemo, useState } from 'react'
import { makePage } from '@keystatic/next/ui/app'
import config from '@/keystatic.config'
import { AR_LABEL_SUFFIX, LANG_KEY, NAVIGATION, langOfPath, readLang, type ManagerLang } from '@/lib/manager/lang'

/**
 * Keystatic, one language at a time.
 *
 * The config defines both content trees (the API needs every collection), but
 * the menu and dashboard only list the chosen language's, and the Arabic view
 * drops the " · Arabic" suffix from labels, since the switch already says so.
 */
function configFor(lang: ManagerLang): typeof config {
  if (lang === 'en') return config
  const strip = <T extends Record<string, { label: string }>>(entries: T): T =>
    Object.fromEntries(
      Object.entries(entries).map(([k, v]) => [k, { ...v, label: v.label.replace(AR_LABEL_SUFFIX, '') }]),
    ) as T
  return {
    ...config,
    collections: strip(config.collections ?? {}),
    singletons: strip(config.singletons ?? {}),
    ui: { ...config.ui, navigation: NAVIGATION.ar },
  } as typeof config
}

const pages: Record<ManagerLang, ReturnType<typeof makePage>> = {
  en: makePage(configFor('en')),
  ar: makePage(configFor('ar')),
}

export default function KeystaticPage() {
  // null until the stored choice is read, so the wrong menu never flashes.
  const [lang, setLang] = useState<ManagerLang | null>(null)
  useEffect(() => {
    // A link straight to an Arabic (or English) screen sets the view to match;
    // the dashboard and shared screens keep the stored choice.
    const fromPath = langOfPath(window.location.pathname)
    if (fromPath) {
      try {
        localStorage.setItem(LANG_KEY, fromPath)
      } catch {}
    }
    setLang(fromPath ?? readLang())
  }, [])
  const Page = useMemo(() => (lang ? pages[lang] : null), [lang])
  return Page ? <Page /> : null
}
