import Image from 'next/image'
import type { PhotoBackdrop } from '@/lib/content'

/**
 * The About portrait, standing on a backdrop rather than floating on the page.
 *
 * The photo is a cut-out with a transparent ground, which is why it needed one:
 * on its own it read as an image pasted onto the section, and its lower edge —
 * where the body is cropped — ended in a hard horizontal line.
 *
 * Which of the six grounds is used is set in the manager under About. All of
 * them are built from theme tokens rather than fixed colours, so each follows
 * both colour schemes and whichever accent Appearance is set to — and none of
 * them ships an image to download.
 */

/** Glow behind the shoulders, so the subject separates from a patterned ground. */
function Glow() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-3/5 bg-[radial-gradient(60%_70%_at_50%_25%,rgb(var(--accent-tone)/0.22),transparent_70%)]"
    />
  )
}

/**
 * Horizon and contact shadow: the two cues that read as standing on a surface
 * rather than being pasted over one. The horizon suits the grounds that already
 * have straight lines in them and fights the ones that don't.
 */
function Ground({ horizon = true }: { horizon?: boolean }) {
  return (
    <>
      {horizon && (
        <span
          aria-hidden="true"
          className="absolute inset-x-4 bottom-[11%] h-px bg-[linear-gradient(90deg,transparent,rgb(var(--accent-tone)/0.5),transparent)]"
        />
      )}
      <span
        aria-hidden="true"
        className="absolute inset-x-[14%] bottom-[7%] h-8 rounded-[50%] bg-[radial-gradient(closest-side,rgb(var(--accent-tone)/0.4),transparent)] blur-[7px]"
      />
    </>
  )
}

/** The top wash shared by the patterned grounds. */
const TOP_WASH =
  'bg-surface bg-[linear-gradient(180deg,rgb(var(--accent-tone)/0.13),transparent_58%)]'

/**
 * The six grounds.
 *
 * `wash` is the panel's own background — a colour, plus gradients layered over
 * it. `layers` is everything painted on top of that and beneath the photo.
 */
const BACKDROPS: Record<Exclude<PhotoBackdrop, 'none'>, { wash: string; layers: React.ReactNode }> =
  {
    grid: {
      wash: TOP_WASH,
      layers: (
        <>
          <svg aria-hidden="true" className="absolute inset-0 size-full" focusable="false">
            <defs>
              <pattern id="about-grid" width="26" height="26" patternUnits="userSpaceOnUse">
                <path
                  d="M26 0H0V26"
                  fill="none"
                  stroke="rgb(var(--accent-tone))"
                  strokeOpacity="0.14"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#about-grid)" />
          </svg>
          <Glow />
          <Ground />
        </>
      ),
    },

    dots: {
      wash: TOP_WASH,
      layers: (
        <>
          <svg aria-hidden="true" className="absolute inset-0 size-full" focusable="false">
            <defs>
              <pattern id="about-dots" width="18" height="18" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.1" fill="rgb(var(--accent-tone))" fillOpacity="0.24" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#about-dots)" />
          </svg>
          <Glow />
          <Ground horizon={false} />
        </>
      ),
    },

    spotlight: {
      // No pattern at all: one broad light behind the head falling off to the
      // panel's own surface. The quietest of the six.
      wash: 'bg-surface bg-[radial-gradient(65%_55%_at_50%_20%,rgb(var(--accent-tone)/0.3),transparent_72%)]',
      layers: <Ground horizon={false} />,
    },

    studio: {
      // Two gradients crossing — a raking light from the top corner and a lift
      // off the floor — which is how a studio sweep actually falls.
      wash: 'bg-surface bg-[linear-gradient(155deg,rgb(var(--accent-tone)/0.26),transparent_48%),linear-gradient(0deg,rgb(var(--accent-tone)/0.14),transparent_38%)]',
      layers: <Ground horizon={false} />,
    },

    sweep: {
      // The site's own motif: a sensor at the base sweeping outward, the same
      // idea as the favicon and the hero, reduced to something that will sit
      // still behind a face. The viewBox is unitless and stretched, so the arcs
      // scale with the panel instead of tiling.
      wash: TOP_WASH,
      layers: (
        <>
          <svg
            aria-hidden="true"
            className="absolute inset-0 size-full"
            focusable="false"
            viewBox="0 0 100 130"
            preserveAspectRatio="none"
          >
            <g
              fill="none"
              stroke="rgb(var(--accent-tone))"
              strokeOpacity="0.2"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            >
              {[22, 40, 58, 76, 94, 112].map((r) => (
                <circle key={r} cx="50" cy="128" r={r} />
              ))}
              <path d="M50 128 8 40M50 128 92 40M50 128 50 18" strokeOpacity="0.12" />
            </g>
          </svg>
          <Glow />
          <Ground />
        </>
      ),
    },
  }

export default function AboutPhoto({
  src,
  alt,
  backdrop = 'grid',
  onPhones = true,
}: {
  src: string
  alt: string
  /** Which ground to draw. Set in the manager under About. */
  backdrop?: PhotoBackdrop
  /** Set in the manager. False keeps the portrait off screens under 640px. */
  onPhones?: boolean
}) {
  const ground = backdrop === 'none' ? null : BACKDROPS[backdrop]

  return (
    <div
      className={`relative isolate w-52 shrink-0 sm:w-64 lg:w-100 ${
        onPhones ? '' : 'hidden sm:block'
      }`}
    >
      {/* Taller than the photo, not inset into it: the hair starts 1.6% down the
          source image, so anything short of the top edge left the head outside
          the backdrop. The extra above it is headroom. */}
      {ground && (
        <div
          className={`absolute inset-x-0 -top-4 bottom-0 -z-10 overflow-hidden rounded-[1.5rem] border border-border shadow-[inset_0_1px_0_rgb(255_255_255/0.05),var(--card-shadow)] sm:-top-5 lg:-top-8 ${ground.wash}`}
        >
          {ground.layers}
        </div>
      )}

      <Image
        src={src}
        alt={alt}
        // The real pixel size of the source, so the box reserved during load has
        // the photo's own aspect ratio and nothing shifts.
        width={1024}
        height={1137}
        // The crop at the hips is faded out instead of ending on a line. Kept
        // short — dissolve too much of the body and the ground reads through it.
        className="relative h-auto w-full [mask-image:linear-gradient(to_bottom,#000_89%,transparent_100%)]"
      />
    </div>
  )
}
