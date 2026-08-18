# Portfolio — complete reference

Everything about how this site is built, what every field does, and how to change
things without breaking them. [README.md](README.md) is the quick start and the
day-to-day editing guide; this is the full picture underneath it.

- [The shape of it](#the-shape-of-it)
- [Every route](#every-route)
- [How content reaches the page](#how-content-reaches-the-page)
- [The content model, field by field](#the-content-model-field-by-field)
- [The section system](#the-section-system)
- [The design system](#the-design-system)
- [The monogram](#the-monogram)
- [Two languages, two sites](#two-languages-two-sites)
- [Being found](#being-found)
- [The manager and its password](#the-manager-and-its-password)
- [The generative visuals](#the-generative-visuals)
- [Recipes](#recipes)
- [Verifying a change](#verifying-a-change)
- [Known gaps](#known-gaps)

---

## The shape of it

Next.js 16 App Router, TypeScript, Tailwind CSS v4, Keystatic for editing, hosted
on Vercel. No database and no API: the content is JSON files in the repo, read at
build time, so a page is static HTML and editing is a commit.

```
app/                 routes, metadata, the favicon, the OG image
  keystatic/         the manager UI (a full-viewport app) + its theme
  manager/           login and account screens, and the sign-in actions
  api/keystatic/     the endpoint the manager writes through in local mode
components/          every piece of the page; one file per section
  manager/           the manager's brand mark
lib/
  content.ts         the only place that reads content — one loader per screen
  links.ts           what an outbound link's anchor gets
  locale.ts          the two locales, and the interface strings
  socials.ts         platform detection for contact links
  manager/           auth.ts, crypto.ts, store.ts — the password gate
content/             the English tree (JSON, edited by the manager)
content/ar/          the Arabic tree, same schema, independent contents
assets/brand/        the logo handoff: source SVGs and its spec
public/              photo, résumé, project media, the OG fallback
keystatic.config.ts  the schema — the single description of every field
proxy.ts             the password gate in front of the manager routes
```

Four scripts: `npm run dev`, `npm run build`, `npm start`, and `npm run typecheck`
(which runs `tsc` with `--noUnusedLocals --noUnusedParameters`, so dead code fails
the check rather than accumulating).

## Every route

| URL | Source | Notes |
| --- | --- | --- |
| `/` | `app/page.tsx` → `HomePage` | the English site |
| `/ar` | `app/ar/page.tsx` → `HomePage` | the Arabic site, same component |
| `/projects/[slug]` | `app/projects/[slug]/page.tsx` | one case study per visible project |
| `/ar/projects/[slug]` | `app/ar/projects/[slug]/page.tsx` | the Arabic case studies |
| `/sitemap.xml` | `app/sitemap.ts` | generated: every visible page, both languages, with alternates |
| `/robots.txt` | `app/robots.ts` | allows the site, disallows `/keystatic`, `/manager`, `/api/` |
| `/icon.svg` | `app/icon.svg` | the favicon — the monogram on an ink plate |
| `/opengraph-image` | `app/opengraph-image.tsx` | the 1200×630 link-preview card, generated |
| `/keystatic` | `app/keystatic/[[...params]]` | the manager, behind the password gate |
| `/manager/login`, `/manager/account` | `app/manager/*` | the gate's own screens |
| `/api/keystatic/*` | `app/api/keystatic/[...params]` | local-mode writes; gated |

A hidden project is absent everywhere at once: no card, a 404 page, and no sitemap
entry. That is one filter in `lib/content.ts`, not three.

## How content reaches the page

```
content/*.json  →  keystatic.config.ts  →  lib/content.ts  →  a component
   the values         the schema             the loader        presentation
```

Every step has one job, and the rule that keeps it honest is that a component
never reads the reader directly. Consequences worth knowing:

- **Hidden items are filtered in the loader.** `shown()` drops anything with
  `visible: false`, so a toggle cannot be honoured in one place and forgotten in
  another.
- **Values that pick a code path are validated, not cast.** The accent, the photo
  backdrop and the contact-link style are checked against their known sets and
  fall back to a default, because an unrecognised value would otherwise reach a
  CSS variable name or a lookup and render nothing.
- **Empty means absent.** No publications, no Publications heading. No photo, no
  reserved gap.
- **The Arabic tree is read through the same loaders** with a `locale` argument,
  so the two sites cannot drift apart structurally.

## The content model, field by field

### `site.json` — Site & contact

| Field | Drives |
| --- | --- |
| `name` | hero, nav, footer, page titles, the Person entity |
| `role` | under the name in the hero, and the `<title>` suffix |
| `tagline` | hero copy, and the meta description |
| `location` | the contact card, and the Person's address |
| `email` | the contact button and the copy button |
| `url` | `metadataBase`, canonical, sitemap, structured data |
| `resumeUrl` | the "Download full résumé" button — put `resume.pdf` in `public/` |
| `availableForWork` | the green pulsing badge in the nav |
| `alternateNames` | other spellings of your name; structured data only, never shown |
| `domains` | the expertise chips under the tagline, and `knowsAbout` |

### `about.json` — About

`photo` · `photoBackdrop` (grid / dots / spotlight / studio / sweep / none) ·
`photoOnPhones` · `paragraphs[]` · `stats[]` (`value`, `label` — numbers count up
when scrolled into view; placeholders like `X+` stay put).

### `projects/*.json` — one file per case study

`title` (also the slug) · `visible` · `order` · `year` · `featured` · `tone` ·
`visual` · `clip` · `image` · `summary` · `problem` · `solution` · `how[]` ·
`testing` · `results[]` · `lessons[]` · `role` · `tags[]` · `repoUrl` ·
`videoUrl` · `liveUrl`.

`order` sorts the grid; `featured` sorts to the front without changing footprint —
every card takes one column so each row always holds two. `clip` beats `image`
beats the generated `visual`.

### The rest

| File | Screen | Item fields |
| --- | --- | --- |
| `sections.json` | Sections | `key`, `label`, `visible` |
| `socials.json` | Contact links | `label`, `href`, `icon`, `visible` |
| `skills.json` | Skills | `title`, `tone`, `items[]`, `visible` |
| `experience.json` | Experience | `role`, `company`, `companyUrl`, `period`, `description`, `highlights[]`, `visible` |
| `education.json` | Education | `degree`, `school`, `period`, `visible` |
| `publications.json` | Publications | `title`, `venue`, `year`, `url`, `visible` |
| `open-source.json` | Open source | `intro` + items: `project`, `projectUrl`, `what`, `detail`, `status`, `prUrl`, `tone`, `tags[]`, `visible` |
| `contact.json` | Contact | `headline`, `blurb`, `responseTime` |
| `appearance.json` | Appearance | `defaultTheme`, `accent`, `contactLinks`, `decorShow`, `decorArrangement`, `decorWeight` |
| `ar/settings.json` | العربية — نشر الموقع | `enabled` — the one switch that publishes the Arabic site |

`appearance.json` and `ar/settings.json` are shared by both languages. Everything
else exists twice.

## The section system

Six sections are available. The registry in `components/HomePage.tsx` is the list:

| Key | Component | id | Ground | Contains |
| --- | --- | --- | --- | --- |
| `about` | `About` | `#about` | base | portrait, bio, headline figures |
| `projects` | `Projects` | `#projects` | raised | the card grid |
| `openSource` | `OpenSource` | `#open-source` | raised | contributions |
| `skills` | `Skills` | `#skills` | base | tone-coded groups |
| `experience` | `Experience` | `#experience` | raised | jobs, **education, publications**, résumé button |
| `contact` | `Contact` | `#contact` | base | email, location card, the links |

Order, heading and visibility come from `sections.json`. The alternating
base/raised grounds are what give the page chapters instead of one long column.

**Not sections, always present:** `StructuredData`, `ScrollProgress`, `Nav`,
**`Hero`** (always first, above every section), `Footer`, `BackToTop`. Hero is
fixed because a portfolio without an opening statement isn't a reorder away from
working.

⚠️ **A section key lives in three places that must agree:** the registry in
`HomePage.tsx`, the `SectionKey` type in `lib/content.ts`, and the dropdown
options in `keystatic.config.ts`. Nothing enforces it — a key in the schema with
no entry in the registry silently renders nothing.

## The design system

### Tokens and the three theme scopes

`app/globals.css` holds the palette. Light is the default, so a document with no
`data-theme` — no JS, a crawler, a printer — still renders legibly. The dark
values are declared once as `--d-*` and only *aliased* by two selectors, which is
what stops them drifting apart:

1. `:root` — the light literals
2. `:root[data-theme='dark']` — the explicit choice, written by the inline script
   in `app/layout.tsx` before first paint, so there is no flash
3. `@media (prefers-color-scheme: dark) { :root:not([data-theme]) }` — the
   fallback for when that script never ran

### Main colour vs supporting colours

The accent is the one main colour: links, buttons, headings, the hero scan. It is
chosen in Appearance and applied server-side via `data-accent` on `<html>`, so the
first paint is already correct.

The nine `--tone-*` values are for content that benefits from being told apart at
a glance — each skill group, each project, each contact platform carries one.
They are stored as space-separated RGB so they work at any alpha
(`rgb(var(--tone) / 0.15)`), and the light set is 700-weight while the dark set is
400-weight: **they are not interchangeable**, each clears 4.5:1 on its own ground.

### The card language

One shape recurs: `rounded-2xl`, `border-border`, `bg-surface`, a tone wash as a
background *image* over that colour, `--card-shadow`, and on hover a lift plus a
pointer-tracking glow from `Spotlight`. Project cards, contact links and the
About backdrop are all the same object with a different tone.

### `mono-label` — the rule worth knowing

Mono display type (section titles, eyebrows, kickers, the site name) is marked
`mono-label`. One rule in `globals.css` then undoes four things for Arabic: the
face, the forced LTR direction, the letter-spacing and the uppercase. Without it
Arabic set in the mono face falls back glyph by glyph, loses its joins, and gets
its words reversed.

The distinction is deliberate: mono that carries **prose** gets `mono-label`; mono
that carries an **identifier** (a year, a version, a tech tag) keeps the LTR
treatment, because that is correct for it.

### Responsive

Mobile-first, with `sm` (640px) and `lg` (1024px) doing most of the work. The
decisions that aren't obvious from the classes:

- the nav drops the site name below `sm` — the monogram carries the identity, and
  the words were pushing the availability dot off the bar
- the About portrait sits **after** the bio when stacked, and beside it from `lg`
- About prose is justified only from `md`; at phone width justification opens
  rivers of white space
- the email button's envelope mark is hidden below `sm`, which is exactly the
  width needed to keep the address and the copy button on one line
- contact links are icons in a centred wrapping row, or full cards, per Appearance

Nothing overflows the viewport at 320px in either language.

## The monogram

An M and an A at one stroke weight, where the A crosses the M and **knocks a
transparent gap out of it** — a mask on the M, never a background-coloured stroke,
so the mark works on any ground. `components/Logo.tsx` implements it from the
geometry in `assets/brand/`, which is the source of truth.

Three rules from the handoff are implemented, not decorative:

- the viewBox `-6 -34 208 172` is fixed; its padding holds the mitre spikes at the
  M's valley and the A's apex, and tightening it clips them
- small sizes step the weight up — 15/31 at 48px+, 17/33 at 32px, 18/34 at 24px,
  19/35 at 16px — and **below 24px the accent is dropped**, which is why the
  footer mark is monochrome and the nav's is not
- the two colourways are not interchangeable: `#1D4ED8` never on a dark ground,
  `#60A5FA` never on a light one

That last rule is why the colours live in `--logo-ink` / `--logo-accent` rather
than deriving from the accent token — the accent is user-selectable, and the mark
is not. The manager passes its colours in explicitly instead, because its
light/dark setting is its own.

## Two languages, two sites

Arabic is a **second site**, not a translation layer. Both trees are built from
the same schema, so they cannot drift structurally, but their contents are wholly
independent: different projects, a different section order, a different bio.

- `dir` sits on a wrapper inside `HomePage`, not on `<html>`, so adding Arabic did
  not require moving every English URL under a `[locale]` segment
- English keeps the bare path; `/en` would break every indexed URL for symmetry
- Noto Sans Arabic is subsetted to Arabic and applied via `[lang='ar']`, so
  English visitors never download it
- interface strings (not content) live in `lib/locale.ts` behind `t(locale, key)`
- `hreflang` alternates are emitted on both pages and in the sitemap
- the Arabic site only becomes visible — page, sitemap, `alternates` — once
  **العربية — نشر الموقع → enabled** is ticked. Pointing a crawler at a 404 is
  worse than not mentioning the translation.

⚠️ Anything under `public/` referenced by content exists in **both** trees. Rename
a file and grep both, or the Arabic page breaks while the English one looks fine.

## Being found

In the code:

- `generateMetadata` in `app/layout.tsx` — title template, description, canonical,
  `hreflang`, OpenGraph, Twitter card, keywords, and a Search Console token read
  from `GOOGLE_SITE_VERIFICATION` so it can be set without a code change
- `app/sitemap.ts` — every visible page in both languages, with alternates, so the
  two are treated as one page in two languages rather than duplicate content
- `app/robots.ts` — the sitemap pointer, and the manager disallowed
- `components/StructuredData.tsx` — a `Person`, a `WebSite` and a `ProfilePage` as
  JSON-LD, built from the CMS so the graph cannot contradict the page. The
  `sameAs` list is the important part: it is how a search engine merges the
  profiles that already rank for your name with this domain into one entity.
  Contact methods (WhatsApp, email) are excluded — they are not identities.
- `app/opengraph-image.tsx` — the generated 1200×630 preview card

Not in the code, and required: verifying the domain in Google Search Console,
submitting the sitemap, and linking to the site from the profiles you control.
A site nobody links to and nobody has submitted does not get indexed, however
good its markup is.

## The manager and its password

`/keystatic` is the editor. `proxy.ts` guards `/keystatic`, `/api/keystatic/*` and
`/manager/account`; `/manager/login` is deliberately outside it, or it would
redirect to itself.

**Storage.** `NEXT_PUBLIC_KEYSTATIC_STORAGE` decides: unset means local mode,
which writes `content/*.json` directly with no login; `github` means the browser
reads and writes through the GitHub API and a save is a commit that redeploys. It
must be `NEXT_PUBLIC_` because both the server route and the browser app import
the same config and have to resolve the same mode.

**The gate.** A password is stored as an scrypt hash in Redis, or comes from
`MANAGER_PASSWORD` in the environment. Sessions are HMAC-signed cookies —
`HttpOnly`, seven days, with the expiry inside the signed payload so it cannot be
extended by editing the cookie. Eight wrong attempts locks an address out for
fifteen minutes, counted in Redis when it is configured and in process when it is
not.

| State | Manager |
| --- | --- |
| No Redis and no `MANAGER_PASSWORD` | open |
| Redis set, no password saved, no `MANAGER_PASSWORD` | open |
| Password saved, or `MANAGER_PASSWORD` set | password asked |
| Password in force, no signing secret | **closed** |
| Removed from Account → Danger zone | open |
| Redis configured but unreachable | **closed** |

The two closed rows are deliberate: an outage must not quietly publish the
manager, and a password that cannot sign a session must not let anyone in. Both
mean an outage locks *you* out too. A **No password** badge shows whenever the
manager is unprotected.

`MANAGER_PASSWORD` works on its own, with no Redis. What it cannot do is be
*changed* from the Account screen, since there is nowhere to write the new hash.

**Appearance** (default theme, accent, contact-link style, gutter decorations) is
edited here too, and applies to both language sites.

## The generative visuals

Nothing here is an uploaded image; all of it is drawn from the theme tokens, so it
follows the colour mode and the accent.

| Component | What it is |
| --- | --- |
| `LidarBackdrop` | the hero: a simulated 3D LiDAR seen the way a robot sees it — a spinning multi-channel sensor, height-coloured returns, ground segmentation, tracked detections, global and local plans |
| `RobotField` | isometric machines in the page gutters, seeded by section id so each scatters differently but stably; controlled from Appearance and only visible past ~1720px |
| `ProjectVisual` | six generated cover arts (node graph, occupancy grid, detection boxes, joint traces, point cloud, retrieved chunks), used when a project has no clip or image |
| `AboutPhoto` | the six portrait backdrops |
| `Spotlight` | the pointer-tracking card glow; writes CSS variables directly rather than re-rendering per mousemove |

Anything seeded uses a seeded PRNG rather than `Math.random`, so the server and
the client render the same arrangement.

## Recipes

**Add a project.** Manager → Projects → Add. Fill title (the slug follows), year,
summary, and the case-study fields. Upload a clip or a cover image if you have
one; otherwise pick a `visual`. The card, the page, and the sitemap entry appear
together.

**Reorder or hide a section.** Sections → drag, or untick *Show*.

**Turn on the Open Source section.** It is built and wired but absent from
`sections.json`. Sections → Add → Open Source.

**Add a contact link.** Contact links → Add → paste the URL. The icon and the
handle are derived from the address; leave *Icon* on Automatic. Switch between
bare icons and full cards under Appearance → Contact links.

**Change the accent or the default theme.** Appearance. Everything accented
follows, including the generative art — the monogram deliberately does not.

**Swap the portrait.** About → Profile photo. A cut-out with a transparent
background works best, since the backdrops are drawn behind it. Pick a
*Photo background* to suit it.

**Rename something in `public/`.** Update the path in **both** `content/` and
`content/ar/`. The dev server's image cache will hide a broken path that a
production build answers 400 for.

**Publish the Arabic site.** Fill `content/ar/`, then tick العربية — نشر الموقع →
enabled. Until then it is unlinked and unlisted.

**Change the manager password.** Account → Change password. Needs Redis; with
`MANAGER_PASSWORD` alone, edit the variable and redeploy.

## Verifying a change

```bash
npm run typecheck    # tsc, and unused locals/params are errors
npm run build        # the real check — every page is prerendered
```

A build is a genuine test here: every page and both case-study trees are rendered
at build time, so a broken content reference or a bad loader fails the build
rather than a visitor's page load.

For anything visual, check both colour schemes, both languages (the Arabic side is
RTL, which mirrors layout and exposes any hardcoded left/right), and 320/390px —
most layout faults on this site have been at phone width or in RTL.

## Known gaps

- **Placeholder content.** `Company Name`, `Previous Company`, `First Company`,
  `University Name`, and the `XX% / YY% / Z ms` figures in the experience
  highlights. `University Name` now also reaches the structured data, so it tells
  a search engine where you studied.
- **Arabic prose** is largely still English in projects, skills and experience.
- **No project media.** All six projects use generated cover art; the upload
  pipeline is verified working.
- **`public/profile-og.png`** still shows the old portrait.
- **Sessions cannot be revoked.** Changing the password does not sign existing
  sessions out, and Sign out only clears the cookie on that device.
- **From the logo handoff**, the text lockups, the raster/`.ico` exports and the
  1200×630 brand OG image were not produced — they need a rasteriser and the
  Archivo font.
- **Section keys are declared in three places** with nothing enforcing agreement.

One thing this pass removed: `content/arabic.json`, a leftover from the first
Arabic attempt — a single file of translations keyed by slug, replaced by the
`content/ar/` tree in `dc8799b`. Nothing referenced it, it was not in the schema,
and it held a third spelling of the name (`محمد المصيطف`) that contradicted the
live one.
