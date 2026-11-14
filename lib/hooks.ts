'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Client-side behaviour shared by more than one component.
 *
 * Each of these existed two to four times over before it moved here, which is
 * how the copies had already drifted: two scroll listeners registered
 * `{ passive: true }` and two did not, and only some of the observers honoured
 * `prefers-reduced-motion`.
 */

/** True once the OS asks for less motion. Read at call time, not cached. */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Fires once, the first time the element crosses into view, and then stops
 * observing — these are entrance effects, so nothing needs to re-run when the
 * element leaves again.
 *
 * Under `prefers-reduced-motion` it reports "in view" immediately, so the
 * content is simply present rather than animating in.
 */
export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (prefersReducedMotion()) {
      setInView(true)
      return
    }

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        io.disconnect()
      }
    }, options)

    io.observe(el)
    return () => io.disconnect()
    // The options object is a fresh literal on every render, so it cannot be a
    // dependency without re-creating the observer each time. Every call site
    // passes a constant, which is the only case this supports.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { ref, inView }
}

/**
 * Subscribes to scroll (and optionally resize) and hands back whatever the
 * reader derives from the page position. `read` runs once on mount too, so the
 * first value reflects a page restored mid-scroll rather than assuming the top.
 */
export function useScrollValue<T>(read: () => T, initial: T, { onResize = false } = {}) {
  const [value, setValue] = useState<T>(initial)
  const readRef = useRef(read)
  readRef.current = read

  useEffect(() => {
    const update = () => setValue(readRef.current())
    update()
    window.addEventListener('scroll', update, { passive: true })
    if (onResize) window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      if (onResize) window.removeEventListener('resize', update)
    }
  }, [onResize])

  return value
}

/**
 * Copy-to-clipboard with a self-clearing confirmation.
 *
 * The write can reject — an insecure context, or a denied permission — and
 * that is not worth surfacing anywhere the visitor has to deal with it, since
 * every call site keeps the address visible and selectable next to the button.
 */
export function useCopyToClipboard(resetAfterMs = 1800) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), resetAfterMs)
    return () => clearTimeout(id)
  }, [copied, resetAfterMs])

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      // clipboard unavailable — the visible address is the fallback
    }
  }

  return { copied, copy }
}
