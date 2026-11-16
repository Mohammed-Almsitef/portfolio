import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { getSite } from '@/lib/content'

export const alt = 'Mohammed Almsitef — Robotics & AI Engineer'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const NAVY = '#16233a'
const CREAM = '#f4f1e8'
const ORANGE = '#f06e42'
const SLATE = '#9aaac4'

/**
 * The link-preview card (LinkedIn, WhatsApp, Slack), rendered at build time
 * in the site's own look: the navy cover-slide ground, cream type, the
 * orange accent rule, the portrait, and the domain. Navy reads well against
 * the light chrome most apps put around a preview.
 *
 * Fonts come from disk as static TTFs (the renderer cannot read the site's
 * variable woff2 files, and fetching at build time can fail silently).
 */
export default async function Image() {
  const site = await getSite()
  const [photo, bold, medium] = await Promise.all([
    readFile(join(process.cwd(), 'public', 'profile-og.png')),
    readFile(join(process.cwd(), 'assets', 'fonts', 'SpaceGrotesk-Bold.ttf')),
    readFile(join(process.cwd(), 'assets', 'fonts', 'SpaceGrotesk-Medium.ttf')),
  ])
  const photoSrc = `data:image/png;base64,${photo.toString('base64')}`
  const focus = site.domains.slice(0, 3).join('  ·  ')
  const [first, ...rest] = site.name.split(' ')

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: NAVY,
        fontFamily: 'Space Grotesk',
        color: CREAM,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '72px 0 64px 80px', width: 780 }}>
        <div style={{ display: 'flex', fontSize: 22, fontWeight: 500, color: SLATE, letterSpacing: 3 }}>
          {focus.toUpperCase()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: 96, fontWeight: 700, lineHeight: 1, letterSpacing: -4 }}>
            <span>{first}</span>
            <span>{rest.join(' ')}</span>
          </div>
          <div style={{ display: 'flex', width: 72, height: 6, borderRadius: 3, backgroundColor: ORANGE, marginTop: 34 }} />
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 500, color: CREAM, marginTop: 26 }}>{site.role}</div>
        </div>
        <div style={{ display: 'flex', fontSize: 24, fontWeight: 500, color: SLATE }}>
          {site.url.replace(/^https?:\/\//, '')}
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photoSrc} width={420} height={630} style={{ objectFit: 'cover' }} alt="" />
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Space Grotesk', data: bold, weight: 700, style: 'normal' },
        { name: 'Space Grotesk', data: medium, weight: 500, style: 'normal' },
      ],
    },
  )
}
