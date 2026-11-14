import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }

/** Dark-theme tone colours, as in globals.css (400 weight). */
const TONE: Record<string, string> = {
  blue: '#60a5fa',
  violet: '#a78bfa',
  purple: '#c084fc',
  cyan: '#22d3ee',
  rose: '#fb7185',
  emerald: '#34d399',
  amber: '#fbbf24',
  teal: '#2dd4bf',
  lime: '#a3e635',
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
    readFile(join(process.cwd(), 'assets', 'fonts', 'Inter-Regular.ttf')),
    readFile(join(process.cwd(), 'assets', 'fonts', 'Inter-Bold.ttf')),
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
        backgroundColor: '#06070b',
        backgroundImage: `radial-gradient(circle at 88% 12%, ${accent}33 0%, ${accent}00 45%)`,
        fontFamily: 'Inter',
        padding: '64px 76px',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 14, height: 14, borderRadius: 4, background: accent }} />
        <div style={{ fontSize: 26, color: accent, letterSpacing: 1 }}>{kicker}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: title.length > 48 ? 58 : 68, fontWeight: 700, color: '#f2f4f8', lineHeight: 1.08, letterSpacing: -1.5 }}>
          {title}
        </div>
        <div style={{ marginTop: 28, fontSize: 28, color: '#b4bccb', lineHeight: 1.45 }}>{short}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 24 }}>
        <div style={{ color: '#f2f4f8', fontWeight: 700 }}>{name}</div>
        <div style={{ color: '#7f899b' }}>mohammedalmsitef.me</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 8, background: `linear-gradient(90deg, ${accent}, #a78bfa)` }} />
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Inter', data: regular, weight: 400, style: 'normal' },
        { name: 'Inter', data: bold, weight: 700, style: 'normal' },
      ],
    },
  )
}
