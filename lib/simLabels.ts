import type { SlamLabels } from '@/components/SlamViewport'
import { t, type Locale } from './locale'

/** The simulation's interface text, shared by the hero and the demo page. */
export function simLabels(locale: Locale): SlamLabels {
  return {
    title: t(locale, 'simTitle'),
    hint: t(locale, 'simHint'),
    hintDrag: t(locale, 'simHintDrag'),
    aria: t(locale, 'simAria'),
    newMap: t(locale, 'newMap'),
    map: t(locale, 'mapLabel'),
    modes: {
      exploring: t(locale, 'modeExploring'),
      navigating: t(locale, 'modeNavigating'),
      reached: t(locale, 'modeReached'),
      complete: t(locale, 'modeComplete'),
      unreachable: t(locale, 'modeUnreachable'),
      returning: t(locale, 'modeReturning'),
      docked: t(locale, 'modeDocked'),
    },
    layouts: {
      rooms: t(locale, 'layoutRooms'),
      maze: t(locale, 'layoutMaze'),
      warehouse: t(locale, 'layoutWarehouse'),
    },
    scenario: t(locale, 'scenario'),
  }
}
