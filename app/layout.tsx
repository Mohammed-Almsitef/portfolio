import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Noto_Sans_Arabic } from 'next/font/google'
import { arabicEnabled, getSite } from '@/lib/content'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})
// Inter carries no Arabic glyphs, so Arabic would fall back to whatever the
// device happens to have — usually something that clashes badly with the rest
// of the page. Subsetted to Arabic only, and applied via [lang='ar'], so
// English visitors never download it.
const arabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const [site, hasArabic] = await Promise.all([getSite(), arabicEnabled()])

  return {
    metadataBase: new URL(site.url),
    // Only advertise the Arabic page once it exists — pointing a crawler at a
    // 404 is worse than not mentioning the translation at all.
    alternates: hasArabic
      ? { canonical: '/', languages: { en: '/', ar: '/ar' } }
      : { canonical: '/' },
    title: {
      default: `${site.name} — ${site.role}`,
      template: `%s — ${site.name}`,
    },
    description: site.tagline,
    keywords: [
      'robotics engineer',
      'AI engineer',
      'machine learning engineer',
      'deep learning',
      'computer vision',
      'NLP',
      'large language models',
      'PyTorch',
      'ROS 2',
      'SLAM',
      'reinforcement learning',
      'autonomous systems',
      'Python',
      'C++',
      site.name,
    ],
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
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the inline script below adds a class to <html>
    // before React hydrates, which is an intentional server/client difference.
    // It applies only to this element's own attributes, not the tree below it.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${mono.variable} ${arabic.variable}`}
    >
      <head>
        {/*
          Runs synchronously before first paint, so the resolved theme is on
          <html> before anything is drawn — no flash of the wrong palette.
          Wrapped in try/catch because localStorage throws in some privacy
          modes, and a theme preference must never break the page.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var r=document.documentElement;r.classList.add('js');try{var s=localStorage.getItem('theme');r.dataset.theme=(s==='dark'||(s!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches))?'dark':'light'}catch(e){}})()`,
          }}
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  )
}
