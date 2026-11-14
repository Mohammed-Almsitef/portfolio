/**
 * Class recipes used by more than one component.
 *
 * Only recipes that would be a *bug* if they drifted live here — the 36px
 * controls in the nav have to be the same size and chrome or the bar looks
 * ragged, and the technology chips have to match between the project card and
 * the case study that card links to. Anything used once stays inline at its
 * call site, where it is easier to read than an indirection.
 *
 * These are plain literals so Tailwind's scanner still sees every class.
 */

/** The 36px square controls in the nav bar: theme toggle, language switch. */
export const CONTROL_BUTTON =
  'btn-ghost flex size-9 items-center justify-center rounded-lg hover:text-text'

/**
 * The small uppercase label over a block. `mono-label` is what keeps this
 * readable in Arabic — see globals.css.
 */
export const EYEBROW = 'mono-label font-mono text-[0.6875rem] uppercase tracking-wider text-muted'

/**
 * A technology chip. Tone-aware: the element (or an ancestor) must set
 * `--tone`, which is how one chip list can carry a project's colour and the
 * next one another's without either knowing the palette.
 */
export const TAG_CHIP =
  'rounded-md border border-[rgb(var(--tone)/0.25)] bg-bg/50 px-2 py-1 font-mono text-xs text-muted'

/**
 * The heading over a sub-block — "Results", "Education". The colour is left to
 * the call site: the case study tints it with the project's tone, the
 * experience section uses the accent.
 */
export const BLOCK_HEADING = 'mono-label mb-5 font-mono text-xs uppercase tracking-[0.2em]'

/** The card ground shared by project cards, contribution cards and link tiles. */
export const CARD_SURFACE = 'glass rounded-2xl'

/** The accent wash laid over a card, keyed to whatever `--tone` is in scope. */
export const CARD_TONE_WASH = 'bg-[linear-gradient(135deg,rgb(var(--tone)/0.07),transparent_62%)]'
