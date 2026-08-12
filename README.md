# Portfolio

Personal portfolio site for a Robotics & AI engineer — covering robotics, machine learning, deep learning, computer vision, and NLP. Built with Next.js 16 (App Router), TypeScript, and Tailwind CSS v4.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Editing your content

Almost everything you need to change lives in one file: [`data/content.ts`](data/content.ts).

| What                                     | Where                                    |
| ---------------------------------------- | ---------------------------------------- |
| Name, role, tagline, email, site URL     | `site`                                   |
| Expertise chips under the headline       | `domains`                                |
| Social links (incl. Google Scholar)      | `socials`                                |
| Bio paragraphs and stats                 | `about`                                  |
| Projects + their case studies            | `projects`                               |
| Open-source contributions               | `contributions`                          |
| Skill categories                         | `skillGroups`                            |
| Job history and education                | `experience`, `education`                |
| Papers (ICRA/IROS etc.)                  | `publications`                           |

## Design system

Type is Inter (sans) and JetBrains Mono (mono), self-hosted at build time via `next/font/google` — no runtime request to Google.

### Theming

Light, dark, and system, switched by the control in the nav ([`components/ThemeToggle.tsx`](components/ThemeToggle.tsx)). The mechanics, in [`app/globals.css`](app/globals.css) and [`app/layout.tsx`](app/layout.tsx):

- **Light is the `@theme` default**, so a document with no `data-theme` — no JS, a crawler, a printer — still renders legibly.
- **An inline script in `<head>` resolves the theme before first paint** and stamps `data-theme` on `<html>`. It must stay in `<head>`, ahead of `<body>`: moved to the end of the body, the page would paint light and then snap to dark.
- **The server never renders `data-theme`.** Baking it into the HTML would serve a cached page with the wrong theme to the next visitor.
- **Dark colour literals live once** in `:root` as `--d-*` and are only *aliased* by the two dark selectors (explicit choice, and the `prefers-color-scheme` fallback for when the script never ran), so those two can't drift apart.

Three text tones, in both themes:

| Token | Use | Light | Dark |
| --- | --- | --- | --- |
| `--color-text` | Headings, key figures | 18.6:1 | 17.9:1 |
| `--color-body` | Running paragraphs | 9.3:1 | 9.5:1 |
| `--color-muted` | Labels, dates, metadata | 5.1:1 | 5.5:1 |
| `--color-accent` | Links, active states | 5.9:1 | 7.1:1 |

Running body copy at the muted tone is what makes a page feel washed out — keep paragraphs on `text-body` and reserve `text-muted` for secondary information. All eight values clear WCAG AA.

### Main colour vs supporting colours

The palette has two layers, and the distinction matters when you edit it:

**One main colour.** Blue carries the brand — links, the primary button, the active nav underline, section labels, focus rings. If you rebrand, this is what changes.

**Nine supporting tones**, used only where colour helps tell content apart: `--tone-blue`, `-violet`, `-purple`, `-cyan`, `-rose`, `-emerald`, `-amber`, `-teal`, `-lime`. Each skill group and each project carries one, assigned by a `tone` field in [`data/content.ts`](data/content.ts). Project tones echo their domain — the NLP project is rose like the NLP & LLMs skill group, the robotics one emerald, and so on.

`--tone-status` is deliberately separate (it aliases emerald) so recolouring a project can never change what "available for work" looks like.

Three rules if you extend this:

- **Tones are stored as space-separated RGB**, not hex, so they can be used at any alpha: `rgb(var(--tone) / 0.25)`.
- **A tone is applied by setting `--tone` in an inline style**, then referencing it from static classes (`text-[rgb(var(--tone))]`). The variable name is the only dynamic part — Tailwind never has to generate a class at runtime.
- **The light and dark sets are not interchangeable.** Light uses 700/800-weight values, dark uses 400-weight. Swapping either way drops below AA. All ten clear 4.5:1 against both the page and the card background in both themes — light bottoms out at 5.6:1, dark at 6.1:1 — and the tones suite checks every combination.

Colour is kept to line-work, rules, dots, and small labels — body text and tag labels stay neutral, which is what keeps nine hues from reading as a rainbow.

The accent is an engineering blue — the register robotics and AI research read as credible, where a teal or mint reads consumer-startup. It is deliberately **not** the same value in both themes: `#60a5fa` on dark, `#1d4ed8` on light. A blue light enough to carry a dark ground drops to roughly 2:1 on white, so light mode needs the deeper one.

Neither ground is pushed to an extreme. Dark sits at `#131720` rather than near-black and light at `#eef1f6` rather than white — both are easier to read for long stretches, and the softer light ground is what lets white cards register as raised panels instead of blending into the page. Changing either ground shifts every contrast ratio on the site, so re-run the tones suite after touching them.

Two helper classes carry the polish:

- `.text-gradient` — the headline treatment, ink cooling into the accent. It paints through `background-clip: text`, so the element's computed `color` is transparent; measure contrast from **rendered pixels**, not from CSS. The print block overrides it back to solid ink, otherwise it clips to nothing on paper.
- `.rule-fade` — the hairline beside section headings.
- `.section-rule` — the divider between sections, drawn by [`components/SectionRule.tsx`](components/SectionRule.tsx). A hairline that fades at both ends and *draws itself* across the viewport when scrolled into view, terminating in a short accent segment and a glowing node at the content gutter — an instrument trace rather than a border. The old flat `border-border` version measured 1.2:1 against the page and effectively disappeared; this reads at 1.6–1.8:1. The draw-in is gated on `.js`, so with no JavaScript the rule renders fully drawn instead of collapsed to `scaleX(0)`.
- `.animate-drift` — the hero scroll cue. Tailwind's `animate-bounce` is too springy for this register; the drift is a slow fade-and-settle.

Anything that can't inherit a CSS colour needs the theme fed to it explicitly. [`components/LidarBackdrop.tsx`](components/LidarBackdrop.tsx) reads the `--canvas-ink` triplet and re-reads it on a `data-theme` mutation and on OS-preference change; add new canvas work the same way rather than hardcoding a colour.

Sections are numbered (`01`–`06`) via the `index` prop on [`components/Section.tsx`](components/Section.tsx); renumber if you add or reorder sections.

## Responsive behaviour

Verified across 13 widths from 320px to 1920px — no horizontal overflow, nothing escaping the viewport, and every touch target at least 24px at all of them.

| Range | What changes |
| --- | --- |
| < 768px | Hamburger nav; project cards stack with art above the copy; hero backdrop at 20% opacity |
| 768–1023px | Featured cards go art-beside-copy; still hamburger nav; backdrop 45% |
| 1024–1279px | Inline nav links appear; skills move to three columns; backdrop 70% |
| ≥ 1280px | Content caps at `max-w-5xl` and centres; backdrop full strength |

Two constraints that are easy to break:

- **The hero backdrop must never sit under the copy.** It carries `.lidar-mask`, which intersects a radial mask with a left-to-right one so its left edge clears the headline and tagline, and its opacity climbs with the breakpoint. Measured by hiding the text and sampling pixels: 0–1% of the area behind the copy carries any ink. Geometric overlap is *not* a useful check here — the bounding box overlaps by 40% even when nothing is drawn there.
- **The inline nav waits until `lg` (1024px), not `md`.** With six links plus the brand and theme toggle, 768px left only 16px of slack — one longer name from a collision. Tablets in portrait use the hamburger.
- **Never write `opacity` inline on the backdrop wrapper.** The parallax fade writes to an inner node for exactly this reason; on the wrapper it silently overrides the responsive opacity classes, and the backdrop renders at full strength on phones.

Standalone links carry `.tap` (min 24px hit area, WCAG 2.5.8). Links sitting inline inside a heading carry `.tap-inline`, which adds vertical padding — on an inline element that grows the hit box without changing the line box, so the text does not shift.

`next/font` downloads Inter and JetBrains Mono at **build** time. If that download fails (offline, proxy, or a transient outage) Next silently falls back to system fonts — check the build log for `Failed to download`.

The Open Graph route supplies its fonts explicitly from `assets/fonts/` rather than relying on the renderer's default, so the card always renders in Inter and never depends on a network fetch.

**Known dev-server quirk:** `/opengraph-image` renders correctly on a freshly started dev server and in production (`next build && next start`), but starts returning a 500 with `Input buffer contains unsupported image format` after a few hot reloads. It is a Turbopack dev-mode issue, not a fault in the route — restart the dev server to preview the card again. The production build prerenders it fine.

## One fact, one place

Every piece of information appears exactly once on the page. When adding something, check this table first rather than repeating it somewhere convenient:

| Fact | Its only home |
| --- | --- |
| Name, role, tagline | Hero |
| Availability status | Hero badge |
| Expertise areas (`domains`) | Hero chips |
| Profile photo, bio, headline stats | About |
| Résumé download | End of Experience — where the reader has just finished the work history |
| Email, social links, location, response time | Contact |
| Name + copyright | Footer |

The footer deliberately does **not** restate role, location or the social links, and the contact section does not restate availability or focus areas. `site.role` and `domains` do appear again in `app/layout.tsx` and the Open Graph card, but those are separate surfaces (browser tab, link preview) rather than repetition on the page itself.

## Behaviour worth knowing

| Component | What it does |
| --- | --- |
| [`components/LidarBackdrop.tsx`](components/LidarBackdrop.tsx) | Hero backdrop: a sweeping beam raycast against a closed floor plan, accumulating a fading point cloud. Renders one static frame under `prefers-reduced-motion`. |
| [`components/Reveal.tsx`](components/Reveal.tsx) | IntersectionObserver scroll reveal. |
| [`components/Nav.tsx`](components/Nav.tsx) | Scroll-spy nav, animated hamburger, Escape-to-close. |
| [`components/ScrollProgress.tsx`](components/ScrollProgress.tsx) | Reading-progress bar. |
| [`components/BackToTop.tsx`](components/BackToTop.tsx) | Appears past one viewport; leaves the tab order while hidden. |
| [`components/ThemeToggle.tsx`](components/ThemeToggle.tsx) | Light / system / dark. Persists to `localStorage`, and keeps following the OS while on system. |
| [`components/ProjectVisual.tsx`](components/ProjectVisual.tsx) | Generated cover art per project — six shapes echoing what each one does. |
| [`components/Spotlight.tsx`](components/Spotlight.tsx) | Card highlight that tracks the pointer, written to CSS vars and coalesced to one rAF. |
| [`components/CountUp.tsx`](components/CountUp.tsx) | Stat counter that animates when scrolled into view. |
| [`app/opengraph-image.tsx`](app/opengraph-image.tsx) | 1200×630 link preview, generated at build from `site`, `domains`, and the profile photo. |

Three things to preserve if you refactor:

- **The reveal's hidden state is gated on the `.js` class** set by the inline script in [`app/layout.tsx`](app/layout.tsx). That gate is deliberate: it keys off script *execution*, so if JS is disabled or the bundle fails to load, the page renders visible rather than blank. Don't swap it for `@media (scripting: enabled)`, which only reports browser capability and would leave a blank page when the bundle fails.
- **The scroll-spy tracks a live set of in-band sections**, not one entry at a time. Reacting per-entry leaves the last-matched nav item highlighted when you scroll back up to the hero, where no section qualifies.
- **`:focus-visible` is styled globally**, not per component, so a control added later cannot ship without a keyboard focus ring.

## How projects are documented

Each project has its own page at `/projects/<slug>`, because a card has nowhere near enough room for the story a reader actually needs. The `Project` type follows the structure recruiters look for, and every field maps to a heading on that page:

| Field | Heading | What goes in it |
| --- | --- | --- |
| `summary` | — | One or two lines for the card |
| `problem` | The problem | The real-world challenge — the "why" |
| `solution` | What I built | The "what" |
| `how` | How it works | The "how": be specific about languages, frameworks, sensors, infrastructure |
| `testing` | How it was tested | Optional. Unit tests, HIL rigs, CI — evidence the code is reliable |
| `results` | Results | The proof. Numbers, not adjectives |
| `lessons` | What I learned | What went wrong and what you'd do differently |
| `role` | My role | Optional. Your specific contribution on a team project |

`videoUrl` is **embedded** on the case-study page, not linked out — a 30–60 second clip of the thing running is worth more than any amount of prose. Until you add one, the slot renders as a labelled placeholder telling you where to put it, rather than a broken player.

Open-source work lives in its own `contributions` array and its own section, deliberately separate from personal projects: it demonstrates something different — reading unfamiliar code, working to another project's standards, and getting a change through review.

The case studies are in the sitemap and carry their own `<title>` and Open Graph metadata, so an individual project can be shared as its own link.

## Project cover art

Every project card carries a visual. Until you have real screenshots, each one renders generated art matched to what the project does — `graph`, `occupancy`, `detect`, `gait`, `cloud`, or `layers`, set by the `visual` field.

Two rules if you touch [`ProjectVisual.tsx`](components/ProjectVisual.tsx):

- **Never use `Math.random()` in it.** The shapes come from a seeded PRNG so server and client render identical markup; real randomness would be a hydration mismatch on every load.
- It's decorative, so it carries `aria-hidden` and `data-print-hide` — it should never reach a screen reader or a printer.

**To use a real screenshot or GIF instead**, drop the file in `public/` and add `image: '/projects/whatever.png'` to that project. The generated art steps aside automatically. This is the single highest-value upgrade left on the page — real footage of a robot running, or a model's output, beats any generated placeholder.

Content notes:

- The six `projects` deliberately span the whole range — LLM grounding, robot autonomy, edge CV, deep RL, visual SLAM, and RAG — so a reader sees breadth without having to read the skills list.
- Each project accepts an optional `videoUrl`; a clip of a robot actually running, or a model working live, is the single most persuasive thing on the page. It renders as a "Watch demo ↗" link.
- The `publications` section auto-hides if you empty the array.
- Placeholder metrics are written as `X`, `Y`, `N`, `XX%` on purpose. Replace them with real numbers — quantified results ("lifted obstacle recall from 82% to 96% under a 30 ms budget") are what separate this from a list of technologies.

Other things to swap in:

- **Profile photo** — `public/profile.jpg` (841×1264) is rendered by [`components/About.tsx`](components/About.tsx) at its native 2:3 ratio, so nothing is cropped. `public/profile-og.png` is a 320px copy embedded into the link-preview card; regenerate both from the same source if you swap the photo.
- **Résumé** — drop `resume.pdf` in `public/` (path is set by `site.resumeUrl`).
- **Colors** — the palette is defined as CSS variables in [`app/globals.css`](app/globals.css): light values under `@theme`, dark under the `--d-*` literals. To rebrand, change `--color-accent` *and* `--d-accent` — and re-check contrast, since a hue that works on one ground rarely works on both.
- **Print** — `@media print` in `globals.css` flips the page to black-on-white and drops the chrome, so Ctrl-P produces a readable one-pager. Add `data-print-hide` to anything else that shouldn't print.

## Deploy

Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new). No configuration needed.

Before deploying, set `site.url` in `data/content.ts` to your real domain so metadata, Open Graph tags, and the sitemap are correct.
