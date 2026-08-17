import SocialIcon from './SocialIcon'
import Spotlight from './Spotlight'
import type { ContactLinkStyle, Social } from '@/lib/content'

/**
 * One contact link.
 *
 * Two shapes, chosen in the manager under Appearance. `tiles` prints the
 * platform and the handle beside the mark; `icons` is the mark alone, which
 * reads faster once the marks are recognisable and takes a fraction of the
 * room. Both draw from the same card language as a project card — border, tone
 * wash, pointer-tracked glow, lift on hover — keyed to the platform's tone.
 */
export default function SocialLink({
  social,
  style = 'tiles',
}: {
  social: Social
  style?: ContactLinkStyle
}) {
  const { href, label, handle, platform, tone } = social

  // Only a link that leaves the browser gets a new tab; a mailto: handed to
  // _blank leaves an empty one behind.
  const external = /^https?:/i.test(href)
  const linkProps = {
    href,
    ...(external ? { target: '_blank' as const, rel: 'noopener noreferrer' } : {}),
  }

  const frame = {
    style: {
      '--tone': `var(--tone-${tone})`,
      // Spotlight reads --card-glow; re-point it at this platform's tone.
      '--card-glow': 'rgb(var(--tone) / 0.16)',
    } as React.CSSProperties,
    // The tone wash is a background *image* layered over bg-surface's colour, so
    // it needs no element of its own and still sits under the hover glow.
    className:
      'group rounded-2xl border border-border bg-surface bg-[linear-gradient(135deg,rgb(var(--tone)/0.07),transparent_62%)] shadow-[var(--card-shadow)] transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-[rgb(var(--tone)/0.45)]',
  }

  const chip =
    'flex shrink-0 items-center justify-center rounded-xl border border-[rgb(var(--tone)/0.28)] bg-[rgb(var(--tone)/0.12)] text-[rgb(var(--tone))] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] transition-transform duration-300 group-hover:scale-105'

  if (style === 'icons') {
    return (
      // One frame, not two: the card *is* the tinted chip here. Nesting the
      // tile's chip inside the tile's border left every icon in a double box.
      <Spotlight
        style={frame.style}
        className="group size-14 rounded-2xl border border-[rgb(var(--tone)/0.3)] bg-[rgb(var(--tone)/0.1)] shadow-[inset_0_1px_0_rgb(255_255_255/0.06),var(--card-shadow)] transition-[transform,border-color,background-color] duration-300 hover:-translate-y-1 hover:border-[rgb(var(--tone)/0.6)] hover:bg-[rgb(var(--tone)/0.16)]"
        // Spotlight wraps its children in a div of its own. Without a height on
        // that div the link's `size-full` resolved against an auto-height
        // parent and collapsed to the icon, which then sat at the top of the
        // card instead of its middle.
        innerClassName="size-full"
      >
        {/* The name is gone from the surface, so it has to live in the
            accessible name and the tooltip — an unlabelled mark is a guessing
            game for a screen reader and for anyone who doesn't know the logo. */}
        <a
          {...linkProps}
          aria-label={handle ? `${label} — ${handle}` : label}
          title={handle ? `${label} · ${handle}` : label}
          className="flex size-full items-center justify-center rounded-2xl text-[rgb(var(--tone))] transition-transform duration-300 group-hover:scale-110"
        >
          <SocialIcon platform={platform} className="size-[1.375rem]" />
        </a>
      </Spotlight>
    )
  }

  return (
    <Spotlight {...frame} className={`${frame.className} h-full`} innerClassName="h-full">
      <a {...linkProps} className="flex h-full items-center gap-3.5 rounded-2xl px-4 py-3.5">
        <span className={`${chip} size-11`}>
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
