'use client'

import { useScrollValue } from '@/lib/hooks'

export default function BackToTop({ label = 'Back to top' }: { label?: string }) {
  const show = useScrollValue(() => window.scrollY > window.innerHeight, false)

  return (
    <a
      href="#top"
      aria-label={label}
      data-print-hide
      // Hidden from the tab order while invisible so keyboard users don't
      // land on a control they cannot see.
      tabIndex={show ? undefined : -1}
      aria-hidden={show ? undefined : 'true'}
      className={`fixed bottom-6 end-6 z-40 flex size-10 items-center justify-center rounded-full border border-border-strong bg-surface/90 text-sm text-muted backdrop-blur-sm transition-[opacity,transform,color,border-color] duration-300 hover:border-accent hover:text-accent ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <span aria-hidden="true">↑</span>
    </a>
  )
}
