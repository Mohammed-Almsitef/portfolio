/**
 * Shared bits of the isometric drawing maths.
 *
 * The hero backdrop and the margin decorations draw different scenes with
 * different projections, so most of their geometry is genuinely their own.
 * What they *do* share is this corner table, which had been written out three
 * times across the two files.
 */

/**
 * The four corners of a quad, in winding order.
 *
 * The order matters and is not arbitrary: callers walk it with `(i + 1) % 4`
 * to get each edge, so the pairs have to trace the rectangle's perimeter
 * rather than crossing it. Listed clockwise from the far/right corner.
 */
export const CORNER_SIGNS: readonly [number, number][] = [
  [1, 1],
  [1, -1],
  [-1, -1],
  [-1, 1],
]
