import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }

/** Dark-theme tone colours, as in globals.css (400 weight). */
const TONE: Record<string, string> = {
  blue: '#9aaac4',
  violet: '#e9b44c',
  purple: '#e9b44c',
  cyan: '#5cc8d2',
  rose: '#f07850',
  emerald: '#5cc8d2',
  amber: '#e9b44c',
  teal: '#5cc8d2',
  lime: '#5cc8d2',
}

/**
 * A shared link-preview card for a page: kicker, title, summary, and the
 * owner's name, on the site's dark ground with the page's tone as accent.
 * Fonts come from disk so the build never depends on a network fetch.
 */
export async function ogCard({
  kicker,
  title,
  summary,
  name,
  tone = 'blue',
}: {
  kicker: string
  title: string
  summary: string
  name: string
  tone?: string
}) {
  const [regular, bold] = await Promise.all([
    readFile(join(process.cwd(), 'assets', 'fonts', 'SpaceGrotesk-Medium.ttf')),
    readFile(join(process.cwd(), 'assets', 'fonts', 'SpaceGrotesk-Bold.ttf')),
  ])
  const accent = TONE[tone] ?? TONE.blue
  // Cut at a word boundary, never mid-word.
  const short =
    summary.length > 170 ? `${summary.slice(0, 167).replace(/[\s,;:—-]+\S*$/, '')}…` : summary

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#16233a',
        backgroundImage: `radial-gradient(circle at 88% 12%, ${accent}33 0%, ${accent}00 45%)`,
        fontFamily: 'Space Grotesk',
        padding: '64px 76px',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 14, height: 14, borderRadius: 4, background: accent }} />
        <div style={{ fontSize: 26, color: accent, letterSpacing: 1 }}>{kicker}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: title.length > 48 ? 58 : 68, fontWeight: 700, color: '#f4f1e8', lineHeight: 1.08, letterSpacing: -1.5 }}>
          {title}
        </div>
        <div style={{ marginTop: 28, fontSize: 28, color: '#d5dde8', lineHeight: 1.45 }}>{short}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 24 }}>
        <div style={{ color: '#f4f1e8', fontWeight: 700 }}>{name}</div>
        <div style={{ color: '#9aaac4' }}>mohammedalmsitef.me</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 8, background: '#f06e42' }} />
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Space Grotesk', data: regular, weight: 500, style: 'normal' },
        { name: 'Space Grotesk', data: bold, weight: 700, style: 'normal' },
      ],
    },
  )
}
