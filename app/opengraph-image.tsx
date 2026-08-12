import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { getSite } from '@/lib/content'

export const alt = 'Portfolio'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Link preview card, rendered at build time.
 *
 * Uses the dark palette unconditionally: the image is baked once and has no
 * way to know the viewer's theme, and dark reads better against the light
 * chrome of Slack, LinkedIn, and iMessage.
 */
export default async function Image() {
  const site = await getSite()
  const domains = site.domains

  // Read from disk and inline as a data URI: the renderer has no origin to
  // fetch a relative path from at build time.
  const photo = await readFile(join(process.cwd(), 'public', 'profile-og.png'))
  const photoSrc = `data:image/png;base64,${photo.toString('base64')}`

  // Fonts are supplied explicitly from disk. Left to itself, ImageResponse
  // fetches a font over the network at render time, and when that fetch fails
  // the renderer emits an empty buffer — surfacing as a confusing
  // "unsupported image format" error rather than anything about fonts.
  const [regular, bold] = await Promise.all([
    readFile(join(process.cwd(), 'assets', 'fonts', 'Inter-Regular.ttf')),
    readFile(join(process.cwd(), 'assets', 'fonts', 'Inter-Bold.ttf')),
  ])

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        background: '#131720',
        fontFamily: 'Inter',
        padding: '64px 80px',
        position: 'relative',
      }}
    >
      {/* accent wash, echoing the hero glow */}
      <div
        style={{
          position: 'absolute',
          top: -220,
          left: -160,
          width: 760,
          height: 760,
          borderRadius: 999,
          background: 'radial-gradient(circle, rgba(96,165,250,0.20), rgba(96,165,250,0) 68%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          background: 'linear-gradient(90deg, #60a5fa, #818cf8 55%, rgba(96,165,250,0))',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flex: 1,
        }}
      >
        {site.availableForWork && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: '#b2bacb',
              fontSize: 24,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: '#60a5fa',
              }}
            />
            Available for work
          </div>
        )}

        <div
          style={{
            fontSize: 92,
            fontWeight: 700,
            color: '#eaeef6',
            letterSpacing: -3,
            lineHeight: 1.05,
          }}
        >
          {site.name}
        </div>

        <div style={{ fontSize: 38, color: '#60a5fa', marginTop: 18 }}>{site.role}</div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 44 }}>
          {domains.map((d) => (
            <div
              key={d}
              style={{
                border: '1px solid #2a3346',
                borderRadius: 999,
                padding: '9px 20px',
                fontSize: 22,
                color: '#b2bacb',
              }}
            >
              {d}
            </div>
          ))}
        </div>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoSrc}
        alt=""
        width={296}
        height={444}
        style={{
          borderRadius: 20,
          border: '1px solid #2a3346',
          objectFit: 'cover',
          marginLeft: 56,
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: 80,
          fontSize: 22,
          color: '#7c8698',
        }}
      >
        {site.url.replace(/^https?:\/\//, '')}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Inter', data: regular, weight: 400, style: 'normal' },
        { name: 'Inter', data: bold, weight: 700, style: 'normal' },
      ],
    },
  )
}
