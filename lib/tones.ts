/**
 * The supporting palette, in one place.
 *
 * These nine names are load-bearing in three separate ways: they are a
 * TypeScript union, a runtime list to validate a CMS value against, and the
 * options in the manager's colour pickers. Each of those used to spell the
 * list out again, so adding a tenth colour meant remembering four files.
 *
 * The main accent is *not* one of these — see `--color-accent` in globals.css.
 * These are only for telling content apart: a skill group, a project, a
 * contribution, a contact platform.
 */
export const TONE_NAMES = [
  'blue',
  'violet',
  'purple',
  'cyan',
  'rose',
  'emerald',
  'amber',
  'teal',
  'lime',
] as const

export type Tone = (typeof TONE_NAMES)[number]

/** True for a value that names a tone — for validating what the CMS wrote. */
export function isTone(value: unknown): value is Tone {
  return TONE_NAMES.includes(value as Tone)
}

/**
 * The colour pickers in the manager, named for what the course palette
 * actually shows (globals.css folds the nine names onto four deck colours).
 * The four main ones come first; the rest are kept so older content still
 * validates, and say which colour they render as.
 */
const SHOWN_AS: Record<Tone, string> = {
  blue: 'Slate',
  amber: 'Gold',
  teal: 'Teal',
  rose: 'Orange',
  violet: 'Gold (alt)',
  purple: 'Gold (alt 2)',
  cyan: 'Teal (alt)',
  emerald: 'Teal (alt 2)',
  lime: 'Teal (alt 3)',
}
const PICKER_ORDER: Tone[] = ['blue', 'amber', 'teal', 'rose', 'violet', 'purple', 'cyan', 'emerald', 'lime']
export const TONE_OPTIONS = PICKER_ORDER.map((value) => ({ label: SHOWN_AS[value], value }))
