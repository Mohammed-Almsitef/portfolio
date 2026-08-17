import { collection, config, fields, singleton } from '@keystatic/core'
import { PLATFORM_IDS, platformName } from '@/lib/socials'
import BrandMark from '@/components/manager/BrandMark'

/**
 * Content schema for the portfolio manager at /keystatic.
 *
 * Storage is local on your machine (writes files directly, no login) and
 * GitHub in production (commits to the repo, which redeploys). Same schema
 * either way — only where Save lands differs.
 */

const TONES = [
  { label: 'Blue', value: 'blue' },
  { label: 'Violet', value: 'violet' },
  { label: 'Purple', value: 'purple' },
  { label: 'Cyan', value: 'cyan' },
  { label: 'Rose', value: 'rose' },
  { label: 'Emerald', value: 'emerald' },
  { label: 'Amber', value: 'amber' },
  { label: 'Teal', value: 'teal' },
  { label: 'Lime', value: 'lime' },
] as const

const VISUALS = [
  { label: 'Node graph (language / LLM)', value: 'graph' },
  { label: 'Occupancy grid (navigation)', value: 'occupancy' },
  { label: 'Detection boxes (vision)', value: 'detect' },
  { label: 'Joint traces (control / RL)', value: 'gait' },
  { label: 'Point cloud (SLAM)', value: 'cloud' },
  { label: 'Retrieved chunks (RAG)', value: 'layers' },
] as const

/**
 * Icon choices for a social link. The list is built from the icons the site
 * actually ships, so the manager can never offer one that would render blank.
 */
const SOCIAL_ICONS = [
  { label: 'Automatic (from the URL)', value: 'auto' },
  ...PLATFORM_IDS.map((id) => ({ label: platformName(id), value: id })),
]

/** Shown on every item that can be hidden without being deleted. */
const visible = fields.checkbox({
  label: 'Show on the site',
  description: 'Untick to hide this without deleting it.',
  defaultValue: true,
})

/**
 * Storage mode.
 *
 * This file is imported by BOTH the server route handler and the browser app,
 * so the two must resolve the same `kind`. That rules out gating on a
 * server-only secret: the browser cannot read those, would fall back to
 * `local`, and would call `/api/keystatic/tree` — an endpoint that only exists
 * in local mode, so a GitHub-mode server answers 404 and every collection
 * fails with `"Not Found" is not valid JSON`.
 *
 * Hence a NEXT_PUBLIC_ flag, which Next inlines into both bundles:
 *
 *   unset            → local mode; writes files directly, no login (dev)
 *   'github'         → GitHub mode; the browser reads and writes via the
 *                      GitHub API, so the three secrets below must also be set
 *                      or Keystatic throws at config load and fails the build
 *
 * In GitHub mode the server still needs KEYSTATIC_GITHUB_CLIENT_ID,
 * KEYSTATIC_GITHUB_CLIENT_SECRET and KEYSTATIC_SECRET for the OAuth exchange.
 */
const useGitHubStorage = process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === 'github'

const projectsDef = (dir: string, tag: string) =>
  collection({
    label: `Projects${tag}`,
    slugField: 'title',
    path: `${dir}/projects/*`,
    format: { data: 'json' },
    columns: ['title', 'year'],
    schema: {
      title: fields.slug({
        name: { label: 'Title' },
        slug: {
          label: 'URL slug',
          description: 'Appears in the address: /projects/<slug>',
        },
      }),
      visible,
      order: fields.integer({
        label: 'Order',
        description: 'Lower numbers come first.',
        defaultValue: 10,
      }),
      year: fields.text({ label: 'Year' }),
      featured: fields.checkbox({
        label: 'Featured',
        description: 'Featured projects sort to the front of the grid.',
        defaultValue: false,
      }),
      tone: fields.select({
        label: 'Colour',
        options: [...TONES],
        defaultValue: 'blue',
      }),
      visual: fields.select({
        label: 'Cover art',
        description: 'Used when no clip or image is uploaded.',
        options: [...VISUALS],
        defaultValue: 'graph',
      }),
      clip: fields.file({
        label: 'Demo clip',
        description:
          'A short silent screen capture of this running — 20–40s, MP4 (H.264), under 8 MB. ' +
          'It plays muted on a loop and beats every screenshot. Compress with: ' +
          'ffmpeg -i in.mp4 -vf scale=960:-2 -crf 30 -an -movflags +faststart out.mp4',
        directory: 'public/projects/clips',
        publicPath: '/projects/clips/',
      }),
      image: fields.image({
        label: 'Cover image',
        description:
          'Used as the clip’s poster frame, or on its own if there is no clip. ' +
          'A real screenshot beats any placeholder.',
        directory: 'public/projects',
        publicPath: '/projects/',
      }),
      summary: fields.text({
        label: 'Summary',
        description: 'One or two lines for the card.',
        multiline: true,
      }),
      problem: fields.text({
        label: 'The problem',
        description: 'The real-world challenge — the "why".',
        multiline: true,
      }),
      solution: fields.text({
        label: 'What you built',
        description: 'The "what".',
        multiline: true,
      }),
      how: fields.array(fields.text({ label: 'Point', multiline: true }), {
        label: 'How it works',
        description: 'Be specific: languages, frameworks, sensors, infrastructure.',
        itemLabel: (props) => props.value.slice(0, 60) || 'Point',
      }),
      testing: fields.text({
        label: 'How it was tested',
        description: 'Optional. Unit tests, HIL rigs, CI — evidence the code is reliable.',
        multiline: true,
      }),
      results: fields.array(fields.text({ label: 'Result', multiline: true }), {
        label: 'Results',
        description: 'Numbers, not adjectives.',
        itemLabel: (props) => props.value.slice(0, 60) || 'Result',
      }),
      lessons: fields.array(fields.text({ label: 'Lesson', multiline: true }), {
        label: 'What you learned',
        description: 'What went wrong and what you would do differently.',
        itemLabel: (props) => props.value.slice(0, 60) || 'Lesson',
      }),
      role: fields.text({
        label: 'Your role',
        description: 'Optional. Your specific contribution on a team project.',
        multiline: true,
      }),
      tags: fields.array(fields.text({ label: 'Tag' }), {
        label: 'Technologies',
        itemLabel: (props) => props.value || 'Tag',
      }),
      repoUrl: fields.url({ label: 'Source code URL' }),
      videoUrl: fields.url({
        label: 'Demo video URL',
        description: 'A YouTube link. Embedded on the project page — worth more than any text.',
      }),
      liveUrl: fields.url({ label: 'Live demo URL' }),
    },
  })

const sectionsDef = (dir: string, tag: string) =>
  singleton({
    label: `Sections${tag}`,
    path: `${dir}/sections`,
    format: { data: 'json' },
    schema: {
      order: fields.array(
        fields.object({
          key: fields.select({
            label: 'Section',
            options: [
              { label: 'About', value: 'about' },
              { label: 'Projects', value: 'projects' },
              { label: 'Open Source', value: 'openSource' },
              { label: 'Skills', value: 'skills' },
              { label: 'Experience', value: 'experience' },
              { label: 'Contact', value: 'contact' },
            ],
            defaultValue: 'about',
          }),
          label: fields.text({
            label: 'Heading shown on the page',
            description: 'Shown as the section heading on the page.',
          }),
          visible: fields.checkbox({
            label: 'Show on the site',
            defaultValue: true,
          }),
        }),
        {
          label: 'Sections, in page order',
          description: 'Drag to reorder. Untick to hide. Remove to delete entirely.',
          itemLabel: (props) =>
            `${props.fields.label.value || props.fields.key.value}${
              props.fields.visible.value ? '' : '  — hidden'
            }`,
        },
      ),
    },
  })

const siteDef = (dir: string, tag: string) =>
  singleton({
    label: `Site & contact${tag}`,
    path: `${dir}/site`,
    format: { data: 'json' },
    schema: {
      name: fields.text({ label: 'Your name' }),
      role: fields.text({
        label: 'Role',
        description: 'Shown under your name in the hero.',
      }),
      tagline: fields.text({ label: 'Tagline', multiline: true }),
      location: fields.text({ label: 'Location' }),
      email: fields.text({ label: 'Email' }),
      url: fields.url({
        label: 'Site URL',
        description: 'Used for metadata and the sitemap.',
      }),
      resumeUrl: fields.text({
        label: 'Résumé path',
        description: 'Upload resume.pdf to public/ and put /resume.pdf here.',
      }),
      availableForWork: fields.checkbox({
        label: 'Show the "Available for work" badge',
        defaultValue: true,
      }),
      domains: fields.array(fields.text({ label: 'Area' }), {
        label: 'Expertise chips',
        description: 'Shown under the hero tagline. Five or six keeps the line tidy.',
        itemLabel: (props) => props.value || 'Area',
      }),
    },
  })

const socialsDef = (dir: string, tag: string) =>
  singleton({
    label: `Contact links${tag}`,
    path: `${dir}/socials`,
    format: { data: 'json' },
    schema: {
      items: fields.array(
        fields.object({
          label: fields.text({
            label: 'Label',
            description: 'Shown on the tile. Leave empty to use the platform’s own name.',
          }),
          href: fields.url({
            label: 'URL',
            description:
              'The full address — https://github.com/you, https://wa.me/905551234567, or mailto:you@example.com. A link with no address yet simply stays off the site.',
          }),
          icon: fields.select({
            label: 'Icon',
            description:
              'Automatic reads the icon off the address — github.com gets the GitHub mark, a mailto: gets an envelope. Only pick one by hand when the address does not give it away.',
            options: SOCIAL_ICONS,
            defaultValue: 'auto',
          }),
          visible: fields.checkbox({ label: 'Show', defaultValue: true }),
        }),
        {
          label: 'Links',
          description:
            'The links in the contact section, in this order. Drag to reorder, and add or remove a platform freely — each one draws its own icon and reads its handle out of the address. Whether they show as bare icons or as cards with names is set under Appearance.',
          // The URL is what distinguishes two rows on the same platform, so the
          // collapsed row shows it rather than just the label.
          itemLabel: (props) =>
            [props.fields.label.value || 'Link', props.fields.href.value]
              .filter(Boolean)
              .join(' · '),
        },
      ),
    },
  })

const aboutDef = (dir: string, tag: string) =>
  singleton({
    label: `About${tag}`,
    path: `${dir}/about`,
    format: { data: 'json' },
    schema: {
      photo: fields.image({
        label: 'Profile photo',
        directory: 'public',
        publicPath: '/',
      }),
      photoBackdrop: fields.select({
        label: 'Photo background',
        description:
          'What sits behind the portrait. All six are drawn from the site’s own palette, so each ' +
          'one follows the colour mode and the accent you picked.',
        options: [
          { label: 'Engineering grid', value: 'grid' },
          { label: 'Dot matrix', value: 'dots' },
          { label: 'Spotlight', value: 'spotlight' },
          { label: 'Studio sweep', value: 'studio' },
          { label: 'Sensor sweep (LiDAR)', value: 'sweep' },
          { label: 'None — no background', value: 'none' },
        ],
        defaultValue: 'grid',
      }),
      photoOnPhones: fields.checkbox({
        label: 'Show the photo on phones',
        description:
          'Untick to hide it on screens narrower than 640px, where it costs a screenful of ' +
          'scrolling before the bio. It still shows on tablets and desktops.',
        defaultValue: true,
      }),
      paragraphs: fields.array(fields.text({ label: 'Paragraph', multiline: true }), {
        label: 'Bio paragraphs',
        itemLabel: (props) => props.value.slice(0, 60) || 'Paragraph',
      }),
      stats: fields.array(
        fields.object({
          value: fields.text({
            label: 'Value',
            description: 'e.g. 8+, 24, 1.2k',
          }),
          label: fields.text({ label: 'Label' }),
        }),
        {
          label: 'Headline figures',
          description: 'Numbers count up when scrolled into view. Placeholders like X+ stay put.',
          itemLabel: (props) =>
            `${props.fields.value.value} ${props.fields.label.value}`.trim() || 'Stat',
        },
      ),
    },
  })

const contactDef = (dir: string, tag: string) =>
  singleton({
    label: `Contact${tag}`,
    path: `${dir}/contact`,
    format: { data: 'json' },
    schema: {
      headline: fields.text({
        label: 'Headline',
        description: 'The large line at the top of the contact section.',
      }),
      blurb: fields.text({
        label: 'Intro',
        description: 'A short paragraph under the headline — what you are open to.',
        multiline: true,
      }),
      responseTime: fields.text({
        label: 'Typical response time',
        description: 'e.g. Within a couple of days. Leave empty to hide the row.',
      }),
    },
  })

const skillsDef = (dir: string, tag: string) =>
  singleton({
    label: `Skills${tag}`,
    path: `${dir}/skills`,
    format: { data: 'json' },
    schema: {
      groups: fields.array(
        fields.object({
          title: fields.text({ label: 'Group' }),
          tone: fields.select({
            label: 'Colour',
            options: [...TONES],
            defaultValue: 'blue',
          }),
          visible: fields.checkbox({ label: 'Show', defaultValue: true }),
          items: fields.array(fields.text({ label: 'Skill' }), {
            label: 'Skills',
            itemLabel: (props) => props.value || 'Skill',
          }),
        }),
        {
          label: 'Groups',
          description: 'Drag to reorder.',
          itemLabel: (props) =>
            `${props.fields.title.value || 'Group'}${
              props.fields.visible.value ? '' : '  — hidden'
            }`,
        },
      ),
    },
  })

const experienceDef = (dir: string, tag: string) =>
  singleton({
    label: `Experience${tag}`,
    path: `${dir}/experience`,
    format: { data: 'json' },
    schema: {
      jobs: fields.array(
        fields.object({
          role: fields.text({ label: 'Role' }),
          company: fields.text({ label: 'Company' }),
          companyUrl: fields.url({ label: 'Company URL' }),
          period: fields.text({
            label: 'Period',
            description: 'e.g. 2023 — Present',
          }),
          description: fields.text({
            label: 'One-line summary',
            multiline: true,
          }),
          highlights: fields.array(fields.text({ label: 'Highlight', multiline: true }), {
            label: 'Highlights',
            itemLabel: (props) => props.value.slice(0, 60) || 'Highlight',
          }),
          visible: fields.checkbox({ label: 'Show', defaultValue: true }),
        }),
        {
          label: 'Roles, most recent first',
          itemLabel: (props) =>
            `${props.fields.role.value || 'Role'} · ${props.fields.company.value || ''}`,
        },
      ),
    },
  })

const educationDef = (dir: string, tag: string) =>
  singleton({
    label: `Education${tag}`,
    path: `${dir}/education`,
    format: { data: 'json' },
    schema: {
      items: fields.array(
        fields.object({
          degree: fields.text({ label: 'Degree' }),
          school: fields.text({ label: 'Institution' }),
          period: fields.text({ label: 'Period' }),
          visible: fields.checkbox({ label: 'Show', defaultValue: true }),
        }),
        {
          label: 'Entries',
          itemLabel: (props) => props.fields.degree.value || 'Degree',
        },
      ),
    },
  })

const publicationsDef = (dir: string, tag: string) =>
  singleton({
    label: `Publications${tag}`,
    path: `${dir}/publications`,
    format: { data: 'json' },
    schema: {
      items: fields.array(
        fields.object({
          title: fields.text({ label: 'Title', multiline: true }),
          venue: fields.text({
            label: 'Venue',
            description: 'e.g. IEEE ICRA',
          }),
          year: fields.text({ label: 'Year' }),
          url: fields.url({ label: 'Link to the paper' }),
          visible: fields.checkbox({ label: 'Show', defaultValue: true }),
        }),
        {
          label: 'Papers',
          description: 'Empty this list and the Publications block disappears.',
          itemLabel: (props) => props.fields.title.value?.slice(0, 60) || 'Paper',
        },
      ),
    },
  })

const openSourceDef = (dir: string, tag: string) =>
  singleton({
    label: `Open source${tag}`,
    path: `${dir}/open-source`,
    format: { data: 'json' },
    schema: {
      intro: fields.text({ label: 'Intro paragraph', multiline: true }),
      items: fields.array(
        fields.object({
          project: fields.text({
            label: 'Project',
            description: 'e.g. Nav2',
          }),
          projectUrl: fields.url({ label: 'Project URL' }),
          what: fields.text({ label: 'What you contributed' }),
          detail: fields.text({ label: 'Detail', multiline: true }),
          status: fields.text({
            label: 'Status',
            description: 'e.g. Merged · 2025',
          }),
          prUrl: fields.url({ label: 'Pull request URL' }),
          tone: fields.select({
            label: 'Colour',
            options: [...TONES],
            defaultValue: 'blue',
          }),
          tags: fields.array(fields.text({ label: 'Tag' }), {
            label: 'Technologies',
            itemLabel: (props) => props.value || 'Tag',
          }),
          visible: fields.checkbox({ label: 'Show', defaultValue: true }),
        }),
        {
          label: 'Contributions',
          description:
            'Only list real, merged work — a broken PR link costs more than an empty section.',
          itemLabel: (props) =>
            `${props.fields.project.value || 'Project'} · ${props.fields.what.value || ''}`,
        },
      ),
    },
  })

/**
 * Arabic is a second site, not a translation layer.
 *
 * Every collection and singleton exists twice — once under content/ and once
 * under content/ar/ — from the same schema definition above, so the two trees
 * can never drift apart structurally while their contents stay completely
 * independent. The Arabic side can carry different projects, a different
 * section order and a different bio, and editing one never touches the other.
 */
export default config({
  storage: useGitHubStorage
    ? { kind: 'github', repo: { owner: 'Mohammed-Almsitef', name: 'portfolio' } }
    : { kind: 'local' },

  ui: {
    brand: { name: 'Mohammed Almsitef', mark: BrandMark },
    navigation: {
      'Page setup': ['sections', 'site', 'appearance'],
      // `socials` sits beside `contact` because that is the only section it
      // appears in — a link list two groups away is a link list you forget.
      Content: ['about', 'projects', 'openSource', 'skills', 'experience', 'contact', 'socials'],
      Credentials: ['education', 'publications'],
      'العربية · إعداد الصفحة': ['sectionsAr', 'siteAr'],
      'العربية · المحتوى': ['aboutAr', 'projectsAr', 'openSourceAr', 'skillsAr', 'experienceAr', 'contactAr', 'socialsAr'],
      'العربية · الروابط': ['educationAr', 'publicationsAr'],
      'العربية · النشر': ['arabicSettings'],
    },
  },

  collections: {
    projects: projectsDef('content', ''),
    projectsAr: projectsDef('content/ar', ' · عربي'),
  },

  singletons: {
    sections: sectionsDef('content', ''),
    site: siteDef('content', ''),
    socials: socialsDef('content', ''),
    about: aboutDef('content', ''),
    contact: contactDef('content', ''),
    skills: skillsDef('content', ''),
    experience: experienceDef('content', ''),
    education: educationDef('content', ''),
    publications: publicationsDef('content', ''),
    openSource: openSourceDef('content', ''),
    sectionsAr: sectionsDef('content/ar', ' · عربي'),
    siteAr: siteDef('content/ar', ' · عربي'),
    socialsAr: socialsDef('content/ar', ' · عربي'),
    aboutAr: aboutDef('content/ar', ' · عربي'),
    contactAr: contactDef('content/ar', ' · عربي'),
    skillsAr: skillsDef('content/ar', ' · عربي'),
    experienceAr: experienceDef('content/ar', ' · عربي'),
    educationAr: educationDef('content/ar', ' · عربي'),
    publicationsAr: publicationsDef('content/ar', ' · عربي'),
    openSourceAr: openSourceDef('content/ar', ' · عربي'),

    /**
     * Chrome rather than content, so it is deliberately NOT duplicated per
     * language: one theme and one set of margin decorations for both sites.
     */
    appearance: singleton({
      label: 'Appearance',
      path: 'content/appearance',
      format: { data: 'json' },
      schema: {
        defaultTheme: fields.select({
          label: 'Default colour mode',
          description:
            'What a first-time visitor sees. Once someone picks a mode themselves, their choice always wins.',
          options: [
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ],
          defaultValue: 'light',
        }),
        accent: fields.select({
          label: 'Accent colour',
          description:
            'The site-wide highlight — links, buttons, headings and the hero scan. Same palette the skill groups use.',
          options: [...TONES],
          defaultValue: 'blue',
        }),
        contactLinks: fields.select({
          label: 'Contact links',
          description:
            'How the links in the contact section are drawn. Icons only is compact and lets the ' +
            'marks do the work; cards also print the platform and your handle. The links ' +
            'themselves are edited under Contact links.',
          options: [
            { label: 'Icons only', value: 'icons' },
            { label: 'Cards with name and handle', value: 'tiles' },
          ],
          defaultValue: 'icons',
        }),
        decorShow: fields.checkbox({
          label: 'Show the robot shapes beside the content',
          description:
            'The isometric machines in the left and right margins. They only appear on windows wider than about 1720px, where there is a margin to sit in.',
          defaultValue: true,
        }),
        decorArrangement: fields.select({
          label: 'How the shapes are arranged',
          description:
            'Vary means each section gets a different one of the three layouts, so no two sections look alike.',
          options: [
            { label: 'Vary per section', value: 'auto' },
            { label: 'Always arrangement A', value: 'a' },
            { label: 'Always arrangement B', value: 'b' },
            { label: 'Always arrangement C', value: 'c' },
          ],
          defaultValue: 'auto',
        }),
        decorWeight: fields.select({
          label: 'Shape intensity',
          description: 'Full colour, or faded back so they sit further behind the page.',
          options: [
            { label: 'Full colour', value: 'vivid' },
            { label: 'Light / faded', value: 'soft' },
          ],
          defaultValue: 'vivid',
        }),
      },
    }),

    /** The single switch that publishes or hides the whole Arabic site. */
    arabicSettings: singleton({
      label: 'العربية — نشر الموقع',
      path: 'content/ar/settings',
      format: { data: 'json' },
      schema: {
        enabled: fields.checkbox({
          label: 'Publish the Arabic site',
          description:
            'Untick to hide /ar entirely — the language switch, hreflang tags and sitemap entries go with it.',
          defaultValue: false,
        }),
      },
    }),
  },
})
