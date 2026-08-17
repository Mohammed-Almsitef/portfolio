import Image from 'next/image'

/**
 * The About portrait, standing on a backdrop rather than floating on the page.
 *
 * The photo is a cut-out with a transparent ground, which is why it needed one:
 * on its own it read as an image pasted onto the section, and its lower edge —
 * where the body is cropped — ended in a hard horizontal line.
 *
 * So the backdrop is built from the same motifs as the rest of the site: the
 * card surface and border, an engineering grid, an accent glow, and a horizon
 * line with a contact shadow on it so the subject has somewhere to stand. The
 * cropped edge is then dissolved into that ground with a mask, which is what
 * removes the pasted-on look.
 *
 * Everything is drawn from the theme tokens, so it follows both colour schemes
 * and whichever accent is set in the manager.
 */
export default function AboutPhoto({
  src,
  alt,
  onPhones = true,
}: {
  src: string
  alt: string
  /** Set in the manager. False keeps the portrait off screens under 640px. */
  onPhones?: boolean
}) {
  return (
    <div
      className={`relative isolate w-52 shrink-0 sm:w-64 lg:w-100 ${
        onPhones ? '' : 'hidden sm:block'
      }`}
    >
      {/* Taller than the photo, not inset into it: the hair starts 1.6% down
          the source image, so anything short of the top edge left the head
          outside the backdrop. The extra above it is headroom. */}
      <div className="absolute inset-x-0 bottom-0 -top-4 -z-10 sm:-top-5 lg:-top-8 overflow-hidden rounded-[1.5rem] border border-border bg-surface bg-[linear-gradient(180deg,rgb(var(--accent-tone)/0.13),transparent_58%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.05),var(--card-shadow)]">
        {/* Engineering grid: the same register as the generated project art. */}
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

        {/* Glow behind the shoulders, so the subject separates from the grid. */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-3/5 bg-[radial-gradient(60%_70%_at_50%_25%,rgb(var(--accent-tone)/0.22),transparent_70%)]"
        />

        {/* Horizon and contact shadow: the two cues that read as standing on a
            surface rather than being pasted over one. */}
        <span
          aria-hidden="true"
          className="absolute inset-x-4 bottom-[11%] h-px bg-[linear-gradient(90deg,transparent,rgb(var(--accent-tone)/0.5),transparent)]"
        />
        <span
          aria-hidden="true"
          className="absolute inset-x-[14%] bottom-[7%] h-8 rounded-[50%] bg-[radial-gradient(closest-side,rgb(var(--accent-tone)/0.4),transparent)] blur-[7px]"
        />
      </div>

      <Image
        src={src}
        alt={alt}
        // The real pixel size of the source, so the box reserved during load has
        // the photo's own aspect ratio and nothing shifts.
        width={1024}
        height={1137}
        // The crop at the hips is faded out instead of ending on a line. Kept
        // short — dissolve too much of the body and the grid reads through it.
        className="relative h-auto w-full [mask-image:linear-gradient(to_bottom,#000_89%,transparent_100%)]"
      />
    </div>
  )
}
