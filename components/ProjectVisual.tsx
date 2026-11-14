/**
 * Generated cover art for a project card.
 *
 * Every shape is derived from a seeded PRNG rather than Math.random, so the
 * server and client render byte-identical markup — a random layout here would
 * be a hydration mismatch on every load.
 *
 * These are placeholders with intent: each `kind` echoes what the project
 * actually does, so the grid reads as designed rather than empty until real
 * screenshots go in via a project's `image` field.
 */
export type VisualKind =
  | 'graph'
  | 'occupancy'
  | 'detect'
  | 'gait'
  | 'cloud'
  | 'layers'
  | 'fleet'
  | 'gamepad'
  | 'dock'
  | 'pipeline'

function seeded(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const W = 400
const H = 225

function Grid() {
  const lines = []
  for (let x = 0; x <= W; x += 25) lines.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={H} />)
  for (let y = 0; y <= H; y += 25) lines.push(<line key={`h${y}`} x1={0} y1={y} x2={W} y2={y} />)
  return (
    <g stroke="currentColor" strokeWidth="0.5" opacity="0.12">
      {lines}
    </g>
  )
}

/** Layered node graph — language grounded into structure. */
function Graph() {
  const r = seeded(11)
  const layers = [3, 5, 4, 2]
  const nodes: { x: number; y: number }[][] = layers.map((count, li) => {
    const x = 55 + li * 97
    return Array.from({ length: count }, (_, i) => ({
      x,
      y: (H / (count + 1)) * (i + 1) + (r() - 0.5) * 14,
    }))
  })

  const edges: React.ReactNode[] = []
  for (let li = 0; li < nodes.length - 1; li++) {
    nodes[li].forEach((a, ai) => {
      nodes[li + 1].forEach((b, bi) => {
        if (r() > 0.45) return
        edges.push(
          <line
            key={`${li}-${ai}-${bi}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            opacity={0.18 + r() * 0.3}
          />,
        )
      })
    })
  }

  return (
    <g stroke="currentColor" fill="none">
      <g strokeWidth="0.9">{edges}</g>
      {nodes.flat().map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={3.2} fill="currentColor" opacity={0.85} />
      ))}
    </g>
  )
}

/** Occupancy grid with a planned route through it. */
function Occupancy() {
  const r = seeded(29)
  const cols = 20
  const rows = 11
  const cw = W / cols
  const ch = H / rows

  const blocked = new Set<number>()
  for (let i = 0; i < 46; i++) blocked.add(Math.floor(r() * cols * rows))

  const path: [number, number][] = []
  let cy = 8
  for (let cx = 1; cx < cols - 1; cx++) {
    if (r() > 0.62) cy += r() > 0.5 ? -1 : 1
    cy = Math.max(1, Math.min(rows - 2, cy))
    path.push([cx * cw + cw / 2, cy * ch + ch / 2])
  }

  return (
    <g>
      <g fill="currentColor" opacity="0.22">
        {[...blocked].map((idx) => (
          <rect
            key={idx}
            x={(idx % cols) * cw + 1}
            y={Math.floor(idx / cols) * ch + 1}
            width={cw - 2}
            height={ch - 2}
            rx="1.5"
          />
        ))}
      </g>
      <polyline
        points={path.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
      <circle cx={path[0][0]} cy={path[0][1]} r="4.5" fill="currentColor" />
      <circle
        cx={path[path.length - 1][0]}
        cy={path[path.length - 1][1]}
        r="4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </g>
  )
}

/** Detection boxes with corner ticks. */
function Detect() {
  // Few and large: these strips are short, so many small boxes read as noise.
  const boxes = [
    { x: 34, y: 34, w: 132, h: 116, o: 0.9 },
    { x: 196, y: 64, w: 104, h: 96, o: 0.62 },
    { x: 320, y: 28, w: 78, h: 150, o: 0.4 },
  ]
  const tick = 17
  return (
    <g stroke="currentColor" fill="none" strokeLinecap="round">
      {boxes.map((b, i) => (
        <g key={i} opacity={b.o}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="3" strokeWidth="1.1" opacity="0.45" />
          <g strokeWidth="3">
            <path d={`M${b.x} ${b.y + tick}V${b.y}h${tick}`} />
            <path d={`M${b.x + b.w - tick} ${b.y}h${tick}v${tick}`} />
            <path d={`M${b.x + b.w} ${b.y + b.h - tick}V${b.y + b.h}h${-tick}`} />
            <path d={`M${b.x + tick} ${b.y + b.h}h${-tick}v${-tick}`} />
          </g>
        </g>
      ))}
    </g>
  )
}

/** Phase-shifted joint traces. */
function Gait() {
  const traces = [0, 1, 2, 3].map((i) => {
    const phase = i * 1.1
    const amp = 26 - i * 3
    const mid = 42 + i * 47
    const pts: string[] = []
    for (let x = 0; x <= W; x += 5) {
      const t = (x / W) * Math.PI * 4 + phase
      pts.push(`${x},${(mid + Math.sin(t) * amp + Math.sin(t * 2.3) * amp * 0.22).toFixed(1)}`)
    }
    return { pts: pts.join(' '), opacity: 0.9 - i * 0.17 }
  })

  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      {traces.map((t, i) => (
        <polyline key={i} points={t.pts} opacity={t.opacity} />
      ))}
    </g>
  )
}

/** Point cloud swept from a sensor origin. */
function Cloud() {
  const r = seeded(73)
  const ox = 78
  const oy = H / 2 + 14
  const pts: { x: number; y: number }[] = []
  const rays: React.ReactNode[] = []

  for (let i = 0; i < 132; i++) {
    const a = -0.85 + (i / 132) * 1.7
    const d = 120 + Math.sin(i * 0.21) * 46 + r() * 26
    const x = ox + Math.cos(a) * d
    const y = oy + Math.sin(a) * d
    if (x > W - 6 || y < 6 || y > H - 6) continue
    pts.push({ x, y })
    if (i % 16 === 0) {
      rays.push(<line key={i} x1={ox} y1={oy} x2={x} y2={y} opacity="0.16" />)
    }
  }

  return (
    <g>
      <g stroke="currentColor" strokeWidth="0.8">
        {rays}
      </g>
      <g fill="currentColor">
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" opacity={0.45 + (i / pts.length) * 0.5} />
        ))}
      </g>
      <circle cx={ox} cy={oy} r="4.5" fill="currentColor" />
      <circle
        cx={ox}
        cy={oy}
        r="11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
    </g>
  )
}

/** Retrieved chunks converging on an answer. */
function Layers() {
  const r = seeded(97)
  const rows = 7
  const bands = Array.from({ length: rows }, (_, i) => ({
    y: 24 + i * 26,
    w: 90 + r() * 110,
    hit: i === 1 || i === 3 || i === 5,
  }))
  const nodeX = 322
  const nodeY = H / 2

  return (
    <g>
      {bands.map((b, i) => (
        <g key={i}>
          <rect
            x={34}
            y={b.y}
            width={b.w}
            height={11}
            rx="3"
            fill="currentColor"
            opacity={b.hit ? 0.62 : 0.16}
          />
          {b.hit && (
            <line
              x1={34 + b.w + 6}
              y1={b.y + 5.5}
              x2={nodeX - 12}
              y2={nodeY}
              stroke="currentColor"
              strokeWidth="1.1"
              opacity="0.4"
            />
          )}
        </g>
      ))}
      <circle cx={nodeX} cy={nodeY} r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx={nodeX} cy={nodeY} r="3.5" fill="currentColor" />
    </g>
  )
}

/** One release, layered config, fanned out to robots of different models. */
function Fleet() {
  const stack = [
    { y: 78, label: 'robot', o: 0.85 },
    { y: 104, label: 'model', o: 0.55 },
    { y: 130, label: 'defaults', o: 0.3 },
  ]
  const robots = [
    { x: 300, y: 64, shape: 'circle' },
    { x: 330, y: 114, shape: 'square' },
    { x: 300, y: 164, shape: 'circle' },
    { x: 250, y: 114, shape: 'hex' },
  ]
  return (
    <g>
      {stack.map((l) => (
        <g key={l.label}>
          <rect x={60} y={l.y} width={110} height={22} rx={4} fill="currentColor" opacity={l.o * 0.35} />
          <rect x={60} y={l.y} width={110} height={22} rx={4} fill="none" stroke="currentColor" strokeWidth="1" opacity={l.o} />
          <text x={72} y={l.y + 15} fontSize="10" fontFamily="ui-monospace, monospace" fill="currentColor" opacity={0.9}>
            {l.label}
          </text>
        </g>
      ))}
      <text x={60} y={70} fontSize="9" fontFamily="ui-monospace, monospace" fill="currentColor" opacity={0.6}>
        swb_robot v2.x · apt
      </text>
      {robots.map((r, i) => (
        <g key={i}>
          <path
            d={`M170 ${100 + i * 3} C 210 ${100 + i * 3}, ${r.x - 40} ${r.y}, ${r.x - 14} ${r.y}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="3 4"
            opacity="0.5"
          />
          {r.shape === 'circle' && <circle cx={r.x} cy={r.y} r={12} fill="none" stroke="currentColor" strokeWidth="2" />}
          {r.shape === 'square' && (
            <rect x={r.x - 11} y={r.y - 11} width={22} height={22} rx={4} fill="none" stroke="currentColor" strokeWidth="2" />
          )}
          {r.shape === 'hex' && (
            <polygon
              points={Array.from({ length: 6 }, (_, k) => {
                const a = (Math.PI / 3) * k
                return `${r.x + 12 * Math.cos(a)},${r.y + 12 * Math.sin(a)}`
              }).join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          )}
          <line x1={r.x} y1={r.y} x2={r.x + 9} y2={r.y} stroke="currentColor" strokeWidth="2" />
          <circle cx={r.x} cy={r.y} r={2.5} fill="currentColor" />
        </g>
      ))}
    </g>
  )
}

/** A DualShock-style controller driving a robot, with its velocity vector. */
function Gamepad() {
  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M70 92 C 70 74, 84 66, 104 66 L 196 66 C 216 66, 230 74, 230 92 L 246 160 C 250 178, 234 190, 220 180 L 196 156 L 104 156 L 80 180 C 66 190, 50 178, 54 160 Z"
        strokeWidth="2"
        opacity="0.9"
      />
      {/* D-pad */}
      <path d="M96 100 h10 v-10 h8 v10 h10 v8 h-10 v10 h-8 v-10 h-10 z" strokeWidth="1.5" opacity="0.7" />
      {/* Face buttons */}
      {[
        [200, 92],
        [214, 106],
        [200, 120],
        [186, 106],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={6} strokeWidth="1.5" opacity={i === 1 ? 1 : 0.6} />
      ))}
      {/* Sticks */}
      <circle cx={128} cy={136} r={13} strokeWidth="1.5" opacity="0.7" />
      <circle cx={172} cy={136} r={13} strokeWidth="1.5" opacity="0.7" />
      <circle cx={132} cy={131} r={5} fill="currentColor" stroke="none" opacity="0.9" />
      {/* Light bar */}
      <path d="M128 70 h44" strokeWidth="3" opacity="0.9" />
      {/* Command to the robot */}
      <path d="M250 112 C 275 112, 285 100, 305 100" strokeWidth="1.3" strokeDasharray="3 4" opacity="0.55" />
      <text x={258} y={92} fontSize="9" fontFamily="ui-monospace, monospace" fill="currentColor" stroke="none" opacity="0.7">
        /cmd_vel
      </text>
      <circle cx={330} cy={100} r={16} strokeWidth="2" />
      <path d="M330 100 L 358 86" strokeWidth="2" />
      <path d="M352 82 L 358 86 L 352 92" strokeWidth="2" />
    </g>
  )
}

/** Self-docking: a room corner, a charging dock with IR beams, and the
 *  robot's approach path from the open floor. */
function Dock() {
  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {/* Walls */}
      <path d="M40 40 H360 V185" strokeWidth="3" opacity="0.8" />
      {/* Dock on the right wall, with contacts */}
      <rect x={344} y={92} width={16} height={42} rx={3} fill="currentColor" fillOpacity="0.25" strokeWidth="2" />
      <path d="M344 104 h-6 M344 122 h-6" strokeWidth="2.5" />
      {/* IR beams fanning from the dock */}
      {[-22, -11, 0, 11, 22].map((a, i) => {
        const r = (a * Math.PI) / 180
        return (
          <line
            key={i}
            x1={344}
            y1={113}
            x2={344 - Math.cos(r) * 120}
            y2={113 + Math.sin(r) * 120}
            strokeWidth="1"
            strokeDasharray="2 5"
            opacity={0.5 - Math.abs(a) / 80}
          />
        )
      })}
      {/* Approach path: arc in, then a straight final alignment */}
      <path d="M90 165 C 150 165, 190 113, 250 113 L 318 113" strokeWidth="2" strokeDasharray="5 5" opacity="0.85" />
      {/* Robot mid-approach, heading toward the dock */}
      <circle cx={250} cy={113} r={15} strokeWidth="2.5" fill="currentColor" fillOpacity="0.15" />
      <path d="M250 113 L 266 113" strokeWidth="2.5" />
      <circle cx={250} cy={113} r={4} fill="currentColor" stroke="none" />
      {/* Start pose */}
      <circle cx={90} cy={165} r={4} fill="currentColor" stroke="none" opacity="0.6" />
      <text x={60} y={62} fontSize="9" fontFamily="ui-monospace, monospace" fill="currentColor" stroke="none" opacity="0.6">
        fig. docking approach
      </text>
    </g>
  )
}

/** Free text in, a learned embedding, a ranked list of courses out. */
function Pipeline() {
  const bars = [14, 26, 9, 31, 20, 12, 28, 17, 23, 10]
  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {/* Query box */}
      <rect x={40} y={86} width={92} height={54} rx={8} strokeWidth="2" />
      <path d="M52 104 h64 M52 116 h48 M52 128 h56" strokeWidth="2" opacity="0.55" />
      {/* Arrow */}
      <path d="M140 113 h24 m-6 -6 l6 6 l-6 6" strokeWidth="2" opacity="0.7" />
      {/* Embedding vector */}
      {bars.map((h, i) => (
        <rect
          key={i}
          x={174 + i * 8}
          y={113 - h / 2}
          width={5}
          height={h}
          rx={1.5}
          fill="currentColor"
          stroke="none"
          opacity={0.35 + (h / 31) * 0.55}
        />
      ))}
      {/* Arrow */}
      <path d="M262 113 h24 m-6 -6 l6 6 l-6 6" strokeWidth="2" opacity="0.7" />
      {/* Ranked results */}
      {[0, 1, 2].map((i) => (
        <g key={i} opacity={1 - i * 0.28}>
          <rect x={296} y={80 + i * 24} width={70} height={18} rx={4} strokeWidth="1.6" />
          <path d={`M304 ${89 + i * 24} h${40 - i * 8}`} strokeWidth="2" />
        </g>
      ))}
      <text x={40} y={70} fontSize="9" fontFamily="ui-monospace, monospace" fill="currentColor" stroke="none" opacity="0.6">
        text → word2vec → LSTM → courses
      </text>
    </g>
  )
}

const SHAPES: Record<VisualKind, () => React.ReactNode> = {
  graph: Graph,
  occupancy: Occupancy,
  detect: Detect,
  gait: Gait,
  cloud: Cloud,
  layers: Layers,
  fleet: Fleet,
  gamepad: Gamepad,
  dock: Dock,
  pipeline: Pipeline,
}

export default function ProjectVisual({
  kind,
  className = '',
  sideFade = false,
}: {
  kind: VisualKind
  className?: string
  /** Set when the art sits beside the copy rather than above it, so the
   *  softening runs toward the text instead of upward. */
  sideFade?: boolean
}) {
  const Shape = SHAPES[kind]
  return (
    <div
      aria-hidden="true"
      // Drawn in SVG coordinates, which are left-to-right; on the Arabic site
      // inherited RTL would anchor the labels from their right edge.
      dir="ltr"
      // Decorative only: on paper it would render as a block of black ink.
      data-print-hide
      className={`relative overflow-hidden bg-bg/40 text-[rgb(var(--tone,var(--tone-blue)))] ${className}`}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="size-full"
        role="presentation"
      >
        <Grid />
        <Shape />
      </svg>
      {/* Softens the art into the card so it reads as a backdrop, not a photo. */}
      <div
        className={`absolute inset-0 from-surface via-surface/10 to-transparent ${
          sideFade ? 'bg-gradient-to-t md:bg-gradient-to-r' : 'bg-gradient-to-t'
        }`}
      />
    </div>
  )
}
