'use client'

import { useEffect, useState } from 'react'

export default function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <a
      href="#top"
      aria-label="Back to top"
      data-print-hide
      // Hidden from the tab order while invisible so keyboard users don't
      // land on a control they cannot see.
      tabIndex={show ? undefined : -1}
      aria-hidden={show ? undefined : 'true'}
      className={`fixed bottom-6 right-6 z-40 flex size-10 items-center justify-center rounded-full border border-border-strong bg-surface/90 text-sm text-muted backdrop-blur-sm transition-[opacity,transform,color,border-color] duration-300 hover:border-accent hover:text-accent ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <span aria-hidden="true">↑</span>
    </a>
  )
}
