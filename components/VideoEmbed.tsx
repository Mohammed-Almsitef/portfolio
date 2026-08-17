/**
 * Embedded demo video.
 *
 * A working demo carries far more weight than a still, so the video is embedded
 * rather than linked out. Uses youtube-nocookie and defers loading so the page
 * itself isn't paying for the player.
 *
 * When the URL is still the shipped placeholder, this renders a labelled slot
 * instead of a broken player — an obviously-empty frame is better than an
 * iframe error, and it says exactly what to do about it.
 */
function youTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/)
  const id = m?.[1]
  if (!id || id === 'yourdemo') return null
  return id
}

export default function VideoEmbed({ url, title }: { url: string; title: string }) {
  const id = youTubeId(url)

  if (!id) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface text-center">
        <p className="mono-label font-mono text-xs uppercase tracking-wider text-muted">Demo video</p>
        <p className="max-w-sm px-6 text-sm text-body">
          Add a 30–60 second clip of this running in the manager, under this project’s{' '}
          <code className="font-mono">Demo video URL</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-surface">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={`${title} — demo video`}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="size-full"
      />
    </div>
  )
}
