/**
 * The hero simulation in 3D (Three.js). It renders the state lib/slam.ts
 * computes and adds nothing to the robotics: walls rise from the occupancy
 * grid, the floor carries the map and costmap, the lidar fan sits at sensor
 * height, and the robot is the course's BurgerBot built from its URDF layers.
 *
 * Units are grid cells (10 cm); sim (x, y) maps to world (x, 0, y), centred.
 * Loaded on demand by SlamViewport, which falls back to 2D if this throws.
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { LIDAR_BEAMS, OCC, ROBOT_RADIUS, type Pt, type Sim } from './slam'

export type Palette3D = {
  /** "r g b" triplets */
  accent: string
  scan: string
  plan: string
  ink: string
}

export type Scene3D = {
  render: (sim: Sim, mapChanged: boolean) => void
  resize: (w: number, h: number, dpr: number) => void
  setPalette: (p: Palette3D) => void
  /** A screen point on the floor, in sim cell coordinates. */
  pick: (clientX: number, clientY: number) => Pt | null
  /** True while the visitor is orbiting; the caller should keep rendering. */
  interacting: () => boolean
  dispose: () => void
}

const col = (triplet: string) => {
  const [r, g, b] = triplet.split(' ').map(Number)
  return new THREE.Color(r / 255, g / 255, b / 255)
}

/** Walls are taller than the robot but low enough to see into rooms. */
const WALL_H = 4.2
/** Visual plate radius, as in 2D: out to the lethal inflation radius. */
const R = ROBOT_RADIUS * 1.6
/** BurgerBot scale: its real plate radius is 0.125 m. */
const K = R / 0.125
/** Squash the stack a little so it does not tower over the walls. */
const HS = 0.62

function buildBurgerBot(accent: THREE.Color) {
  const g = new THREE.Group()
  const rubber = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.85 })
  const plateMat = new THREE.MeshStandardMaterial({
    color: accent,
    roughness: 0.35,
    metalness: 0.15,
    transparent: true,
    opacity: 0.92,
  })
  const upperPlateMat = plateMat.clone()
  upperPlateMat.opacity = 0.55
  const metal = new THREE.MeshStandardMaterial({ color: 0xc9ced8, roughness: 0.3, metalness: 0.8 })

  const wheelR = 0.033 * K
  const plateT = 0.012 * K
  const gap = 0.094 * K * HS
  const y1 = wheelR
  const y2 = y1 + gap
  const y3 = y2 + gap

  // Three layers.
  const plateGeo = new THREE.CylinderGeometry(R, R, plateT, 48)
  ;[y1, y2, y3].forEach((y, i) => {
    const m = new THREE.Mesh(plateGeo, i === 0 ? plateMat : upperPlateMat)
    m.position.y = y
    m.castShadow = i === 0
    g.add(m)
  })

  // Support posts.
  const postGeo = new THREE.CylinderGeometry(0.007 * K, 0.007 * K, y3 - y1, 10)
  for (const a of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) {
    const m = new THREE.Mesh(postGeo, metal)
    m.position.set(Math.cos(a) * R * 0.72, (y1 + y3) / 2, Math.sin(a) * R * 0.72)
    g.add(m)
  }

  // Drive wheels: Ø66 × 18 mm, at the sides; and their motors.
  const wheelGeo = new THREE.CylinderGeometry(wheelR, wheelR, 0.022 * K, 24)
  wheelGeo.rotateX(Math.PI / 2)
  const motorGeo = new THREE.CylinderGeometry(0.012 * K, 0.012 * K, 0.04 * K, 12)
  motorGeo.rotateX(Math.PI / 2)
  for (const side of [-1, 1]) {
    const w = new THREE.Mesh(wheelGeo, rubber)
    w.position.set(0, wheelR, side * R * 0.9)
    w.castShadow = true
    g.add(w)
    const m = new THREE.Mesh(motorGeo, metal)
    m.position.set(0, wheelR, side * R * 0.62)
    g.add(m)
  }

  // Front caster.
  const caster = new THREE.Mesh(new THREE.SphereGeometry(0.1 * R, 16, 12), rubber)
  caster.position.set(R * 0.7, 0.1 * R, 0)
  g.add(caster)

  // Middle layer: Raspberry Pi (85 × 56 mm, across the robot) and IMU.
  const pi = new THREE.Mesh(
    new THREE.BoxGeometry(0.056 * K, 0.017 * K * HS, 0.085 * K),
    new THREE.MeshStandardMaterial({ color: 0x1f8a46, roughness: 0.6 }),
  )
  pi.position.set(0.01 * K, y2 + plateT / 2 + (0.017 * K * HS) / 2, 0)
  g.add(pi)
  const imu = new THREE.Mesh(
    new THREE.BoxGeometry(0.03 * K, 0.006 * K, 0.027 * K),
    new THREE.MeshStandardMaterial({ color: 0xd23b3b, roughness: 0.5 }),
  )
  imu.position.set(-0.032 * K * 1.6, y2 + plateT / 2 + 0.003 * K, 0)
  g.add(imu)

  // Top layer: the LiDAR, with a head that spins.
  const lidarH = 0.041 * K * HS
  const lidar = new THREE.Mesh(new THREE.CylinderGeometry(0.038 * K, 0.04 * K, lidarH, 32), rubber)
  lidar.position.y = y3 + plateT / 2 + lidarH / 2
  lidar.castShadow = true
  g.add(lidar)
  const head = new THREE.Group()
  head.position.y = y3 + plateT / 2 + lidarH + 0.004 * K
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * K, 0.03 * K, 0.008 * K, 24), rubber)
  head.add(cap)
  const emitter = new THREE.Mesh(
    new THREE.BoxGeometry(0.03 * K, 0.006 * K, 0.008 * K),
    new THREE.MeshBasicMaterial({ color: 0xff4d6d }),
  )
  emitter.position.set(0.016 * K, 0, 0)
  head.add(emitter)
  g.add(head)

  // Heading arrow on the bottom plate's front edge.
  const arrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.12 * R, 0.25 * R, 3),
    new THREE.MeshBasicMaterial({ color: accent }),
  )
  arrow.rotation.z = -Math.PI / 2
  arrow.position.set(R * 1.08, y1, 0)
  g.add(arrow)

  return { group: g, head, scanHeight: head.position.y - 0.004 * K, plateMat, upperPlateMat, arrow }
}

export function createScene3D(
  canvas: HTMLCanvasElement,
  W: number,
  H: number,
  mapCanvas: HTMLCanvasElement,
  palette: Palette3D,
  coarsePointer: boolean,
): Scene3D {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setClearColor(0x000000, 0)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1.6, 1, 600)

  // Light: soft sky fill plus one key light that casts shadows.
  const hemi = new THREE.HemisphereLight(0xffffff, 0x223044, 1.1)
  scene.add(hemi)
  const key = new THREE.DirectionalLight(0xffffff, 1.6)
  key.position.set(-W * 0.3, 60, -H * 0.6)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  const sc = key.shadow.camera
  sc.left = -W * 0.6
  sc.right = W * 0.6
  sc.top = H * 0.8
  sc.bottom = -H * 0.8
  sc.near = 10
  sc.far = 160
  key.shadow.bias = -0.002
  scene.add(key)

  // World root, centred on the map.
  const world = new THREE.Group()
  world.position.set(-W / 2, 0, -H / 2)
  scene.add(world)

  // Ground: a shadow catcher and a one-metre grid.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 1.6, H * 1.6),
    new THREE.ShadowMaterial({ opacity: 0.35 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.set(W / 2, -0.02, H / 2)
  ground.receiveShadow = true
  world.add(ground)

  const grid = new THREE.GridHelper(Math.max(W, H), Math.max(W, H) / 10)
  grid.position.set(W / 2, -0.01, H / 2)
  const gridMat = grid.material as THREE.LineBasicMaterial
  gridMat.transparent = true
  gridMat.opacity = 0.12
  world.add(grid)

  // The occupancy map and costmap, painted by SlamViewport into mapCanvas.
  const mapTex = new THREE.CanvasTexture(mapCanvas)
  mapTex.magFilter = THREE.NearestFilter
  mapTex.minFilter = THREE.NearestFilter
  mapTex.colorSpace = THREE.SRGBColorSpace
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.MeshBasicMaterial({ map: mapTex, transparent: true, depthWrite: false }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.set(W / 2, 0, H / 2)
  world.add(floor)

  // Walls: one instanced box per occupied cell.
  const wallMat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05 })
  const walls = new THREE.InstancedMesh(new THREE.BoxGeometry(1, WALL_H, 1), wallMat, W * H)
  walls.count = 0
  walls.castShadow = true
  walls.receiveShadow = true
  world.add(walls)
  const m4 = new THREE.Matrix4()

  // Robot.
  const bot = buildBurgerBot(col(palette.accent))
  world.add(bot.group)

  // Lidar: a translucent fan at sensor height and bright returns.
  const fanPos = new Float32Array(LIDAR_BEAMS * 9)
  const fanGeo = new THREE.BufferGeometry()
  fanGeo.setAttribute('position', new THREE.BufferAttribute(fanPos, 3))
  const fanMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const fan = new THREE.Mesh(fanGeo, fanMat)
  fan.frustumCulled = false
  world.add(fan)

  const hitPos = new Float32Array(LIDAR_BEAMS * 3)
  const hitGeo = new THREE.BufferGeometry()
  hitGeo.setAttribute('position', new THREE.BufferAttribute(hitPos, 3))
  const hitMat = new THREE.PointsMaterial({ size: 0.8, sizeAttenuation: true })
  const hits = new THREE.Points(hitGeo, hitMat)
  hits.frustumCulled = false
  world.add(hits)

  // Global plan (dashed) and the trail behind the robot.
  const planGeo = new THREE.BufferGeometry()
  const planMat = new THREE.LineDashedMaterial({ dashSize: 0.9, gapSize: 0.6, transparent: true, opacity: 0.95 })
  const planLine = new THREE.Line(planGeo, planMat)
  planLine.frustumCulled = false
  world.add(planLine)

  const trailGeo = new THREE.BufferGeometry()
  const trailMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.35 })
  const trail = new THREE.Line(trailGeo, trailMat)
  trail.frustumCulled = false
  world.add(trail)

  // Goal marker: a flat ring and a pin.
  const goal = new THREE.Group()
  const ringMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9, side: THREE.DoubleSide })
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.45, 40), ringMat)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.05
  goal.add(ring)
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.4, 8), ringMat)
  pin.position.y = 1.2
  goal.add(pin)
  const pinHead = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), ringMat)
  pinHead.position.y = 2.5
  goal.add(pinHead)
  goal.visible = false
  world.add(goal)

  const applyPalette = (p: Palette3D) => {
    const ink = col(p.ink)
    // Walls take the ink tone, cooled toward the accent so they sit in the theme.
    wallMat.color.copy(ink).lerp(col(p.accent), 0.12)
    fanMat.color = col(p.scan)
    hitMat.color = col(p.scan)
    planMat.color = col(p.plan)
    trailMat.color = col(p.accent)
    ringMat.color = col(p.plan)
    gridMat.color = ink
    bot.plateMat.color = col(p.accent)
    bot.upperPlateMat.color = col(p.accent)
    ;(bot.arrow.material as THREE.MeshBasicMaterial).color = col(p.accent)
  }
  applyPalette(palette)

  // Camera: an angled overview of the whole floor. Mouse users can orbit
  // within limits; zoom and pan stay off so the page keeps its scroll.
  const target = new THREE.Vector3(0, 0, 1)
  const placeCamera = (aspect: number) => {
    const fitH = Math.max(H, W / aspect)
    const dist = (fitH * 0.56) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const elev = THREE.MathUtils.degToRad(55)
    camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist + 1)
    camera.lookAt(target)
  }

  let controls: OrbitControls | null = null
  let dragging = false
  if (!coarsePointer) {
    controls = new OrbitControls(camera, canvas)
    controls.enableZoom = false
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.rotateSpeed = 0.6
    controls.minPolarAngle = THREE.MathUtils.degToRad(18)
    controls.maxPolarAngle = THREE.MathUtils.degToRad(68)
    controls.minAzimuthAngle = -0.9
    controls.maxAzimuthAngle = 0.9
    controls.target.copy(target)
    controls.addEventListener('start', () => (dragging = true))
    controls.addEventListener('end', () => (dragging = false))
  }

  const raycaster = new THREE.Raycaster()
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const ndc = new THREE.Vector2()
  const hitPoint = new THREE.Vector3()

  const updateWalls = (sim: Sim) => {
    let n = 0
    for (let i = 0; i < W * H; i++) {
      if (sim.map[i] !== OCC) continue
      m4.makeTranslation((i % W) + 0.5, WALL_H / 2, Math.floor(i / W) + 0.5)
      walls.setMatrixAt(n++, m4)
    }
    walls.count = n
    walls.instanceMatrix.needsUpdate = true
  }

  // Fixed-size buffers for the plan and trail, refilled in place each frame,
  // so drawing them allocates nothing.
  const MAX_PTS = 1024
  for (const geo of [planGeo, trailGeo]) {
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_PTS * 3), 3))
  }
  const setLine = (geo: THREE.BufferGeometry, head: Pt | null, pts: Pt[], from: number, y: number) => {
    const attr = geo.attributes.position as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    let n = 0
    const put = (p: Pt) => {
      if (n >= MAX_PTS) return
      arr[n * 3] = p.x
      arr[n * 3 + 1] = y
      arr[n * 3 + 2] = p.y
      n++
    }
    if (head) put(head)
    for (let i = from; i < pts.length; i++) put(pts[i])
    attr.needsUpdate = true
    geo.setDrawRange(0, n)
  }

  return {
    render(sim, mapChanged) {
      if (mapChanged) {
        mapTex.needsUpdate = true
        updateWalls(sim)
      }
      const P = sim.pose
      bot.group.position.set(P.x, 0, P.y)
      bot.group.rotation.y = -P.th
      bot.head.rotation.y = -sim.time * 9

      // Lidar fan and returns, at sensor height.
      const sy = bot.scanHeight
      let hp = 0
      for (let b = 0; b < LIDAR_BEAMS; b++) {
        const a0 = P.th + (b / LIDAR_BEAMS) * Math.PI * 2
        const a1 = P.th + (((b + 1) % LIDAR_BEAMS) / LIDAR_BEAMS) * Math.PI * 2
        const r0 = sim.scan[b]
        const r1 = sim.scan[(b + 1) % LIDAR_BEAMS]
        const o = b * 9
        fanPos[o] = P.x
        fanPos[o + 1] = sy
        fanPos[o + 2] = P.y
        fanPos[o + 3] = P.x + Math.cos(a0) * r0
        fanPos[o + 4] = sy
        fanPos[o + 5] = P.y + Math.sin(a0) * r0
        fanPos[o + 6] = P.x + Math.cos(a1) * r1
        fanPos[o + 7] = sy
        fanPos[o + 8] = P.y + Math.sin(a1) * r1
        if (r0 < 25.9) {
          hitPos[hp++] = P.x + Math.cos(a0) * r0
          hitPos[hp++] = sy
          hitPos[hp++] = P.y + Math.sin(a0) * r0
        }
      }
      fanGeo.attributes.position.needsUpdate = true
      hitGeo.attributes.position.needsUpdate = true
      hitGeo.setDrawRange(0, hp / 3)

      // Plan, from the robot along the remaining path.
      if (sim.path.length > 1) {
        setLine(planGeo, P, sim.path, sim.pathIdx, 0.12)
        planLine.computeLineDistances()
        planLine.visible = true
      } else planLine.visible = false

      if (sim.trail.length > 1) {
        setLine(trailGeo, null, sim.trail, 0, 0.08)
        trail.visible = true
      } else trail.visible = false

      if (sim.goal) {
        goal.visible = true
        goal.position.set(sim.goal.x, 0, sim.goal.y)
        const s = 1 + 0.15 * Math.sin(sim.time * 5)
        ring.scale.set(s, s, s)
      } else goal.visible = false

      controls?.update()
      renderer.render(scene, camera)
    },

    resize(w, h, dpr) {
      renderer.setPixelRatio(dpr)
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      placeCamera(w / h)
      controls?.target.copy(target)
      controls?.update()
    },

    setPalette(p) {
      applyPalette(p)
    },

    pick(clientX, clientY) {
      const r = canvas.getBoundingClientRect()
      ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
      raycaster.setFromCamera(ndc, camera)
      if (!raycaster.ray.intersectPlane(floorPlane, hitPoint)) return null
      const x = hitPoint.x + W / 2
      const y = hitPoint.z + H / 2
      return x >= 0 && y >= 0 && x < W && y < H ? { x, y } : null
    },

    interacting: () => dragging,

    dispose() {
      controls?.dispose()
      renderer.dispose()
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose?.()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose?.()
      })
      mapTex.dispose()
    },
  }
}
