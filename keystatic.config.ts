import { collection, config, fields, singleton } from '@keystatic/core'

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

export default config({
  storage: useGitHubStorage
    ? { kind: 'github', repo: { owner: 'Mohammed-Almsitef', name: 'portfolio' } }
    : { kind: 'local' },

  ui: {
    brand: { name: 'Portfolio' },
    navigation: {
      'Page setup': ['sections', 'site'],
      Content: ['about', 'projects', 'openSource', 'skills', 'experience'],
      'Credentials & links': ['education', 'publications', 'socials'],
    },
  },

  collections: {
    projects: collection({
      label: 'Projects',
      slugField: 'title',
      path: 'content/projects/*',
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
          description: 'Featured projects take a full-width card with the art beside the text.',
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
    }),
  },

  singletons: {
    sections: singleton({
      label: 'Sections',
      path: 'content/sections',
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
              description: 'The numbering (01, 02…) follows this list automatically.',
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
    }),

    site: singleton({
      label: 'Site & contact',
      path: 'content/site',
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
    }),

    socials: singleton({
      label: 'Social links',
      path: 'content/socials',
      format: { data: 'json' },
      schema: {
        items: fields.array(
          fields.object({
            label: fields.text({ label: 'Label' }),
            href: fields.url({ label: 'URL' }),
            visible: fields.checkbox({ label: 'Show', defaultValue: true }),
          }),
          {
            label: 'Links',
            itemLabel: (props) => props.fields.label.value || 'Link',
          },
        ),
      },
    }),

    about: singleton({
      label: 'About',
      path: 'content/about',
      format: { data: 'json' },
      schema: {
        photo: fields.image({
          label: 'Profile photo',
          directory: 'public',
          publicPath: '/',
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
    }),

    skills: singleton({
      label: 'Skills',
      path: 'content/skills',
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
    }),

    experience: singleton({
      label: 'Experience',
      path: 'content/experience',
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
    }),

    education: singleton({
      label: 'Education',
      path: 'content/education',
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
    }),

    publications: singleton({
      label: 'Publications',
      path: 'content/publications',
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
    }),

    openSource: singleton({
      label: 'Open source',
      path: 'content/open-source',
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
    }),
  },
})
