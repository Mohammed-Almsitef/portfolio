'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * A self-hosted, silent demo loop.
 *
 * Video of the thing actually running is the most persuasive asset a robotics
 * project has — far more than a screenshot or generated art. So it is served
 * from this domain rather than embedded: no consent banner, no third-party
 * player chrome, and it starts instantly.
 *
 * Three behaviours make six of these on one page reasonable:
 *
 * 1. Nothing downloads until the clip is near the viewport. Marking them all
 *    `autoplay` would have the browser fetch every one on load.
 * 2. Off-screen clips pause, so scrolling past doesn't leave five videos
 *    decoding behind you.
 * 3. Reduced-motion visitors get the poster frame and a play button instead of
 *    movement they didn't ask for.
 *
 * Before JavaScript runs it renders as an ordinary video with controls, so it
 * is still playable if the script never arrives.
 */
export default function ProjectClip({
  src,
  poster,
  title,
  className = '',
}: {
  src: string
  poster?: string
  title: string
  className?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [enhanced, setEnhanced] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    setEnhanced(true)

    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const video = ref.current
    if (!video || !enhanced || reduced) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Autoplay can still be refused (data saver, low power mode). The
          // poster stays up in that case, which is a fine outcome.
          void video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.25 },
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [enhanced, reduced])

  return (
    <div className={`relative overflow-hidden bg-elevated ${className}`}>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        // Before hydration: a plain video the visitor can start themselves.
        // After: the observer drives it, so the controls would be noise.
        controls={!enhanced || reduced}
        preload={enhanced ? 'none' : 'metadata'}
        aria-label={`${title} — silent demo clip`}
        className="size-full object-cover"
      />
    </div>
  )
}
