import SocialIcon from './SocialIcon'
import Spotlight from './Spotlight'
import type { Social } from '@/lib/content'

/**
 * One contact link, as a card.
 *
 * Same card language as a project card — border, wash, pointer-tracked glow,
 * lift on hover — but keyed to the platform's tone rather than the project's, so
 * the grid reads as a set of platforms at a glance.
 */
export default function SocialLink({ social }: { social: Social }) {
  const { href, label, handle, platform, tone } = social

  // Only a link that leaves the browser gets a new tab; a mailto: handed to
  // _blank leaves an empty one behind.
  const external = /^https?:/i.test(href)

  return (
    <Spotlight
      style={
        {
          '--tone': `var(--tone-${tone})`,
          // Spotlight reads --card-glow; re-point it at this platform's tone.
          '--card-glow': 'rgb(var(--tone) / 0.16)',
        } as React.CSSProperties
      }
      // The tone wash is a background *image* layered over bg-surface's colour,
      // so it needs no element of its own and still sits under the hover glow.
      className="group h-full rounded-2xl border border-border bg-surface bg-[linear-gradient(135deg,rgb(var(--tone)/0.07),transparent_62%)] shadow-[var(--card-shadow)] transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-[rgb(var(--tone)/0.45)]"
    >
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : undefined)}
        className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[rgb(var(--tone)/0.28)] bg-[rgb(var(--tone)/0.12)] text-[rgb(var(--tone))] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] transition-transform duration-300 group-hover:scale-105">
          <SocialIcon platform={platform} className="size-[1.1875rem]" />
        </span>

        <span className="min-w-0">
          <span className="block text-sm font-semibold leading-snug tracking-tight">{label}</span>
          {handle && (
            // A handle is Latin even on the Arabic site, so it is set LTR
            // explicitly — otherwise an @ or + drifts to the wrong end.
            <span
              dir="ltr"
              className="mt-0.5 block truncate font-mono text-xs text-muted transition-colors group-hover:text-[rgb(var(--tone))]"
            >
              {handle}
            </span>
          )}
        </span>

        {/* Rises rather than slides: a horizontal nudge would have to be
            mirrored on the Arabic side. */}
        <span
          aria-hidden="true"
          className="ms-auto shrink-0 font-mono text-xs text-muted opacity-60 transition-[transform,color,opacity] duration-300 group-hover:-translate-y-0.5 group-hover:text-[rgb(var(--tone))] group-hover:opacity-100"
        >
          {external ? '↗' : '→'}
        </span>
      </a>
    </Spotlight>
  )
}
