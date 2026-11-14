import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Noto_Sans_Arabic } from 'next/font/google'
import { getAppearance, getSite } from '@/lib/content'
import { alternatesFor } from '@/lib/metadata'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})
// Geist carries no Arabic glyphs, so Arabic would fall back to whatever the
// device happens to have — usually something that clashes badly with the rest
// of the page. Subsetted to Arabic only, and applied via [lang='ar'], so
// English visitors never download it.
const arabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
  // 166 KB: preloading it made every English visitor download it before the
  // first paint. Not preloaded, the browser fetches it only when Arabic text
  // is actually on the page.
  preload: false,
})

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
  // Only small labels use it; it should not compete with the headline font.
  preload: false,
})

/** Browser chrome (address bar on phones) matches the page ground. */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#06070b' },
    { media: '(prefers-color-scheme: light)', color: '#eef1f6' },
  ],
}

export async function generateMetadata(): Promise<Metadata> {
  const [site, alternates] = await Promise.all([getSite(), alternatesFor('en')])

  return {
    metadataBase: new URL(site.url),
    // Only advertise the Arabic page once it exists — pointing a crawler at a
    // 404 is worse than not mentioning the translation at all.
    alternates,
    title: {
      default: `${site.name} — ${site.role}`,
      template: `%s — ${site.name}`,
    },
    description: site.tagline,
    // Edited in the manager under Site & contact → Search keywords.
    keywords: site.seoKeywords.length
      ? [...site.seoKeywords, site.name]
      : ['robotics engineer', 'ROS 2 engineer', 'AI engineer', 'ROS 2', 'Nav2', 'SLAM', site.name],
    openGraph: {
      title: `${site.name} — ${site.role}`,
      description: site.tagline,
      url: site.url,
      siteName: site.name,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${site.name} — ${site.role}`,
      description: site.tagline,
    },
    robots: { index: true, follow: true },
    // Search Console offers a meta tag as one way to prove you own the domain.
    // Read from the environment rather than committed, so the token can be
    // pasted into Vercel without a code change — and so an empty value simply
    // omits the tag instead of emitting a broken one.
    ...(process.env.GOOGLE_SITE_VERIFICATION
      ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
      : {}),
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { defaultTheme, accent } = await getAppearance()

  return (
    // suppressHydrationWarning: the inline script below adds a class to <html>
    // before React hydrates, which is an intentional server/client difference.
    // It applies only to this element's own attributes, not the tree below it.
    <html
      lang="en"
      suppressHydrationWarning
      // Server-rendered, so the accent is right in the first paint — no flash
      // of blue before a client effect could correct it.
      data-accent={accent}
      className={`${geist.variable} ${mono.variable} ${arabic.variable}`}
    >
      <head>
        {/*
          Runs synchronously before first paint, so the resolved theme is on
          <html> before anything is drawn — no flash of the wrong palette.
          The default comes from the manager; a visitor's own stored choice
          always beats it. Wrapped in try/catch because localStorage throws in
          some privacy modes, and a theme preference must never break the page.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var r=document.documentElement;var d=${JSON.stringify(defaultTheme)};r.classList.add('js');r.dataset.theme=d;try{var s=localStorage.getItem('theme');if(s==='dark'||s==='light')r.dataset.theme=s}catch(e){}})()`,
          }}
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  )
}
