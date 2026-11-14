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

/** The colour pickers in the manager. Capitalised for display. */
export const TONE_OPTIONS = TONE_NAMES.map((value) => ({
  label: value[0].toUpperCase() + value.slice(1),
  value,
}))
