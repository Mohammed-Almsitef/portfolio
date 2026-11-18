'use client'

import { useEffect, useState } from 'react'
import { LANG_KEY, counterpartPath, readLang, type ManagerLang } from '@/lib/manager/lang'

/**
 * English / Arabic switch beside the logo in the manager's sidebar.
 *
 * Switching stores the choice and reloads onto the same screen in the other
 * language, so the menu, the dashboard and the open page all change together.
 */
export default function LangSwitch() {
  const [lang, setLang] = useState<ManagerLang>('en')
  useEffect(() => setLang(readLang()), [])

  const choose = (to: ManagerLang) => {
    if (to === lang) return
    try {
      localStorage.setItem(LANG_KEY, to)
    } catch {
      // the switch still works for this page load
    }
    window.location.assign(counterpartPath(window.location.pathname, to))
  }

  return (
    <div role="group" aria-label="Content language" className="kst-lang">
      <button type="button" aria-pressed={lang === 'en'} onClick={() => choose('en')}>
        EN
      </button>
      <button type="button" aria-pressed={lang === 'ar'} onClick={() => choose('ar')} lang="ar">
        عربي
      </button>
    </div>
  )
}
