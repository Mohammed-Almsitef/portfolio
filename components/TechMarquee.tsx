import { getSkillGroups } from '@/lib/content'
import type { Locale } from '@/lib/locale'

/**
 * A slow ticker of the tools I work with, drawn from the Skills section so it
 * never claims anything the page doesn't. The list is rendered twice and the
 * track slides by half its width, which makes the loop seamless.
 */
export default async function TechMarquee({ locale = 'en' }: { locale?: Locale }) {
  const groups = await getSkillGroups(locale)
  // A few from each group, so the ticker spans the whole stack.
  const items = [...new Set(groups.flatMap((g) => g.items.slice(0, 4)))]
  if (items.length < 4) return null

  const track = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-3 pe-3">
      {items.map((item) => (
        <li
          key={item}
          className="glass whitespace-nowrap rounded-full px-4 py-1.5 text-sm text-body"
        >
          {item}
        </li>
      ))}
    </ul>
  )

  return (
    <div data-print-hide dir="ltr" className="marquee relative overflow-hidden py-6">
      <div className="marquee-track">
        {track(false)}
        {track(true)}
      </div>
    </div>
  )
}
