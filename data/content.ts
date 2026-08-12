import type { VisualKind } from '@/components/ProjectVisual'

/**
 * Supporting palette keys. Blue is the site's one main colour; these are for
 * telling content apart. Each maps to a `--tone-*` variable in globals.css,
 * which resolves to a light- or dark-appropriate value automatically.
 */
export type Tone =
  | 'blue'
  | 'violet'
  | 'purple'
  | 'cyan'
  | 'rose'
  | 'emerald'
  | 'amber'
  | 'teal'
  | 'lime'

export const site = {
  name: 'Mohammed Almsitef',
  role: 'Robotics & AI Engineer',
  tagline:
    'I build systems that perceive, reason, and act — from deep learning models for vision and language to the real-time autonomy stacks that run them on physical robots.',
  location: 'City, Country',
  email: 'you@example.com',
  resumeUrl: '/resume.pdf',
  url: 'https://mohammedalmsitef.me',
  availableForWork: true,
}

/** Shown as chips under the hero headline. Keep to 5–6 for a tidy line. */
export const domains = [
  'Robotics',
  'Artificial Intelligence',
  'Machine Learning',
  'Deep Learning',
  'Computer Vision',
  'NLP',
]

export const socials = [
  { label: 'GitHub', href: 'https://github.com/yourusername' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/yourusername' },
  { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=yourid' },
]

export const about = {
  paragraphs: [
    "I'm an engineer working at the intersection of robotics and applied AI. My work runs the full width of the problem — training the perception and language models, then earning the right to trust them by putting them on hardware that moves through the real world.",
    'On the AI side that means computer vision (detection, segmentation, visual SLAM), deep learning (CNNs, transformers, reinforcement learning), and increasingly NLP and LLMs for grounding natural-language instructions into robot behaviour. On the systems side it means ROS 2, real-time control, sensor fusion, and the unglamorous work of making a model fast enough to run on an embedded GPU.',
    'The interesting problems live where those two halves meet: distribution shift between simulation and reality, latency budgets that make a great model unusable, and calibrating how much a planner should trust a network that is confidently wrong. I care about measurable results and honest failure analysis.',
  ],
  stats: [
    { value: 'X+', label: 'Years in robotics & AI' },
    { value: 'XX', label: 'Models trained & deployed' },
    { value: 'XX', label: 'Systems shipped to the field' },
  ],
}

/**
 * A project entry follows the documentation structure recruiters actually look
 * for: the problem, what you built, how, the proof it worked, and what you
 * learned. Each field maps to a heading on the project's own page — a card
 * alone has nowhere near enough room for the story.
 */
export type Project = {
  /** URL segment for the project page: /projects/<slug> */
  slug: string
  title: string
  year: string
  /** One or two lines for the card. The full story lives in the fields below. */
  summary: string
  /** The "why": the real-world challenge. */
  problem: string
  /** The "what": what you actually built. */
  solution: string
  /** The "how": be specific — languages, frameworks, sensors, infrastructure. */
  how: string[]
  /** How you knew it worked. Numbers beat adjectives. */
  results: string[]
  /** What went wrong and what you would do differently. */
  lessons: string[]
  /** Optional: how the work was tested. */
  testing?: string
  /** Optional: your specific role on a team project. */
  role?: string
  tags: string[]
  liveUrl?: string
  repoUrl?: string
  /** A YouTube URL — embedded on the project page, not just linked. */
  videoUrl?: string
  featured?: boolean
  tone: Tone
  /** Generated cover art. Ignored when `image` is set. */
  visual: VisualKind
  /** Path under public/, e.g. '/projects/amr.png'. Replaces the generated art. */
  image?: string
}

export const projects: Project[] = [
  {
    slug: 'language-conditioned-manipulation',
    title: 'Language-Conditioned Robot Manipulation',
    year: '2025',
    featured: true,
    tone: 'rose',
    visual: 'graph',
    summary:
      'Natural-language instructions grounded into executable robot plans, without per-object training.',
    problem:
      'Teaching a manipulator a new task meant writing a new script and collecting new training data for every object. Operators on the floor could describe what they wanted in plain language, but nothing in the stack could act on that — so every small change needed an engineer.',
    solution:
      'A pipeline that turns a free-form instruction into collision-aware motion. An LLM decomposes the sentence into ordered subgoals, an open-vocabulary detector grounds each referenced object in the live scene, and MoveIt 2 plans and executes the motion with a Cartesian servoing fallback when the plan is refused.',
    how: [
      'LLM planner prompted to emit a strict subgoal schema, so a malformed response is rejected rather than executed.',
      'Open-vocabulary grounding with CLIP-style embeddings, matching detected regions against the phrase rather than a fixed class list.',
      'Depth-camera point cloud segmentation (PCL, Open3D) to recover a 6-DoF grasp pose per candidate object.',
      'ROS 2 action server wrapping MoveIt 2; the planner and the perception stack run as separate composable nodes to keep the control path real-time.',
      'PyTorch for the grasp ranker, exported to TensorRT for on-robot inference.',
    ],
    testing:
      'Instruction parsing is covered by unit tests against a fixture set of phrasings. The full pipeline runs in Gazebo in CI on every merge, and a nightly job replays recorded scenes through the perception stack to catch grounding regressions.',
    results: [
      'XX% task success across N unseen instruction phrasings, with no per-object training.',
      'Grounding accuracy of XX% on a held-out set of N cluttered scenes.',
      'End-to-end latency from instruction to first motion: X seconds.',
    ],
    lessons: [
      'The LLM was the least fragile part. Grounding was where things broke — ambiguous references like "the one on the left" need the scene geometry, not a better prompt.',
      'I initially let the planner retry on failure without bound. A refused plan would loop until the operator intervened; capping retries and surfacing the failure was better than hiding it.',
      'Next time I would build the evaluation set of phrasings before the pipeline, not after. It would have shown much earlier which failures were grounding and which were planning.',
    ],
    role:
      'Solo project. I designed the subgoal schema, built the grounding and grasp-ranking stack, and did the integration onto the arm.',
    tags: ['PyTorch', 'LLMs', 'CLIP', 'Open-vocab detection', 'ROS 2', 'MoveIt 2', 'TensorRT'],
    repoUrl: 'https://github.com/yourusername/lang-manipulation',
    videoUrl: 'https://youtube.com/watch?v=yourdemo',
  },
  {
    slug: 'amr-navigation-stack',
    title: 'Autonomous Mobile Robot Navigation Stack',
    year: '2025',
    featured: true,
    tone: 'emerald',
    visual: 'occupancy',
    summary:
      'A full ROS 2 autonomy stack for a warehouse AMR, with a learned traversability costmap replacing hand-tuned heuristics.',
    problem:
      'The fleet needed an operator intervention roughly once every X hours. Most were the same failure: the planner treated a hand-tuned inflation radius as ground truth, so pallet wrap, floor drains, and low-hanging shrink film were either invisible or treated as walls.',
    solution:
      'An end-to-end autonomy stack: 2D LiDAR SLAM for localisation, Nav2 for global and local planning, and a learned traversability costmap trained on field data that replaced the inflation heuristic. A behaviour tree handles recovery so the robot degrades gracefully instead of stopping dead.',
    how: [
      'C++17 ROS 2 nodes; the control path runs on a PREEMPT_RT kernel with the executor and node composition tuned to hold the latency budget.',
      'SLAM Toolbox for mapping and localisation, with a re-localisation routine for the docking approach.',
      'Traversability model in PyTorch, trained on labelled LiDAR + camera field recordings, exported to ONNX and served on the robot.',
      'Nav2 with a custom controller plugin and a BehaviorTree.CPP recovery tree.',
      'Sensor fusion (EKF) over wheel odometry, IMU, and LiDAR scan matching.',
    ],
    testing:
      'A hardware-in-the-loop rig replays recorded field rosbags on every merge and fails the build on a regression in intervention-triggering events. Controller changes are checked against a fixed set of simulated scenarios before they reach a robot.',
    results: [
      'Operator interventions cut from 1 per X hours to 1 per Y, across N customer sites.',
      'Docking accuracy held under Z cm.',
      'Perception-to-planning latency reduced from X ms to Y ms after restructuring the executor.',
      'Migrated ROS 1 → ROS 2 with zero fleet downtime.',
    ],
    lessons: [
      'The learned costmap was only trustworthy once I added a floor on it. A model that is confidently wrong about a drain is worse than a crude inflation radius, so the planner now clamps how much it will trust the network.',
      'Most of the real work was data, not modelling — the active-learning loop over field failures moved the metric far more than any architecture change.',
      'I underestimated how much the HIL rig would pay for itself. It should have been the first thing built, not the third.',
    ],
    role:
      'I owned the perception-to-planning interface and the costmap model, and led the ROS 2 migration. Two other engineers worked on the docking and fleet-management sides.',
    tags: ['ROS 2', 'C++', 'Nav2', 'SLAM Toolbox', 'PyTorch', 'PREEMPT_RT', 'Docker'],
    repoUrl: 'https://github.com/yourusername/nav-stack',
    videoUrl: 'https://youtube.com/watch?v=yourdemo',
  },
  {
    slug: 'edge-detection-tracking',
    title: 'Real-Time Detection & Tracking on the Edge',
    year: '2024',
    tone: 'cyan',
    visual: 'detect',
    summary:
      'Multi-object detection and tracking fast enough to sit inside the control loop on a Jetson.',
    problem:
      'The detection model was accurate but ran at X ms on the target hardware — far too slow to be used by the controller, which meant the robot reacted to obstacles a full cycle late.',
    solution:
      'A detection and tracking pipeline rebuilt around the latency budget: a YOLO-family detector converted to TensorRT with INT8 quantization, feeding a ByteTrack association stage that keeps identities stable across frames.',
    how: [
      'PyTorch training, exported through ONNX to a TensorRT engine built for the specific Jetson target.',
      'INT8 post-training quantization with a calibration set drawn from real deployment footage rather than the training set.',
      'ByteTrack for association; CUDA-side pre-processing to keep the image off the CPU.',
      'Latency measured end-to-end (capture to published detection), not just model forward time.',
    ],
    testing:
      'A benchmark harness pins the engine to the target device and fails CI if p99 latency regresses. Accuracy is re-checked against the held-out set after every quantization change, since quantization can silently cost recall on small objects.',
    results: [
      'XX FPS sustained on the Jetson, inside the control loop.',
      'Latency reduced from X ms to Y ms.',
      'Under Z% mAP loss from INT8 quantization.',
    ],
    lessons: [
      'Quantization error was not uniform — small distant objects lost far more recall than large ones. Averaged mAP hid this completely until I broke the metric down by object size.',
      'Calibrating on training data gave misleadingly good numbers. Using real deployment footage for calibration mattered more than the quantization scheme itself.',
    ],
    tags: ['YOLO', 'ByteTrack', 'TensorRT', 'CUDA', 'Jetson', 'ONNX'],
    repoUrl: 'https://github.com/yourusername/edge-detection',
  },
  {
    slug: 'sim-to-real-rl',
    title: 'Sim-to-Real Deep Reinforcement Learning',
    year: '2024',
    tone: 'purple',
    visual: 'gait',
    summary:
      'A locomotion policy trained in simulation that survived terrain the hand-tuned baseline could not.',
    problem:
      'The hand-tuned MPC controller was reliable on flat ground and fell over on anything it had not been modelled for. Tuning it for each new surface did not scale.',
    solution:
      'A locomotion policy trained with PPO in Isaac Sim under domain randomization over mass, friction, and actuator delay, then deployed to hardware at 1 kHz alongside the existing safety layer.',
    how: [
      'PPO in Isaac Sim with thousands of parallel environments; MuJoCo used for quick reward iteration.',
      'Domain randomization over payload mass, surface friction, and actuator latency — the last of these mattered most for transfer.',
      'Observation space restricted to what the real robot can actually measure, so nothing depends on privileged simulator state.',
      'Policy exported and run in the real-time control loop, with the existing safety controller retained as a fallback.',
    ],
    testing:
      'Policies are gated on a fixed suite of held-out simulated terrains before any hardware run, then evaluated on hardware against the MPC baseline on the same course.',
    results: [
      'Survived unmodelled terrain where the MPC baseline fell.',
      'Ran at 1 kHz on the target hardware.',
      'Recovered from pushes up to X N without falling.',
    ],
    lessons: [
      'Actuator-delay randomization was the single change that made transfer work. Mass and friction randomization alone produced a policy that looked great in sim and stumbled immediately on hardware.',
      'My first observation space accidentally included a simulator-only quantity. It trained beautifully and transferred not at all — a good lesson in auditing observations before rewards.',
    ],
    tags: ['PPO', 'Isaac Sim', 'PyTorch', 'MuJoCo', 'Domain randomization'],
    repoUrl: 'https://github.com/yourusername/sim2real-rl',
    videoUrl: 'https://youtube.com/watch?v=yourdemo',
  },
  {
    slug: 'visual-inertial-slam',
    title: 'Visual-Inertial SLAM',
    year: '2024',
    tone: 'blue',
    visual: 'cloud',
    summary:
      'Tightly-coupled visual-inertial odometry with a factor-graph back end for GPS-denied flight.',
    problem:
      'Indoors and under canopy there is no GPS, and wheel odometry does not exist on a flying platform. Drift over a few minutes was large enough to make return-to-home unreliable.',
    solution:
      'A tightly-coupled VIO front end feeding a factor-graph back end, with an online camera–IMU extrinsic calibration routine so the rig does not need re-calibrating by hand after every knock.',
    how: [
      'C++ with Eigen; feature tracking and stereo matching in OpenCV.',
      'IMU pre-integration between keyframes, with visual and inertial residuals optimised jointly in GTSAM.',
      'Ceres for the extrinsic calibration solve.',
      'Deterministic replay from recorded datasets so a trajectory can be reproduced exactly while debugging.',
    ],
    testing:
      'Evaluated on public benchmark sequences with ground truth as well as our own recordings, reporting absolute trajectory error rather than eyeballing the map.',
    results: [
      'Drift reduced by XX% over N-minute trajectories after adding online extrinsic calibration.',
      'Absolute trajectory error of X m on benchmark sequences.',
      'Ran in real time on the onboard compute.',
    ],
    lessons: [
      'Time synchronisation between camera and IMU mattered more than any estimator tuning. Milliseconds of unmodelled offset dominated the error budget until it was measured properly.',
      'I spent too long tuning the optimiser before checking the calibration. Fixing the inputs was worth more than improving the solver.',
    ],
    tags: ['C++', 'OpenCV', 'GTSAM', 'Ceres', 'Eigen'],
    repoUrl: 'https://github.com/yourusername/vio',
  },
  {
    slug: 'rag-technical-assistant',
    title: 'Retrieval-Augmented Technical Assistant',
    year: '2023',
    tone: 'violet',
    visual: 'layers',
    summary:
      'A RAG system answering questions over technical documentation, evaluated against human labels.',
    problem:
      'Engineers were repeatedly searching a large corpus of internal technical documentation for answers that existed but were hard to find. A plain vector search returned passages that were topically close and practically useless.',
    solution:
      'A retrieval-augmented pipeline with hybrid dense and sparse retrieval, a cross-encoder reranker over the candidates, and a LoRA fine-tune so the model handles domain terminology correctly.',
    how: [
      'Hybrid retrieval: dense embeddings plus BM25, fused before reranking.',
      'Cross-encoder reranker over the top candidates — the single biggest accuracy gain in the system.',
      'LoRA fine-tune on domain terminology using Hugging Face PEFT.',
      'FastAPI service, containerised with Docker; answers cite the passages they came from.',
    ],
    testing:
      'Scored against a human-labelled evaluation set rather than vibes, with retrieval and generation measured separately so a regression can be attributed to the right stage.',
    results: [
      'Answer accuracy raised from XX% to YY% against the human-labelled set.',
      'Reranking alone accounted for X points of that improvement.',
      'Median response time of X ms.',
    ],
    lessons: [
      'Retrieval quality, not the generator, was the bottleneck. Time spent on prompt wording was mostly wasted next to time spent on reranking.',
      'Measuring retrieval and generation as one number made early regressions impossible to diagnose. Splitting the metric was the fix.',
    ],
    tags: ['Transformers', 'LoRA', 'RAG', 'Vector search', 'FastAPI', 'Docker'],
    repoUrl: 'https://github.com/yourusername/rag-assistant',
  },
]

/**
 * Open-source work is kept separate from personal projects on purpose — it
 * demonstrates something different: code review, working to another project's
 * standards, and collaborating with a distributed team.
 */
export type Contribution = {
  project: string
  projectUrl: string
  what: string
  detail: string
  status: string
  tags: string[]
  tone: Tone
  prUrl?: string
}

export const contributions: Contribution[] = [
  {
    project: 'Nav2',
    projectUrl: 'https://github.com/ros-navigation/navigation2',
    what: 'Fixed a recovery-behaviour deadlock in the navigation stack',
    detail:
      'A recovery behaviour could leave the behaviour tree waiting on an action server that had already aborted, stalling navigation until a restart. Traced it to the cancellation path, added a regression test, and worked through review with the maintainers.',
    status: 'Merged · 2025',
    tags: ['C++', 'ROS 2', 'Behaviour trees'],
    tone: 'emerald',
    prUrl: 'https://github.com/ros-navigation/navigation2/pull/0000',
  },
  {
    project: 'MoveIt 2',
    projectUrl: 'https://github.com/moveit/moveit2',
    what: 'Added a planning-scene utility and its documentation',
    detail:
      'Contributed a helper for a collision-object workflow that previously required boilerplate at every call site, plus API documentation and examples so the addition was usable without reading the source.',
    status: 'Merged · 2024',
    tags: ['C++', 'MoveIt 2', 'Documentation'],
    tone: 'blue',
    prUrl: 'https://github.com/moveit/moveit2/pull/0000',
  },
  {
    project: 'Open3D',
    projectUrl: 'https://github.com/isl-org/Open3D',
    what: 'Fixed a point-cloud registration edge case',
    detail:
      'Registration silently returned an identity transform on degenerate inputs instead of reporting failure. Added the guard and a unit test covering the degenerate case.',
    status: 'Merged · 2024',
    tags: ['C++', 'Python', 'Point clouds'],
    tone: 'cyan',
    prUrl: 'https://github.com/isl-org/Open3D/pull/0000',
  },
]

export const skillGroups: { title: string; tone: Tone; items: string[] }[] = [
  {
    title: 'Languages',
    tone: 'blue' as Tone,
    items: ['Python', 'C++17 / 20', 'CUDA', 'SQL', 'Bash', 'CMake'],
  },
  {
    title: 'Machine Learning',
    tone: 'violet' as Tone,
    items: [
      'scikit-learn',
      'XGBoost / LightGBM',
      'Feature engineering',
      'Hyperparameter search (Optuna)',
      'Model evaluation & calibration',
      'Time-series forecasting',
    ],
  },
  {
    title: 'Deep Learning',
    tone: 'purple' as Tone,
    items: [
      'PyTorch',
      'TensorFlow / Keras',
      'CNNs & Vision Transformers',
      'Reinforcement learning (PPO / SAC)',
      'Distributed & mixed-precision training',
      'Model compression',
    ],
  },
  {
    title: 'Computer Vision',
    tone: 'cyan' as Tone,
    items: [
      'OpenCV',
      'Detection (YOLO / DETR)',
      'Semantic & instance segmentation',
      'Stereo & depth estimation',
      'Visual SLAM / VIO',
      'Camera calibration',
    ],
  },
  {
    title: 'NLP & LLMs',
    tone: 'rose' as Tone,
    items: [
      'Hugging Face Transformers',
      'Fine-tuning (LoRA / QLoRA)',
      'RAG & vector search',
      'Embeddings & semantic search',
      'Tokenization, spaCy / NLTK',
      'Evaluation & guardrails',
    ],
  },
  {
    title: 'Robotics',
    tone: 'emerald' as Tone,
    items: [
      'ROS 2 (Humble / Jazzy)',
      'Nav2 & MoveIt 2',
      'Sensor fusion (EKF / UKF)',
      'Motion planning',
      'Real-time control (MPC / PID)',
      'Behavior trees',
    ],
  },
  {
    title: 'Simulation',
    tone: 'amber' as Tone,
    items: [
      'NVIDIA Isaac Sim',
      'Gazebo / Ignition',
      'MuJoCo',
      'Domain randomization',
      'Sim-to-real transfer',
      'Foxglove / rviz2',
    ],
  },
  {
    title: 'MLOps & Deployment',
    tone: 'teal' as Tone,
    items: [
      'Docker & CI/CD',
      'Weights & Biases, MLflow',
      'ONNX / TensorRT',
      'Jetson & edge inference',
      'Data & experiment versioning',
      'Monitoring & drift detection',
    ],
  },
  {
    title: 'Embedded & Hardware',
    tone: 'lime' as Tone,
    items: [
      'Linux PREEMPT_RT',
      'STM32 / FreeRTOS',
      'CAN / CANopen',
      'LiDAR, IMU, depth cameras',
      'Time synchronization',
      'Hardware-in-the-loop',
    ],
  },
]

export type Experience = {
  role: string
  company: string
  companyUrl?: string
  period: string
  description: string
  highlights: string[]
}

export const experience: Experience[] = [
  {
    role: 'Senior Robotics & AI Engineer',
    company: 'Company Name',
    companyUrl: 'https://example.com',
    period: '2023 — Present',
    description:
      'Perception and autonomy for a fleet of N robots deployed across M customer sites.',
    highlights: [
      'Replaced a hand-tuned perception heuristic with a learned segmentation model, lifting obstacle recall from XX% to YY% while holding the inference budget under Z ms on embedded hardware.',
      'Owned the training-to-deployment path: dataset curation, active-learning loop on field failures, TensorRT export, and shadow-mode evaluation before promotion.',
      'Built a hardware-in-the-loop CI rig that replays field recordings on every merge — caught N regressions before they reached a robot.',
      'Mentored N engineers across the ML and robotics sides of the team.',
    ],
  },
  {
    role: 'Computer Vision & Machine Learning Engineer',
    company: 'Previous Company',
    companyUrl: 'https://example.com',
    period: '2021 — 2023',
    description: 'Vision models for automated inspection and robotic manipulation.',
    highlights: [
      'Trained and shipped detection and segmentation models that raised defect catch rate from XX% to YY% at a Z% false-positive rate.',
      'Cut inference latency X× through quantization and operator fusion, moving the model from a server GPU to an on-device accelerator.',
      'Built the labelling and evaluation pipeline — including the class-imbalance handling that made rare-defect metrics trustworthy.',
    ],
  },
  {
    role: 'Robotics Engineer',
    company: 'First Company',
    period: '2020 — 2021',
    description: 'Early-stage team building an outdoor inspection platform.',
    highlights: [
      'Developed sensor drivers and time-synchronization for a LiDAR + IMU + stereo rig.',
      'Prototyped the teleoperation stack and the first autonomous waypoint-following demo.',
    ],
  },
]

export const education = [
  {
    degree: 'M.Sc. Robotics & Artificial Intelligence',
    school: 'University Name',
    period: '2018 — 2020',
  },
  {
    degree: 'B.Sc. Computer / Electrical Engineering',
    school: 'University Name',
    period: '2014 — 2018',
  },
]

// Optional — empty this array and the section disappears from the page.
export const publications = [
  {
    title: 'Title of Your Paper on Robust Visual Perception under Distribution Shift',
    venue: 'IEEE/CVF CVPR',
    year: '2024',
    url: 'https://example.com/paper',
  },
  {
    title: 'Title of Your Paper on Sim-to-Real Transfer for Learned Control',
    venue: 'IEEE ICRA',
    year: '2023',
    url: 'https://example.com/paper',
  },
]
