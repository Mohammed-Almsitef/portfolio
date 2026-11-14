import { t, type Locale } from '@/lib/locale'
import { TAG_CHIP } from '@/lib/styles'

/**
 * The technologies under a project card, a contribution, or a case study.
 *
 * Tone-aware: an ancestor sets `--tone` and the chips pick it up, which is how
 * the same list carries a different colour on each card without knowing the
 * palette. Renders nothing at all for an empty list, so a project with no tags
 * leaves no gap where the row would be.
 */
export default function TagList({
  tags,
  locale,
  className = '',
  /** Brightens with the surrounding card's hover — only the project grid has one. */
  litByCardHover = false,
}: {
  tags: string[]
  locale: Locale
  className?: string
  litByCardHover?: boolean
}) {
  if (tags.length === 0) return null

  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label={t(locale, 'technologiesUsed')}>
      {tags.map((tag) => (
        <li
          key={tag}
          className={
            litByCardHover
              ? `${TAG_CHIP} transition-colors group-hover:border-[rgb(var(--tone)/0.55)]`
              : TAG_CHIP
          }
        >
          {tag}
        </li>
      ))}
    </ul>
  )
}
