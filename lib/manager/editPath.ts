/**
 * A link into the Keystatic editor that works in both storage modes.
 *
 * Locally (file storage) the editor lives at /keystatic/<path>. On the
 * deployed site (GitHub storage) Keystatic only routes branch-scoped paths —
 * /keystatic/branch/<branch>/<path> — and renders nothing for the bare form.
 */
const GITHUB = process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === 'github'
const BRANCH = process.env.NEXT_PUBLIC_KEYSTATIC_BRANCH || 'main'

export function editPath(path = ''): string {
  const p = path && !path.startsWith('/') ? `/${path}` : path
  return GITHUB ? `/keystatic/branch/${encodeURIComponent(BRANCH)}${p}` : `/keystatic${p}`
}
