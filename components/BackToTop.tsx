'use client'

import { useScrollValue } from '@/lib/hooks'

export default function BackToTop({ label = 'Back to top' }: { label?: string }) {
  // Only once the reader is well down the page, and never over the footer.
  // Phones get no floating button at all: on a 390px screen it always sat on
  // top of text, and the nav is one thumb-reach away.
  const show = useScrollValue(
    () =>
      window.scrollY > window.innerHeight * 2 &&
      window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 220,
    false,
  )

  return (
    <a
      href="#top"
      aria-label={label}
      data-print-hide
      // Hidden from the tab order while invisible so keyboard users don't
      // land on a control they cannot see.
      tabIndex={show ? undefined : -1}
      aria-hidden={show ? undefined : 'true'}
      className={`glass fixed bottom-6 end-6 z-40 hidden size-10 items-center justify-center rounded-full text-sm text-muted sm:flex transition-[opacity,transform,color,border-color] duration-300 hover:border-accent hover:text-accent ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <span aria-hidden="true">↑</span>
    </a>
  )
}
