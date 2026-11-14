/**
 * A small, honest robotics simulation for the hero.
 *
 * Everything here is the real algorithm at toy scale, not an animation that
 * looks like one: a lidar raycast against a ground-truth floor plan, an
 * occupancy grid built from those rays, an inflated costmap, frontier-based
 * exploration, A* over the costmap and a pure-pursuit controller. The canvas
 * component only draws what this module computes.
 *
 * Units are grid cells (one cell = 10 cm) and seconds. Pure TypeScript with no
 * DOM access, so it can run ahead synchronously (reduced motion) or per frame.
 */

export const UNKNOWN = 0
export const FREE = 1
export const OCC = 2

/** Robot footprint radius, in cells. */
export const ROBOT_RADIUS = 1.8
/** Cells within this distance of an obstacle are lethal to the planner. */
const INFLATE_LETHAL = 3
/** Beyond lethal, cost decays to zero over this many more cells. */
const INFLATE_DECAY = 3.5
const LIDAR_RANGE = 26
const LIDAR_BEAMS = 240
const V_MAX = 7 // cells/s  (0.7 m/s)
const W_MAX = 2.4 // rad/s
const LOOKAHEAD = 3.2

export type Mode =
  | 'exploring'
  | 'navigating'
  | 'reached'
  | 'complete'
  | 'unreachable'
  | 'returning'
  | 'docked'

/** The kinds of place the robot can be dropped into. */
export type Layout = 'rooms' | 'maze' | 'warehouse'

export type Pt = { x: number; y: number }

export type Sim = {
  w: number
  h: number
  seed: number
  truth: Uint8Array
  truthFree: number
  map: Uint8Array
  cost: Uint8Array
  known: number
  /** Set whenever the map or costmap changed; the renderer clears it. */
  dirty: boolean
  pose: { x: number; y: number; th: number }
  path: Pt[]
  pathIdx: number
  goal: Pt | null
  userGoal: boolean
  mode: Mode
  modeSince: number
  scan: Float32Array
  trail: Pt[]
  time: number
  lastPlan: number
  /** Seconds the robot has wanted to move but could not. */
  layout: Layout
  /** The charging dock: where the robot started, and returns to when done. */
  dock: Pt & { th: number }
  stuckFor: number
  /** Seconds left in a back-away recovery, and its direction. */
  recover: number
  recDir: number
}

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ------------------------------------------------------------------ world */

/**
 * A floor plan by binary space partition: rooms split by walls, every wall
 * carrying a doorway, so every room is reachable from every other. Furniture
 * goes only in rooms large enough to keep a corridor around it.
 */
function makeTruth(w: number, h: number, seed: number) {
  const r = rng(seed)
  const t = new Uint8Array(w * h)
  const set = (x: number, y: number) => {
    if (x >= 0 && y >= 0 && x < w && y < h) t[y * w + x] = 1
  }
  for (let x = 0; x < w; x++) {
    set(x, 0)
    set(x, h - 1)
  }
  for (let y = 0; y < h; y++) {
    set(0, y)
    set(w - 1, y)
  }

  const MIN = 15
  const DOOR = 8
  const leaves: [number, number, number, number][] = []

  // Door cells already carved. A later wall must not end beside one, or its
  // inflation would close the doorway to the planner.
  const doors: [number, number][] = []
  const nearDoor = (x: number, y: number) =>
    doors.some(([dx, dy]) => Math.abs(dx - x) <= 6 && Math.abs(dy - y) <= 6)

  const split = (x0: number, y0: number, x1: number, y1: number, depth: number) => {
    const rw = x1 - x0
    const rh = y1 - y0
    const canV = rw >= MIN * 2
    const canH = rh >= MIN * 2
    if ((!canV && !canH) || depth > 3 || (depth > 1 && r() < 0.2)) {
      leaves.push([x0, y0, x1, y1])
      return
    }
    const vertical = canV && (!canH || rw / rh > 1.15 || (rw / rh > 0.85 && r() < 0.5))
    let at = -1
    for (let tries = 0; tries < 12 && at < 0; tries++) {
      const c = vertical
        ? x0 + MIN + Math.floor(r() * (rw - MIN * 2 + 1))
        : y0 + MIN + Math.floor(r() * (rh - MIN * 2 + 1))
      const ok = vertical
        ? !nearDoor(c, y0 - 1) && !nearDoor(c, y1)
        : !nearDoor(x0 - 1, c) && !nearDoor(x1, c)
      if (ok) at = c
    }
    if (at < 0) {
      leaves.push([x0, y0, x1, y1])
      return
    }
    if (vertical) {
      const door = y0 + 2 + Math.floor(r() * Math.max(1, rh - DOOR - 4))
      for (let y = y0; y < y1; y++) {
        if (y < door || y >= door + DOOR) set(at, y)
        else doors.push([at, y])
      }
      split(x0, y0, at, y1, depth + 1)
      split(at + 1, y0, x1, y1, depth + 1)
    } else {
      const door = x0 + 2 + Math.floor(r() * Math.max(1, rw - DOOR - 4))
      for (let x = x0; x < x1; x++) {
        if (x < door || x >= door + DOOR) set(x, at)
        else doors.push([x, at])
      }
      split(x0, y0, x1, at, depth + 1)
      split(x0, at + 1, x1, y1, depth + 1)
    }
  }
  split(1, 1, w - 1, h - 1, 0)

  const MARGIN = 8
  for (const [x0, y0, x1, y1] of leaves) {
    const iw = x1 - x0 - MARGIN * 2
    const ih = y1 - y0 - MARGIN * 2
    if (iw < 3 || ih < 3) continue
    const n = 1 + Math.floor(r() * 2)
    for (let k = 0; k < n; k++) {
      if (r() < 0.35) {
        // A pillar.
        const cx = x0 + MARGIN + r() * iw
        const cy = y0 + MARGIN + r() * ih
        const rad = 1.2 + r() * 0.9
        for (let y = Math.floor(cy - rad); y <= cy + rad; y++)
          for (let x = Math.floor(cx - rad); x <= cx + rad; x++)
            if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= rad * rad) set(x, y)
      } else {
        // A table, shelf or crate.
        const bw = Math.min(iw, 2 + Math.floor(r() * 5))
        const bh = Math.min(ih, 2 + Math.floor(r() * 4))
        const bx = x0 + MARGIN + Math.floor(r() * (iw - bw + 1))
        const by = y0 + MARGIN + Math.floor(r() * (ih - bh + 1))
        for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) set(x, y)
      }
    }
  }
  return { t, leaves }
}

/**
 * A braided maze filling the floor: a recursive-backtracker spanning tree on a
 * coarse grid, plus a few extra openings so there are loops to choose between.
 * Corridors are ~10 cells (1 m) wide, enough for the inflated robot.
 */
function makeMaze(w: number, h: number, seed: number) {
  const r = rng(seed ^ 0x51ed)
  const t = new Uint8Array(w * h)
  const cols = Math.max(2, Math.round((w - 1) / 12))
  const rows = Math.max(2, Math.round((h - 1) / 11))
  const px = (w - 1) / cols
  const py = (h - 1) / rows
  // right[c][r], down[c][r]: is that wall still standing?
  const right = Array.from({ length: cols }, () => Array(rows).fill(true))
  const down = Array.from({ length: cols }, () => Array(rows).fill(true))
  const seen = Array.from({ length: cols }, () => Array(rows).fill(false))
  const stack: [number, number][] = [[0, 0]]
  seen[0][0] = true
  while (stack.length) {
    const [c, rr] = stack[stack.length - 1]
    const nbrs = (
      [
        [c + 1, rr],
        [c - 1, rr],
        [c, rr + 1],
        [c, rr - 1],
      ] as [number, number][]
    ).filter(([a, b]) => a >= 0 && b >= 0 && a < cols && b < rows && !seen[a][b])
    if (!nbrs.length) {
      stack.pop()
      continue
    }
    const [nc, nr] = nbrs[Math.floor(r() * nbrs.length)]
    if (nc > c) right[c][rr] = false
    else if (nc < c) right[nc][rr] = false
    else if (nr > rr) down[c][rr] = false
    else down[c][nr] = false
    seen[nc][nr] = true
    stack.push([nc, nr])
  }
  // Braid: knock out some extra walls.
  for (let c = 0; c < cols; c++)
    for (let rr = 0; rr < rows; rr++) {
      if (c < cols - 1 && right[c][rr] && r() < 0.18) right[c][rr] = false
      if (rr < rows - 1 && down[c][rr] && r() < 0.18) down[c][rr] = false
    }
  const set = (x: number, y: number) => {
    if (x >= 0 && y >= 0 && x < w && y < h) t[y * w + x] = 1
  }
  for (let x = 0; x < w; x++) {
    set(x, 0)
    set(x, h - 1)
  }
  for (let y = 0; y < h; y++) {
    set(0, y)
    set(w - 1, y)
  }
  for (let c = 0; c < cols; c++)
    for (let rr = 0; rr < rows; rr++) {
      const x0 = Math.round(c * px)
      const x1 = Math.round((c + 1) * px)
      const y0 = Math.round(rr * py)
      const y1 = Math.round((rr + 1) * py)
      if (c < cols - 1 && right[c][rr]) for (let y = y0; y <= y1; y++) set(x1, y)
      if (rr < rows - 1 && down[c][rr]) for (let x = x0; x <= x1; x++) set(x, y1)
    }
  return t
}

/**
 * A small warehouse: rows of shelving with ~1 m aisles, a cross aisle, and a
 * few pallets in the open loading area.
 */
function makeWarehouse(w: number, h: number, seed: number) {
  const r = rng(seed ^ 0xa11e)
  const t = new Uint8Array(w * h)
  const set = (x: number, y: number) => {
    if (x >= 0 && y >= 0 && x < w && y < h) t[y * w + x] = 1
  }
  const box = (x0: number, y0: number, x1: number, y1: number) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y)
  }
  for (let x = 0; x < w; x++) {
    set(x, 0)
    set(x, h - 1)
  }
  for (let y = 0; y < h; y++) {
    set(0, y)
    set(w - 1, y)
  }
  // Shelving occupies the left ~70%; the right is an open loading area.
  const shelfEnd = Math.round(w * 0.68)
  const cross = 18 + Math.floor(r() * Math.max(1, shelfEnd - 40))
  for (let y = 10; y < h - 8; y += 11) {
    box(11, y, cross - 1, y + 1)
    box(cross + 10, y, shelfEnd, y + 1)
  }
  // Pallets in the loading area, kept off the walls.
  for (let k = 0; k < 3; k++) {
    const x = shelfEnd + 9 + Math.floor(r() * Math.max(1, w - shelfEnd - 20))
    const y = 8 + Math.floor(r() * Math.max(1, h - 20))
    box(x, y, x + 2 + Math.floor(r() * 2), y + 2 + Math.floor(r() * 2))
  }
  return t
}

function clearAround(truth: Uint8Array, w: number, x: number, y: number, rad: number) {
  for (let dy = -Math.ceil(rad); dy <= rad; dy++)
    for (let dx = -Math.ceil(rad); dx <= rad; dx++)
      if (truth[(Math.floor(y) + dy) * w + Math.floor(x) + dx]) return false
  return true
}

export function createSim(w: number, h: number, seed: number, layout: Layout = 'rooms'): Sim {
  const r = rng(seed ^ 0x9e3779b9)
  let t: Uint8Array
  let sx: number
  let sy: number
  if (layout === 'rooms') {
    const made = makeTruth(w, h, seed)
    t = made.t
    // Start in the largest room, somewhere with clearance.
    const room = made.leaves.reduce((a, b) =>
      (b[2] - b[0]) * (b[3] - b[1]) > (a[2] - a[0]) * (a[3] - a[1]) ? b : a,
    )
    sx = (room[0] + room[2]) / 2
    sy = (room[1] + room[3]) / 2
    for (let i = 0; i < 60 && !clearAround(t, w, sx, sy, 4); i++) {
      sx = room[0] + 4 + r() * (room[2] - room[0] - 8)
      sy = room[1] + 4 + r() * (room[3] - room[1] - 8)
    }
  } else {
    t = layout === 'maze' ? makeMaze(w, h, seed) : makeWarehouse(w, h, seed)
    // Maze: start in a corner cell. Warehouse: in the open loading area.
    const cx = layout === 'maze' ? 6 : w - 8
    const cy = layout === 'maze' ? 6 : h / 2
    sx = cx
    sy = cy
    for (let i = 0; i < 400 && !clearAround(t, w, sx, sy, 3.5); i++) {
      sx = Math.min(w - 5, Math.max(4, cx + (r() - 0.5) * (8 + i * 0.3)))
      sy = Math.min(h - 5, Math.max(4, cy + (r() - 0.5) * (8 + i * 0.3)))
    }
  }

  // Coverage is measured against free space the robot can actually reach.
  let truthFree = 0
  {
    const seen = new Uint8Array(w * h)
    const q = [Math.floor(sy) * w + Math.floor(sx)]
    seen[q[0]] = 1
    while (q.length) {
      const i = q.pop()!
      truthFree++
      const x = i % w
      for (const j of [i - 1, i + 1, i - w, i + w]) {
        const jx = j % w
        if (j < 0 || j >= w * h || Math.abs(jx - x) > 1 || seen[j] || t[j]) continue
        seen[j] = 1
        q.push(j)
      }
    }
  }

  const sim: Sim = {
    w,
    h,
    seed,
    truth: t,
    truthFree,
    map: new Uint8Array(w * h),
    cost: new Uint8Array(w * h),
    known: 0,
    dirty: true,
    pose: { x: sx, y: sy, th: r() * Math.PI * 2 },
    layout,
    dock: { x: sx, y: sy, th: 0 },
    path: [],
    pathIdx: 0,
    goal: null,
    userGoal: false,
    mode: 'exploring',
    modeSince: 0,
    scan: new Float32Array(LIDAR_BEAMS),
    trail: [],
    time: 0,
    lastPlan: -10,
    stuckFor: 0,
    recover: 0,
    recDir: 0,
  }
  senseAndMap(sim)
  return sim
}

/* ------------------------------------------------------- sensing, mapping */

function markOcc(s: Sim, cx: number, cy: number) {
  const i = cy * s.w + cx
  if (s.map[i] === OCC) return
  if (s.map[i] === FREE) s.known--
  s.map[i] = OCC
  s.dirty = true
  // Inflate into the costmap. Max-combined, so order never matters.
  const R = Math.ceil(INFLATE_LETHAL + INFLATE_DECAY)
  for (let dy = -R; dy <= R; dy++) {
    const y = cy + dy
    if (y < 0 || y >= s.h) continue
    for (let dx = -R; dx <= R; dx++) {
      const x = cx + dx
      if (x < 0 || x >= s.w) continue
      const d = Math.hypot(dx, dy)
      let v = 0
      if (d <= INFLATE_LETHAL) v = 255
      else if (d < INFLATE_LETHAL + INFLATE_DECAY)
        v = Math.round(120 * (1 - (d - INFLATE_LETHAL) / INFLATE_DECAY))
      const j = y * s.w + x
      if (v > s.cost[j]) s.cost[j] = v
    }
  }
}

/** One lidar sweep: raycast every beam with a grid DDA, and write the result. */
function senseAndMap(s: Sim) {
  const { x: ox, y: oy, th } = s.pose
  const { w, h, truth, map } = s
  for (let b = 0; b < LIDAR_BEAMS; b++) {
    const a = th + (b / LIDAR_BEAMS) * Math.PI * 2
    const dx = Math.cos(a)
    const dy = Math.sin(a)
    let cx = Math.floor(ox)
    let cy = Math.floor(oy)
    const stepX = dx > 0 ? 1 : -1
    const stepY = dy > 0 ? 1 : -1
    const tdx = Math.abs(1 / dx)
    const tdy = Math.abs(1 / dy)
    let tmx = (dx > 0 ? cx + 1 - ox : ox - cx) * tdx
    let tmy = (dy > 0 ? cy + 1 - oy : oy - cy) * tdy
    let dist = 0
    let hit = false
    while (dist < LIDAR_RANGE) {
      const i = cy * w + cx
      if (truth[i]) {
        hit = true
        break
      }
      if (map[i] === UNKNOWN) {
        map[i] = FREE
        s.known++
        s.dirty = true
      }
      if (tmx < tmy) {
        dist = tmx
        tmx += tdx
        cx += stepX
      } else {
        dist = tmy
        tmy += tdy
        cy += stepY
      }
      if (cx < 0 || cy < 0 || cx >= w || cy >= h) break
    }
    if (hit) markOcc(s, cx, cy)
    s.scan[b] = Math.min(dist, LIDAR_RANGE)
  }
}

export const coverage = (s: Sim) => Math.min(1, s.known / s.truthFree)

/* ---------------------------------------------------------------- planning */

const passable = (s: Sim, i: number) => s.map[i] !== OCC && s.cost[i] < 255

/** A* over the costmap, 8-connected. Unknown space is allowed, at a premium. */
export function plan(s: Sim, from: Pt, to: Pt): Pt[] | null {
  const { w, h } = s
  const sx = Math.floor(from.x)
  const sy = Math.floor(from.y)
  const gx = Math.floor(to.x)
  const gy = Math.floor(to.y)
  if (gx < 0 || gy < 0 || gx >= w || gy >= h) return null
  const goal = gy * w + gx
  if (!passable(s, goal)) return null

  const n = w * h
  const g = new Float32Array(n).fill(Infinity)
  const parent = new Int32Array(n).fill(-1)
  const closed = new Uint8Array(n)
  // Binary heap of [f, index].
  const heap: number[] = []
  const fs: number[] = []
  const push = (i: number, f: number) => {
    heap.push(i)
    fs.push(f)
    let k = heap.length - 1
    while (k > 0) {
      const p = (k - 1) >> 1
      if (fs[p] <= fs[k]) break
      ;[heap[p], heap[k]] = [heap[k], heap[p]]
      ;[fs[p], fs[k]] = [fs[k], fs[p]]
      k = p
    }
  }
  const pop = () => {
    const top = heap[0]
    const lastI = heap.pop()!
    const lastF = fs.pop()!
    if (heap.length) {
      heap[0] = lastI
      fs[0] = lastF
      let k = 0
      for (;;) {
        const l = k * 2 + 1
        const r = l + 1
        let m = k
        if (l < heap.length && fs[l] < fs[m]) m = l
        if (r < heap.length && fs[r] < fs[m]) m = r
        if (m === k) break
        ;[heap[m], heap[k]] = [heap[k], heap[m]]
        ;[fs[m], fs[k]] = [fs[k], fs[m]]
        k = m
      }
    }
    return top
  }
  const hx = (x: number, y: number) => {
    const dx = Math.abs(x - gx)
    const dy = Math.abs(y - gy)
    return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy)
  }

  const start = sy * w + sx
  g[start] = 0
  push(start, hx(sx, sy))
  const N8 = [
    [1, 0, 1],
    [-1, 0, 1],
    [0, 1, 1],
    [0, -1, 1],
    [1, 1, Math.SQRT2],
    [1, -1, Math.SQRT2],
    [-1, 1, Math.SQRT2],
    [-1, -1, Math.SQRT2],
  ]
  let found = false
  while (heap.length) {
    const i = pop()
    if (closed[i]) continue
    if (i === goal) {
      found = true
      break
    }
    closed[i] = 1
    const x = i % w
    const y = (i / w) | 0
    for (const [dx, dy, c] of N8) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
      const j = ny * w + nx
      // The robot's own cell is always enterable, even if a fresh obstacle
      // has just inflated over it, or it could never plan its way out.
      // Near the start, lethal (but not occupied) cells are allowed: a robot
      // that has drifted into the inflation zone must be able to plan out.
      const escape = s.map[j] !== OCC && Math.abs(nx - sx) <= 3 && Math.abs(ny - sy) <= 3
      if (closed[j] || (!passable(s, j) && !escape)) continue
      const step = c * (1 + s.cost[j] / 35 + (s.map[j] === UNKNOWN ? 0.6 : 0))
      const ng = g[i] + step
      if (ng < g[j]) {
        g[j] = ng
        parent[j] = i
        push(j, ng + hx(nx, ny))
      }
    }
  }
  if (!found) return null

  const cells: Pt[] = []
  for (let i = goal; i !== -1; i = parent[i]) cells.push({ x: (i % w) + 0.5, y: ((i / w) | 0) + 0.5 })
  cells.reverse()
  cells[0] = { x: from.x, y: from.y }

  // Light smoothing, so the robot follows a curve rather than a staircase.
  const p = cells.map((c) => ({ ...c }))
  for (let it = 0; it < 12; it++)
    for (let k = 1; k < p.length - 1; k++) {
      p[k].x += 0.35 * (p[k - 1].x + p[k + 1].x - 2 * p[k].x)
      p[k].y += 0.35 * (p[k - 1].y + p[k + 1].y - 2 * p[k].y)
    }
  return p
}

/**
 * The nearest reachable frontier — a known-free cell bordering enough unknown
 * space to be worth visiting — found by breadth-first search from the robot.
 */
function nearestFrontier(s: Sim): Pt | null {
  const { w, h, map } = s
  const start = Math.floor(s.pose.y) * w + Math.floor(s.pose.x)
  const seen = new Uint8Array(w * h)
  const depth = new Uint16Array(w * h)
  const q = new Int32Array(w * h)
  let qh = 0
  let qt = 0
  q[qt++] = start
  seen[start] = 1
  while (qh < qt) {
    const i = q[qh++]
    const x = i % w
    const y = (i / w) | 0
    if (depth[i] > 6 && map[i] === FREE) {
      let unknown = 0
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const xx = x + dx
          const yy = y + dy
          if (xx >= 0 && yy >= 0 && xx < w && yy < h && map[yy * w + xx] === UNKNOWN) unknown++
        }
      if (unknown >= 6) return { x: x + 0.5, y: y + 0.5 }
    }
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
      const j = ny * w + nx
      if (seen[j] || map[j] !== FREE || (s.cost[j] >= 255 && depth[i] >= 4)) continue
      seen[j] = 1
      depth[j] = depth[i] + 1
      q[qt++] = j
    }
  }
  return null
}

function setMode(s: Sim, m: Mode) {
  if (s.mode !== m) {
    s.mode = m
    s.modeSince = s.time
  }
}

/** A visitor's click. Returns whether a path was found. */
export function sendGoal(s: Sim, to: Pt): boolean {
  const p = plan(s, s.pose, to)
  if (!p) {
    setMode(s, 'unreachable')
    return false
  }
  s.goal = { x: to.x, y: to.y }
  s.path = p
  s.pathIdx = 0
  s.userGoal = true
  s.lastPlan = s.time
  setMode(s, 'navigating')
  return true
}

function pathBlocked(s: Sim) {
  for (let k = s.pathIdx; k < s.path.length; k++) {
    const i = Math.floor(s.path[k].y) * s.w + Math.floor(s.path[k].x)
    if (k > s.pathIdx + 1 && !passable(s, i)) return true
  }
  return false
}

/** How many footprint samples sit inside a wall at this position. */
function penetration(s: Sim, x: number, y: number) {
  let n = 0
  for (const R of [ROBOT_RADIUS * 0.9, ROBOT_RADIUS * 0.5])
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2
      const cx = Math.floor(x + Math.cos(a) * R)
      const cy = Math.floor(y + Math.sin(a) * R)
      if (s.truth[cy * s.w + cx]) n++
    }
  return n
}

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

/** Advance the world by `dt` seconds. */
export function step(s: Sim, dt: number) {
  s.time += dt

  // Choose what to do.
  if (s.mode === 'reached' || s.mode === 'unreachable') {
    if (s.time - s.modeSince > 1.4) setMode(s, 'exploring')
  }
  if (s.mode === 'exploring') {
    const goalSeen =
      s.goal &&
      (() => {
        // Retire a frontier goal once the space around it is known.
        const gx = Math.floor(s.goal.x)
        const gy = Math.floor(s.goal.y)
        let unknown = 0
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            const x = gx + dx
            const y = gy + dy
            if (x >= 0 && y >= 0 && x < s.w && y < s.h && s.map[y * s.w + x] === UNKNOWN) unknown++
          }
        return unknown < 3
      })()
    const needPlan =
      !s.goal || s.userGoal || goalSeen || s.pathIdx >= s.path.length - 2 || s.time - s.lastPlan > 4
    if (needPlan && s.time - s.lastPlan > 0.35) {
      s.userGoal = false
      const f = nearestFrontier(s)
      s.lastPlan = s.time
      if (!f) {
        // Map finished: drive back to the charging dock.
        const home = plan(s, s.pose, s.dock)
        if (home) {
          s.goal = { x: s.dock.x, y: s.dock.y }
          s.path = home
          s.pathIdx = 0
          setMode(s, 'returning')
        } else {
          s.goal = null
          s.path = []
          setMode(s, 'complete')
        }
      } else {
        const p = plan(s, s.pose, f)
        if (p) {
          s.goal = f
          s.path = p
          s.pathIdx = 0
        }
      }
    }
  }

  // Replan around obstacles discovered along the way.
  if (s.path.length && s.time - s.lastPlan > 0.25 && pathBlocked(s) && s.goal) {
    s.lastPlan = s.time
    const p = plan(s, s.pose, s.goal)
    if (p) {
      s.path = p
      s.pathIdx = 0
    } else if (s.userGoal) {
      s.path = []
      s.goal = null
      s.userGoal = false
      setMode(s, 'unreachable')
    } else {
      s.path = []
      s.goal = null
      if (s.mode === 'returning') setMode(s, 'complete')
    }
  }

  // Pure pursuit.
  let v = 0
  let om = 0
  const P = s.pose
  if (s.path.length > 1 && (s.mode === 'exploring' || s.mode === 'navigating' || s.mode === 'returning')) {
    // Advance the progress index to the closest point ahead.
    let best = s.pathIdx
    let bd = Infinity
    for (let k = s.pathIdx; k < Math.min(s.path.length, s.pathIdx + 12); k++) {
      const d = Math.hypot(s.path[k].x - P.x, s.path[k].y - P.y)
      if (d < bd) {
        bd = d
        best = k
      }
    }
    s.pathIdx = best
    let tgt = s.path[s.path.length - 1]
    for (let k = best; k < s.path.length; k++) {
      if (Math.hypot(s.path[k].x - P.x, s.path[k].y - P.y) >= LOOKAHEAD) {
        tgt = s.path[k]
        break
      }
    }
    const end = s.path[s.path.length - 1]
    const dGoal = Math.hypot(end.x - P.x, end.y - P.y)
    if (dGoal < 1.1) {
      s.path = []
      if (s.mode === 'navigating') {
        s.goal = null
        setMode(s, 'reached')
      } else if (s.mode === 'returning') {
        s.goal = null
        setMode(s, 'docked')
      }
    } else {
      const e = wrap(Math.atan2(tgt.y - P.y, tgt.x - P.x) - P.th)
      if (Math.abs(e) > 0.9) {
        om = Math.sign(e) * W_MAX
      } else {
        v = V_MAX * Math.max(0.15, 1 - Math.abs(e) / 1.1) * Math.min(1, dGoal / 3)
        om = Math.max(-W_MAX, Math.min(W_MAX, 3 * e))
      }
    }
  }

  // Recovery: back away from nearby obstacles, like Nav2's back-up behaviour.
  if (s.recover > 0) {
    s.recover -= dt
    const nx = P.x + Math.cos(s.recDir) * 2.5 * dt
    const ny = P.y + Math.sin(s.recDir) * 2.5 * dt
    const pn = penetration(s, nx, ny)
    if (pn === 0 || pn <= penetration(s, P.x, P.y)) {
      P.x = nx
      P.y = ny
    }
    if (s.recover <= 0) s.lastPlan = -10
    senseAndMap(s)
    return
  }

  const nth = P.th + om * dt
  const nx = P.x + v * Math.cos(nth) * dt
  const ny = P.y + v * Math.sin(nth) * dt
  P.th = wrap(nth)
  // A move that does not dig deeper into a wall is allowed, so a robot that
  // has grazed a corner can always back out of it.
  const pNew = penetration(s, nx, ny)
  if (pNew === 0 || pNew < penetration(s, P.x, P.y)) {
    P.x = nx
    P.y = ny
    s.stuckFor = Math.max(0, s.stuckFor - dt * 0.5)
  } else if (v > 0) {
    s.stuckFor += dt
  }
  if (s.stuckFor > 0.6) {
    // Escape direction: away from every known obstacle within reach.
    let ex = 0
    let ey = 0
    const cx = Math.floor(P.x)
    const cy = Math.floor(P.y)
    for (let dy = -5; dy <= 5; dy++)
      for (let dx = -5; dx <= 5; dx++) {
        const x = cx + dx
        const y = cy + dy
        if (x < 0 || y < 0 || x >= s.w || y >= s.h || s.map[y * s.w + x] !== OCC) continue
        const ox = P.x - (x + 0.5)
        const oy = P.y - (y + 0.5)
        const d2 = ox * ox + oy * oy + 0.01
        ex += ox / d2
        ey += oy / d2
      }
    s.recDir = Math.atan2(ey, ex)
    s.recover = 0.7
    s.stuckFor = 0
  }

  const last = s.trail[s.trail.length - 1]
  if (!last || Math.hypot(last.x - P.x, last.y - P.y) > 0.6) {
    s.trail.push({ x: P.x, y: P.y })
    if (s.trail.length > 400) s.trail.shift()
  }

  senseAndMap(s)
}

export { LIDAR_BEAMS, LIDAR_RANGE }
