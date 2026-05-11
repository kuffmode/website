/* 3D node-graph landing.
   Features: drag-individual-nodes, drag-empty-space-rotates, click=>focus,
   zoom (wheel), 4 layout types, blog posts as nodes, "aside" mini-mode.
   Now also: SER perturbation model + scissors/cut mode.
   All tunable constants live in config.js (window.SITE_CONFIG).
*/

// ── Config accessor (safe defaults if config.js is missing) ─────
const CFG = window.SITE_CONFIG || {};
const CFG_DOF    = CFG.dof    || {};
const CFG_SCENE  = CFG.scene  || {};
const CFG_NODES  = CFG.nodes  || {};
const CFG_LAYOUT = CFG.layout || {};
const CFG_IDLE   = CFG.idle   || {};

const PAGES = [
  { id: "about",    label: "about",              href: "about",    clickable: true, kind: "page" },
  { id: "research",         label: "research interests", href: "research",         clickable: true, kind: "page" },
  { id: "cv",               label: "cv",                 href: "cv",               clickable: true, kind: "page" },
  { id: "interactive-media", label: "interactive media",  href: "interactive-media", clickable: true, kind: "page" },
  { id: "blog",             label: "blog",               href: "blog",             clickable: true, kind: "page" },
  { id: "monkey",   label: "anxious monkey",     href: "monkey",   clickable: true, kind: "page" },
  { id: "contact",  label: "contact",            href: "contact",  clickable: true, kind: "page" },
];

const RESEARCH_THEMES = [
  { id: "theme-tele",   label: "teleological brain",   href: "research#teleological-understanding-of-the-human-brain",     clickable: true, kind: "theme" },
  { id: "theme-causal", label: "causal inference",     href: "research#causal-inference-in-neuroscience",                   clickable: true, kind: "theme" },
  { id: "theme-struc",  label: "structural backbone",  href: "research#structural-backbone-of-computation-in-the-brain",    clickable: true, kind: "theme" },
];

const ABOUT_SECTIONS = [
  { id: "about-bridge",   label: "structure × dynamics × function", href: "about#bridging-structure-dynamics-and-function-in-the-brain",     clickable: true, kind: "section" },
  { id: "about-rigorous", label: "rigorous causal inference",       href: "about#the-search-for-a-rigorous-foundation-for-causal-inference", clickable: true, kind: "section" },
  { id: "about-behavior", label: "from behavior to computation",    href: "about#from-behavior-to-computation",                              clickable: true, kind: "section" },
  { id: "about-clinical", label: "clinical psychology",             href: "about#foundations-in-clinical-psychology",                        clickable: true, kind: "section" },
  { id: "about-beyond",   label: "beyond the lab",                  href: "about#beyond-the-lab",                                            clickable: true, kind: "section" },
];

const CONTACT_LINKS = [
  { id: "ext-scholar",  label: "google scholar", href: "https://scholar.google.com/citations?user=652pLAUAAAAJ&hl=en", clickable: true, kind: "external" },
  { id: "ext-bluesky",  label: "bluesky",        href: "https://bsky.app/profile/kayson.bsky.social",                  clickable: true, kind: "external" },
  { id: "ext-twitter",  label: "twitter",        href: "https://twitter.com/kaysonfakhar",                             clickable: true, kind: "external" },
  { id: "ext-linkedin", label: "linkedin",       href: "https://www.linkedin.com/in/kaysonfakhar/",                    clickable: true, kind: "external" },
  { id: "ext-spotify",  label: "spotify",        href: "https://open.spotify.com/artist/4V9FIRrYQ0drSzZm9YK3sk",       clickable: true, kind: "external" },
];

function buildNodeList(nodeCount, blogPosts) {
  const postNodes = (blogPosts || []).map(p => {
    // Extract date from post.date or post.id (format: YYYY-MM-DD or YYYY-MM-DD_title)
    let dateTag = p.date;
    if (!dateTag && p.id) {
      const match = p.id.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        dateTag = match[1] + match[2] + match[3]; // YYYYMMDD format
      }
    }
    // Remove hyphens from date if present
    if (dateTag) {
      dateTag = dateTag.replace(/-/g, '');
    }
    return {
      id: "post-" + p.id,
      label: dateTag || p.title.toLowerCase().replace(/\.$/, ''),
      href: "blog/" + p.id,
      clickable: true,
      kind: "post",
    };
  });
  const clickable = [
    ...PAGES,
    ...RESEARCH_THEMES,
    ...ABOUT_SECTIONS,
    ...postNodes,
    ...CONTACT_LINKS,
  ];
  const fillerCount = Math.max(0, nodeCount - clickable.length);
  const fillers = Array.from({length: fillerCount}, (_, i) => ({
    id: "n" + i, label: "", clickable: false, kind: "filler"
  }));
  return [...clickable, ...fillers];
}

// ── Layout algorithms ───────────────────────────────────────────────
function layoutRandom(items) {
  const spread = CFG_LAYOUT.randomSpread ?? 600;
  return items.map(n => ({
    ...n,
    x: (Math.random() - 0.5) * spread,
    y: (Math.random() - 0.5) * spread,
    z: (Math.random() - 0.5) * spread,
  }));
}

function layoutSpherical(items) {
  // Fibonacci sphere — even spacing on a shell
  const N = items.length;
  return items.map((n, i) => {
    const phi = Math.acos(1 - 2 * (i + 0.5) / N);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = CFG_LAYOUT.sphereRadius ?? 280;
    return {
      ...n,
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
    };
  });
}

function makeEdges(nodes, density) {
  const targetDeg = Math.max(1, 1 + Math.round(density * 5));
  const edgeSet = new Set();
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    const dists = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dz = nodes[i].z - nodes[j].z;
      dists.push([j, dx*dx + dy*dy + dz*dz]);
    }
    dists.sort((a,b) => a[1] - b[1]);
    for (let k = 0; k < targetDeg && k < dists.length; k++) {
      const j = dists[k][0];
      const key = i < j ? i + "-" + j : j + "-" + i;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push([i, j]);
      }
    }
  }
  return edges;
}

function relaxSpring(nodes, edges, opts = {}) {
  const ideal = opts.ideal || (CFG_LAYOUT.springIdealDist ?? 200);
  const k = ideal;
  const iters = opts.iters || (CFG_LAYOUT.springIters ?? 220);
  for (let iter = 0; iter < iters; iter++) {
    const cooling = 1 - iter / iters;
    for (let i = 0; i < nodes.length; i++) {
      let fx = 0, fy = 0, fz = 0;
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        const d2 = dx*dx + dy*dy + dz*dz + 0.01;
        const d = Math.sqrt(d2);
        const f = (k*k) / d2;
        fx += dx * f / d;
        fy += dy * f / d;
        fz += dz * f / d;
      }
      nodes[i].vx = fx; nodes[i].vy = fy; nodes[i].vz = fz;
    }
    for (const [a, b] of edges) {
      const dx = nodes[a].x - nodes[b].x;
      const dy = nodes[a].y - nodes[b].y;
      const dz = nodes[a].z - nodes[b].z;
      const d = Math.sqrt(dx*dx + dy*dy + dz*dz) + 0.01;
      const f = (d*d) / k;
      const ux = dx/d, uy = dy/d, uz = dz/d;
      nodes[a].vx -= ux * f; nodes[a].vy -= uy * f; nodes[a].vz -= uz * f;
      nodes[b].vx += ux * f; nodes[b].vy += uy * f; nodes[b].vz += uz * f;
    }
    for (const n of nodes) {
      n.vx -= n.x * 0.02;
      n.vy -= n.y * 0.02;
      n.vz -= n.z * 0.02;
      const sp = Math.sqrt(n.vx*n.vx + n.vy*n.vy + n.vz*n.vz);
      const cap = 30 * cooling;
      const s = sp > cap ? cap / sp : 1;
      n.x += n.vx * s * 0.05;
      n.y += n.vy * s * 0.05;
      n.z += n.vz * s * 0.05;
    }
  }
}

function relaxKamadaKawai(nodes, edges, opts = {}) {
  // Compute graph-theoretic distances (BFS), then minimize stress.
  const N = nodes.length;
  const adj = Array.from({length: N}, () => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
  // BFS distances
  const dist = Array.from({length: N}, () => new Array(N).fill(Infinity));
  for (let s = 0; s < N; s++) {
    dist[s][s] = 0;
    const q = [s];
    while (q.length) {
      const u = q.shift();
      for (const v of adj[u]) {
        if (dist[s][v] === Infinity) { dist[s][v] = dist[s][u] + 1; q.push(v); }
      }
    }
  }
  const L = CFG_LAYOUT.springIdealDist ?? 200; // ideal edge length
  // Replace infinity (disconnected) with diameter
  let diameter = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++)
    if (dist[i][j] !== Infinity && dist[i][j] > diameter) diameter = dist[i][j];
  if (!diameter) diameter = 1;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++)
    if (dist[i][j] === Infinity) dist[i][j] = diameter + 1;

  // Iterative stress majorization (gradient descent in 3D)
  const iters = opts.iters || (CFG_LAYOUT.kkIters ?? 200);
  for (let iter = 0; iter < iters; iter++) {
    const lr = 1 - iter / iters;
    for (let i = 0; i < N; i++) {
      let gx = 0, gy = 0, gz = 0;
      for (let j = 0; j < N; j++) {
        if (i === j) continue;
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        const d = Math.sqrt(dx*dx + dy*dy + dz*dz) + 0.01;
        const target = L * dist[i][j];
        const w = 1 / (target * target);
        const factor = w * (1 - target / d);
        gx += factor * dx;
        gy += factor * dy;
        gz += factor * dz;
      }
      nodes[i].x -= gx * lr * 0.5;
      nodes[i].y -= gy * lr * 0.5;
      nodes[i].z -= gz * lr * 0.5;
    }
  }
}

function buildGraph(nodeCount, density, layout, blogPosts) {
  const items = buildNodeList(nodeCount, blogPosts);
  let nodes;
  if (layout === "random") nodes = layoutRandom(items);
  else if (layout === "spherical") nodes = layoutSpherical(items);
  else nodes = layoutSpherical(items); // start point for spring/KK
  nodes = nodes.map(n => ({...n, vx:0, vy:0, vz:0}));

  const edges = makeEdges(nodes, density);
  if (layout === "spring") relaxSpring(nodes, edges);
  else if (layout === "kamada-kawai") relaxKamadaKawai(nodes, edges);

  // recenter (skip for random — keep spread)
  if (layout !== "random") {
    let cx=0,cy=0,cz=0;
    nodes.forEach(n => { cx+=n.x; cy+=n.y; cz+=n.z; });
    cx/=nodes.length; cy/=nodes.length; cz/=nodes.length;
    nodes.forEach(n => { n.x-=cx; n.y-=cy; n.z-=cz; });
  }
  return { nodes, edges };
}

// ── Quaternion utils ────────────────────────────────────────────────
function qIdentity() { return [1,0,0,0]; }
function qMul(a, b) { return [
  a[0]*b[0] - a[1]*b[1] - a[2]*b[2] - a[3]*b[3],
  a[0]*b[1] + a[1]*b[0] + a[2]*b[3] - a[3]*b[2],
  a[0]*b[2] - a[1]*b[3] + a[2]*b[0] + a[3]*b[1],
  a[0]*b[3] + a[1]*b[2] - a[2]*b[1] + a[3]*b[0],
]; }
function qFromAxisAngle(axis, angle) {
  const s = Math.sin(angle/2);
  return [Math.cos(angle/2), axis[0]*s, axis[1]*s, axis[2]*s];
}
function qNormalize(q) {
  const n = Math.hypot(q[0],q[1],q[2],q[3]) || 1;
  return [q[0]/n, q[1]/n, q[2]/n, q[3]/n];
}
function qConj(q) { return [q[0], -q[1], -q[2], -q[3]]; }
function qSlerp(a, b, t) {
  let dot = a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3];
  if (dot < 0) { b = [-b[0],-b[1],-b[2],-b[3]]; dot = -dot; }
  if (dot > 0.9995) return qNormalize([a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t, a[3]+(b[3]-a[3])*t]);
  const theta0 = Math.acos(dot);
  const theta = theta0 * t;
  const sinTheta0 = Math.sin(theta0);
  const s1 = Math.cos(theta) - dot * Math.sin(theta) / sinTheta0;
  const s2 = Math.sin(theta) / sinTheta0;
  return [a[0]*s1+b[0]*s2, a[1]*s1+b[1]*s2, a[2]*s1+b[2]*s2, a[3]*s1+b[3]*s2];
}
function qApply(q, v) {
  const x=v[0], y=v[1], z=v[2];
  const qw=q[0], qx=q[1], qy=q[2], qz=q[3];
  const tx = 2*(qy*z - qz*y);
  const ty = 2*(qz*x - qx*z);
  const tz = 2*(qx*y - qy*x);
  return [
    x + qw*tx + (qy*tz - qz*ty),
    y + qw*ty + (qz*tx - qx*tz),
    z + qw*tz + (qx*ty - qy*tx),
  ];
}
function qFromTo(from, to) {
  const d = from[0]*to[0]+from[1]*to[1]+from[2]*to[2];
  if (d > 0.9999) return qIdentity();
  if (d < -0.9999) {
    let axis = [1,0,0];
    if (Math.abs(from[0]) > 0.9) axis = [0,1,0];
    const a = [from[1]*axis[2]-from[2]*axis[1], from[2]*axis[0]-from[0]*axis[2], from[0]*axis[1]-from[1]*axis[0]];
    const n = Math.hypot(a[0],a[1],a[2]);
    return [0, a[0]/n, a[1]/n, a[2]/n];
  }
  const c = [from[1]*to[2]-from[2]*to[1], from[2]*to[0]-from[0]*to[2], from[0]*to[1]-from[1]*to[0]];
  const w = 1 + d;
  return qNormalize([w, c[0], c[1], c[2]]);
}

function easeSigmoid(t) {
  const k = 8;
  const f = (x) => 1/(1+Math.exp(-k*(x-0.5)));
  const f0 = f(0), f1 = f(1);
  return (f(t) - f0) / (f1 - f0);
}

// ── Helpers for cut/SER ────────────────────────────────────────────
function edgeKey(a, b) { return a < b ? a + "-" + b : b + "-" + a; }
function pointToSegmentDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx*dx + dy*dy;
  let t = lenSq > 0 ? ((px-ax)*dx + (py-ay)*dy) / lenSq : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t*dx, cy = ay + t*dy;
  return Math.hypot(px - cx, py - cy);
}

// ── Component ───────────────────────────────────────────────────────
function Graph({
  nodeCount = 16, density = 0.5, speed = 1, dark = false,
  layout = "spring", blogPosts = [],
  zoom = 1, onZoomChange,
  curveStrength = 0,
  aside = false,
  onNavigate,
  perturbTrigger = 0,
  perturbLoop = false,
  cutMode = false,
}) {
  const wrapRef = React.useRef(null);
  const tooltipRef = React.useRef(null);
  const [graph, setGraph] = React.useState(() => buildGraph(nodeCount, density, layout, blogPosts));
  const [hover, setHover] = React.useState(null);
  const [hoverEdge, setHoverEdge] = React.useState(null);
  
  const posRef = React.useRef(graph.nodes.map(n => ({x:n.x, y:n.y, z:n.z})));

  React.useEffect(() => {
    posRef.current = graph.nodes.map(n => ({x:n.x, y:n.y, z:n.z}));
  }, [graph]);

  const stateRef = React.useRef({
    q: qIdentity(),
    targetQ: null,
    qStart: null,
    animStart: 0,
    animDur: 0,
    idleSpin: true,
    rotating: false,
    nodeDrag: null,
    lastX: 0, lastY: 0,
    dragStartX: 0, dragStartY: 0,
    velX: 0, velY: 0,
    lastInteract: performance.now(),
    projected: [],
    ser: [],
    activatedAt: [],
    pulseScale: [],
    adj: [],
    cutNodes: new Set(),
    cutEdges: new Set(),
    perturbLoop: false,
    lastKick: 0,
    lastSerTick: 0,
  });

  React.useEffect(() => {
    const N = graph.nodes.length;
    const s = stateRef.current;
    s.ser = new Array(N).fill("S");
    s.activatedAt = new Array(N).fill(0);
    s.pulseScale = new Array(N).fill(1);
    s.adj = Array.from({length: N}, () => []);
    for (const [a, b] of graph.edges) {
      s.adj[a].push(b);
      s.adj[b].push(a);
    }
    s.cutNodes = new Set();
    s.cutEdges = new Set();
    s.lastKick = 0;
    s.lastSerTick = 0;
  }, [graph]);

  const kickSER = React.useCallback(() => {
    const s = stateRef.current;
    const N = graph.nodes.length;
    if (!s.ser.length) return;
    const candidates = [];
    for (let i = 0; i < N; i++) {
      if (s.ser[i] === "S" && !s.cutNodes.has(i)) candidates.push(i);
    }
    if (!candidates.length) return;
    const k = Math.min(candidates.length, 1 + Math.floor(Math.random() * 2));
    const picked = new Set();
    for (let n = 0; n < k * 4 && picked.size < k; n++) {
      picked.add(candidates[Math.floor(Math.random() * candidates.length)]);
    }
    const now = performance.now();
    picked.forEach(idx => {
      s.ser[idx] = "E";
      s.activatedAt[idx] = now;
    });
    s.lastKick = now;
  }, [graph]);

  const stepSER = React.useCallback(() => {
    const s = stateRef.current;
    const N = graph.nodes.length;
    const ser = s.ser;
    if (!ser.length) return true;
    const newSer = ser.slice();
    const wasE = ser.map(x => x === "E");
    const now = performance.now();
    for (let i = 0; i < N; i++) {
      if (s.cutNodes.has(i)) { newSer[i] = "S"; continue; }
      if (ser[i] === "E") {
        newSer[i] = "R";
      } else if (ser[i] === "R") {
        if (Math.random() < 0.35) newSer[i] = "S";
      } else {
        const neighbors = s.adj[i] || [];
        let any = false;
        for (const j of neighbors) {
          if (s.cutNodes.has(j)) continue;
          if (s.cutEdges.has(edgeKey(i, j))) continue;
          if (wasE[j]) { any = true; break; }
        }
        if (any && Math.random() < 0.45) {
          newSer[i] = "E";
          s.activatedAt[i] = now;
        }
      }
    }
    s.ser = newSer;
    return newSer.every(x => x === "S");
  }, [graph]);

  React.useEffect(() => {
    if (perturbTrigger > 0) kickSER();
  }, [perturbTrigger, kickSER]);

  React.useEffect(() => {
    stateRef.current.perturbLoop = perturbLoop;
  }, [perturbLoop]);

  React.useEffect(() => {
    setGraph(buildGraph(nodeCount, density, layout, blogPosts));
  }, [nodeCount, density, layout, blogPosts]);

  React.useEffect(() => {
    window.__kfRecenter = () => {
      const s = stateRef.current;
      s.qStart = s.q.slice();
      s.targetQ = qIdentity();
      s.animStart = performance.now();
      s.animDur = 700;
      s.idleSpin = true;
      s.velX = 0; s.velY = 0;
      posRef.current = graph.nodes.map(n => ({x:n.x, y:n.y, z:n.z}));
      s.lastInteract = performance.now();
    };
    window.__kfUncutAll = () => {
      const s = stateRef.current;
      s.cutNodes.clear();
      s.cutEdges.clear();
    };
    return () => {
      if (window.__kfRecenter) delete window.__kfRecenter;
      if (window.__kfUncutAll) delete window.__kfUncutAll;
    };
  }, [graph]);

  // THREE.JS SETUP
  const threeRef = React.useRef(null);
  
  React.useEffect(() => {
    if (!wrapRef.current || !window.THREE) return;
    const container = wrapRef.current;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(
      dark ? 0x0a0a0a : 0xfaf9f5,
      CFG_SCENE.fogNear  ?? 500,
      CFG_SCENE.fogFar   ?? 1100
    );

    const camera = new THREE.PerspectiveCamera(
      CFG_SCENE.cameraFov  ?? 45,
      container.clientWidth / container.clientHeight,
      CFG_SCENE.cameraNear ?? 10,
      CFG_SCENE.cameraFar  ?? 3000
    );
    camera.position.z = CFG_SCENE.cameraZ ?? 800;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const sprites = [];
    const spriteGroup = new THREE.Group();
    scene.add(spriteGroup);

    const maxInstances = 12000;
    const baseCylGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, false);
    baseCylGeo.translate(0, 0.5, 0);

    // --- Edge depth-of-field shaders ---
    // Fully explicit GLSL — no #include chunks — for maximum compatibility
    const edgeVertexShader = `
      attribute float instanceOpacity;
      varying float vOpacity;
      varying float vFogDepth;
      void main() {
        vOpacity = instanceOpacity;
        vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        vFogDepth = -mvPosition.z;
      }
    `;
    const edgeFragmentShader = `
      precision highp float;
      uniform vec3 color;
      uniform float baseOpacity;
      uniform vec3 fogColor;
      uniform float fogNear;
      uniform float fogFar;
      varying float vOpacity;
      varying float vFogDepth;
      void main() {
        float alpha = baseOpacity * vOpacity;
        // Mix color toward fog/background instead of using transparency
        // so edges stay opaque and write to depth buffer correctly
        float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
        vec3 faded = mix(fogColor, color, alpha);
        gl_FragColor = vec4(mix(faded, fogColor, fogFactor), 1.0);
      }
    `;

    const makeEdgeMat = (hex, opacity) => new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib['fog'],
        { color: { value: new THREE.Color(hex) }, baseOpacity: { value: opacity } }
      ]),
      vertexShader: edgeVertexShader,
      fragmentShader: edgeFragmentShader,
      transparent: false,
      depthWrite: true,
      fog: true
    });

    const regMat  = makeEdgeMat(dark ? 0xf4f4f0 : 0x000000, 1.0);
    const cutMat  = makeEdgeMat(dark ? 0xf4f4f0 : 0x000000, 0.15);
    const hoverMat = makeEdgeMat(0xF53A61, 1.0);

    // Each InstancedMesh needs its own geometry clone so per-instance opacity is independent
    const makeEdgeGeo = () => {
      const g = baseCylGeo.clone();
      const arr = new Float32Array(maxInstances).fill(1.0);
      g.setAttribute('instanceOpacity', new THREE.InstancedBufferAttribute(arr, 1));
      return g;
    };
    const regGeo = makeEdgeGeo();
    const cutGeo = makeEdgeGeo();
    const hoverGeo = makeEdgeGeo();

    const regTubes   = new THREE.InstancedMesh(regGeo,   regMat,   maxInstances);
    const cutTubes   = new THREE.InstancedMesh(cutGeo,   cutMat,   maxInstances);
    const hoverTubes = new THREE.InstancedMesh(hoverGeo, hoverMat, maxInstances);
    
    regTubes.count = 0;
    cutTubes.count = 0;
    hoverTubes.count = 0;
    
    // Force edges to render BEFORE nodes so nodes occlude them
    regTubes.renderOrder = 0;
    cutTubes.renderOrder = 0;
    hoverTubes.renderOrder = 0;

    spriteGroup.add(regTubes);
    spriteGroup.add(cutTubes);
    spriteGroup.add(hoverTubes);

    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    threeRef.current = {
      scene, camera, renderer, spriteGroup, sprites,
      regTubes, cutTubes, hoverTubes, regMat, cutMat, hoverMat, maxInstances,
      regGeo, cutGeo, hoverGeo
    };

    return () => {
      ro.disconnect();
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  React.useEffect(() => {
    const t = threeRef.current;
    if (!t) return;
    
    t.scene.fog.color.setHex(dark ? 0x0a0a0a : 0xfaf9f5);
    t.regMat.uniforms.color.value.setHex(dark ? 0xf4f4f0 : 0x000000);
    t.cutMat.uniforms.color.value.setHex(dark ? 0xf4f4f0 : 0x000000);
  }, [dark]);

  React.useEffect(() => {
    const t = threeRef.current;
    if (!t) return;
    const { spriteGroup, sprites } = t;

    const vertexShader = `
      varying vec2 vUv;
      #include <fog_pars_vertex>
      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `;

    const fragmentShader = `
      uniform vec3 color;
      uniform float opacity;
      uniform float blur;
      varying vec2 vUv;
      #include <fog_pars_fragment>

      void main() {
        float d = distance(vUv, vec2(0.5));
        if (d > 0.5) discard;
        
        float aa = 0.02;
        float edge0 = max(0.0, 0.5 - blur - aa);
        float edge1 = 0.5;
        float alpha = 1.0 - smoothstep(edge0, edge1, d);
        
        gl_FragColor = vec4(color, opacity * alpha);
        
        #include <fog_fragment>
      }
    `;

    while (sprites.length < graph.nodes.length) {
      const geo = new THREE.PlaneGeometry(1, 1);
      const mat = new THREE.ShaderMaterial({
        uniforms: window.THREE.UniformsUtils.merge([
            window.THREE.UniformsLib['fog'],
            {
                color: { value: new THREE.Color() },
                opacity: { value: 1.0 },
                blur: { value: 0.0 }
            }
        ]),
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        fog: true
      });
      const s = new THREE.Mesh(geo, mat);
      // Ensure nodes render AFTER edges
      s.renderOrder = 1;
      sprites.push(s);
      spriteGroup.add(s);
    }
    while (sprites.length > graph.nodes.length) {
      const s = sprites.pop();
      spriteGroup.remove(s);
    }
  }, [graph]);

  function getQuadraticBezierPoint(t, p0, p1, p2) {
      const k1 = (1 - t) * (1 - t);
      const k2 = 2 * (1 - t) * t;
      const k3 = t * t;
      return [
          k1 * p0[0] + k2 * p1[0] + k3 * p2[0],
          k1 * p0[1] + k2 * p1[1] + k3 * p2[1],
          k1 * p0[2] + k2 * p1[2] + k3 * p2[2]
      ];
  }

  React.useEffect(() => {
    const t = threeRef.current;
    if (!t) return;
    
    let raf;
    let last = performance.now();

    const palette = dark ? {
      node: 0xf4f4f0,
      filler: 0x5a5a58,
      hoverInt: 0xF53A61,
      hoverExt: 0x5b9eff,
      active: 0xFFB627,
      activeR: 0xa36e1a,
      cutFlash: 0xF53A61,
    } : {
      node: 0x111111,
      filler: 0x9a9a99,
      hoverInt: 0xF53A61,
      hoverExt: 0x004992,
      active: 0xF39C12,
      activeR: 0x7a4f08,
      cutFlash: 0xF53A61,
    };

    const dummy = new window.THREE.Object3D();
    const up = new window.THREE.Vector3(0, 1, 0);
    const dir = new window.THREE.Vector3();

    const draw = (now) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min(50, now - last); last = now;
      const s = stateRef.current;

      if (graph.nodes.length && now - s.lastSerTick > 350) {
        s.lastSerTick = now;
        const anyActive = s.ser.some(x => x !== "S");
        if (anyActive) {
          const dead = stepSER();
          if (dead && s.perturbLoop && now - s.lastKick > 900) {
            kickSER();
          }
        } else if (s.perturbLoop && now - s.lastKick > 900) {
          kickSER();
        }
      }

      if (s.targetQ) {
        const pct = Math.min(1, (now - s.animStart) / s.animDur);
        const eased = easeSigmoid(pct);
        s.q = qSlerp(s.qStart, s.targetQ, eased);
        if (pct >= 1) { s.targetQ = null; s.idleSpin = true; }
      } else if (!s.rotating && !s.nodeDrag) {
        if (Math.abs(s.velX) > 0.0001 || Math.abs(s.velY) > 0.0001) {
          const axis = [s.velY, s.velX, 0];
          const n = Math.hypot(axis[0],axis[1],axis[2]);
          if (n > 0.0001) {
            const dq = qFromAxisAngle([axis[0]/n, axis[1]/n, axis[2]/n], n);
            s.q = qNormalize(qMul(dq, s.q));
          }
          s.velX *= 0.93; s.velY *= 0.93;
        } else if (s.idleSpin && (now - s.lastInteract) > (CFG_IDLE.idleDelay ?? 800) && !aside) {
          const ang = (CFG_IDLE.spinRate ?? 0.0009) * speed * (dt/16.67);
          const dq = qFromAxisAngle([0,1,0], ang);
          s.q = qNormalize(qMul(dq, s.q));
        } else if (s.idleSpin && (now - s.lastInteract) > (CFG_IDLE.asideIdleDelay ?? 1500) && aside) {
          const ang = (CFG_IDLE.asideSpinRate ?? 0.0004) * speed * (dt/16.67);
          const dq = qFromAxisAngle([0,1,0], ang);
          s.q = qNormalize(qMul(dq, s.q));
        }
      }

      const N = graph.nodes.length;
      for (let i = 0; i < N; i++) {
        const st = s.ser[i];
        const target = (st === "E") ? 0.85 : (st === "R" ? 0.92 : 1.0);
        s.pulseScale[i] = (s.pulseScale[i] || 1) + (target - (s.pulseScale[i] || 1)) * 0.12;
      }

      const projected = [];
      const pos = posRef.current;
      
      let minZ = Infinity, maxZ = -Infinity;
      const vArray = [];

      for (let i = 0; i < N; i++) {
        const p = pos[i];
        const sc = s.pulseScale[i] || 1;
        
        let wox = 0, woy = 0, woz = 0;
        const sinceAct = now - (s.activatedAt[i] || 0);
        if (sinceAct < 800 && s.ser[i] !== "S") {
          const decay = Math.max(0, 1 - sinceAct / 800);
          const phase = i * 12.7;
          const amp = 7 * decay;
          wox = amp * Math.sin(sinceAct * 0.04 + phase);
          woy = amp * Math.cos(sinceAct * 0.05 + phase * 1.3);
          woz = amp * 0.5 * Math.sin(sinceAct * 0.06 + phase * 0.7);
        }
        
        const v = qApply(s.q, [p.x * sc + wox, p.y * sc + woy, p.z * sc + woz]);
        vArray.push(v);
        if (v[2] < minZ) minZ = v[2];
        if (v[2] > maxZ) maxZ = v[2];
      }

      const zRange = Math.max(1, maxZ - minZ);
      t.camera.fov = (CFG_SCENE.cameraFov ?? 45) / zoom;
      t.camera.updateProjectionMatrix();

      for (let i = 0; i < N; i++) {
        const v = vArray[i];
        const sprite = t.sprites[i];
        if (sprite) {
            sprite.position.set(v[0], v[1], v[2]);
            sprite.quaternion.copy(t.camera.quaternion);
            
            const isHoverThis = hover === i && graph.nodes[i].clickable && !cutMode;
            const isHoverCut = cutMode && hover === i && graph.nodes[i].clickable;
            const isClickable = graph.nodes[i].clickable;
            const isExternal = graph.nodes[i].kind === "external";
            const serState = s.ser[i] || "S";
            const isCut = s.cutNodes.has(i);

            let fill;
            if (serState === "E") fill = palette.active;
            else if (serState === "R") fill = palette.activeR;
            else if (isHoverCut) fill = palette.cutFlash;
            else if (isHoverThis) fill = isExternal ? palette.hoverExt : palette.hoverInt;
            else if (!isClickable) fill = palette.filler;
            else fill = palette.node;

            const baseR = (CFG_NODES.baseRadius ?? 26.4)
              * (isHoverThis ? (CFG_NODES.hoverScale ?? 1.45) : 1.0)
              * (!isClickable ? (CFG_NODES.fillerScale ?? 0.78) : 1.0);
            sprite.scale.set(baseR, baseR, 1);

            const depthT = (v[2] - minZ) / zRange;
            const blurAmt = (1 - depthT) * (CFG_DOF.nodeBlurMax ?? 0.585);
            
            // Keep opacity 1.0 unless cut so the core is opaque and occludes edges.
            // The shader's Fog injection will handle fading the color into the background!
            const opacity = isCut ? 0.2 : 1.0;

            sprite.material.uniforms.color.value.setHex(fill);
            sprite.material.uniforms.opacity.value = opacity;
            sprite.material.uniforms.blur.value = blurAmt;
            
            projected.push({
                i, n: graph.nodes[i],
                px: v[0], py: v[1], z: v[2],
                isHoverThis,
                label: graph.nodes[i].label,
                isExternal
            });
        }
      }

      let regCount = 0;
      let cutCount = 0;
      let hoverCount = 0;

      // Opacity arrays for depth-of-field on edges
      const regOpArr   = t.regGeo.getAttribute('instanceOpacity').array;
      const cutOpArr   = t.cutGeo.getAttribute('instanceOpacity').array;
      const hoverOpArr = t.hoverGeo.getAttribute('instanceOpacity').array;

      const pushTubeSegment = (pA, pB, type) => {
          const dx = pB[0] - pA[0];
          const dy = pB[1] - pA[1];
          const dz = pB[2] - pA[2];
          const dist = Math.hypot(dx, dy, dz);
          if (dist < 0.001) return;

          // Depth-of-field: compute opacity & defocus thickness from midpoint z
          const midZ = (pA[2] + pB[2]) / 2;
          const edgeDepthT = zRange > 1 ? (midZ - minZ) / zRange : 1; // 0 = far, 1 = close
          const _opMin = CFG_DOF.edgeOpacityMin ?? 0.03;
          const edgeOpacity = _opMin + edgeDepthT * (1 - _opMin);
          const defocusScale = 1.0 + (1 - edgeDepthT) * (CFG_DOF.edgeDefocusMax ?? 0.91);

          dummy.position.set(pA[0], pA[1], pA[2]);
          dir.set(dx/dist, dy/dist, dz/dist);
          dummy.quaternion.setFromUnitVectors(up, dir);
          
          const baseRadius = (type === 2 ? (CFG_NODES.hoverEdgeThickness ?? 1.5) : (CFG_NODES.edgeThickness ?? 0.8)) * zoom;
          const radius = baseRadius * defocusScale;
          dummy.scale.set(radius, dist, radius);
          dummy.updateMatrix();

          if (type === 0 && regCount < t.maxInstances) {
            regOpArr[regCount] = edgeOpacity;
            t.regTubes.setMatrixAt(regCount++, dummy.matrix);
          } else if (type === 1 && cutCount < t.maxInstances) {
            cutOpArr[cutCount] = edgeOpacity;
            t.cutTubes.setMatrixAt(cutCount++, dummy.matrix);
          } else if (type === 2 && hoverCount < t.maxInstances) {
            hoverOpArr[hoverCount] = 1.0; // hovered edges stay fully visible
            t.hoverTubes.setMatrixAt(hoverCount++, dummy.matrix);
          }
      };

      for (let ei = 0; ei < graph.edges.length; ei++) {
        const [a, b] = graph.edges[ei];
        if (!projected[a] || !projected[b]) continue;
        
        const isCut = s.cutEdges.has(edgeKey(a, b)) || s.cutNodes.has(a) || s.cutNodes.has(b);
        const isHoverEdge = cutMode && hoverEdge === ei;
        
        const pa = projected[a];
        const pb = projected[b];
        
        const type = isHoverEdge ? 2 : (isCut ? 1 : 0);

        if (curveStrength > 0.001) {
            const mx = (pa.px + pb.px) / 2;
            const my = (pa.py + pb.py) / 2;
            const mz = (pa.z + pb.z) / 2;
            const cxp = mx + (0 - mx) * curveStrength;
            const cyp = my + (0 - my) * curveStrength;
            const czp = mz + (0 - mz) * curveStrength;
            
            const p0 = [pa.px, pa.py, pa.z];
            const p1 = [cxp, cyp, czp];
            const p2 = [pb.px, pb.py, pb.z];
            
            let lastP = p0;
            const steps = 16;
            for (let idx = 1; idx <= steps; idx++) {
                const tv = idx / steps;
                const p = getQuadraticBezierPoint(tv, p0, p1, p2);
                pushTubeSegment(lastP, p, type);
                lastP = p;
            }
        } else {
            pushTubeSegment([pa.px, pa.py, pa.z], [pb.px, pb.py, pb.z], type);
        }
      }
      
      t.regTubes.count = regCount;
      t.regTubes.instanceMatrix.needsUpdate = true;
      t.regGeo.getAttribute('instanceOpacity').needsUpdate = true;
      t.cutTubes.count = cutCount;
      t.cutTubes.instanceMatrix.needsUpdate = true;
      t.cutGeo.getAttribute('instanceOpacity').needsUpdate = true;
      t.hoverTubes.count = hoverCount;
      t.hoverTubes.instanceMatrix.needsUpdate = true;
      t.hoverGeo.getAttribute('instanceOpacity').needsUpdate = true;

      if (tooltipRef.current) {
         const hoveredProj = projected.find(p => p.isHoverThis && p.label);
         if (hoveredProj) {
             const vec = new THREE.Vector3(hoveredProj.px, hoveredProj.py, hoveredProj.z);
             vec.project(t.camera);
             const w = wrapRef.current.clientWidth;
             const h = wrapRef.current.clientHeight;
             const sx = (vec.x * .5 + .5) * w;
             const sy = (vec.y * -.5 + .5) * h;
             
             // Dynamically calculate the node's pixel radius on screen
             const worldRadius = ((CFG_NODES.baseRadius ?? 26.4) * (CFG_NODES.hoverScale ?? 1.45)) / 2;
             const vecRight = new THREE.Vector3(hoveredProj.px + worldRadius, hoveredProj.py, hoveredProj.z).project(t.camera);
             const sxRight = (vecRight.x * .5 + .5) * w;
             const pixelRadius = Math.abs(sxRight - sx);
             
             const col = hoveredProj.isExternal ? (dark ? "#5b9eff" : "#004992") : "#F53A61";
             tooltipRef.current.style.display = "block";
             tooltipRef.current.style.left = (sx + pixelRadius + 10) + "px";
             tooltipRef.current.style.top = sy + "px";
             tooltipRef.current.style.color = col;
             tooltipRef.current.innerText = hoveredProj.label;
         } else {
             tooltipRef.current.style.display = "none";
         }
      }

      s.projected = projected;

      t.renderer.render(t.scene, t.camera);
    };
    
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [graph, dark, zoom, speed, aside, hover, hoverEdge, cutMode, kickSER, stepSER, perturbLoop, curveStrength]);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el || !onZoomChange) return;
    const onWheel = (e) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015);
      onZoomChange(Math.max(0.4, Math.min(2.6, zoom * factor)));
      stateRef.current.lastInteract = performance.now();
    };
    el.addEventListener("wheel", onWheel, {passive: false});
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoom, onZoomChange]);

  const getHit = (e) => {
      const t = threeRef.current;
      if (!t || !wrapRef.current) return { hitNode: null, hitEdge: null };
      
      const rect = wrapRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const mouse = new THREE.Vector2();
      mouse.x = (x / rect.width) * 2 - 1;
      mouse.y = -(y / rect.height) * 2 + 1;
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, t.camera);
      raycaster.params.Line.threshold = 4 / zoom; 

      const intersects = raycaster.intersectObjects(t.spriteGroup.children, true);
      
      let hitNode = null;
      let hitEdge = null;

      if (intersects.length > 0) {
          const spriteInt = intersects.find(i => i.object.type === "Mesh");
          if (spriteInt) {
              const idx = t.sprites.indexOf(spriteInt.object);
              if (idx !== -1) hitNode = idx;
          }
      }
      
      if (cutMode && hitNode == null) {
          let bestE = null, bestD = 7;
          const s = stateRef.current;
          const proj = s.projected || [];
          if (proj.length) {
              for (let ei = 0; ei < graph.edges.length; ei++) {
                  const [a, b] = graph.edges[ei];
                  const pa = proj.find(p=>p.i===a), pb = proj.find(p=>p.i===b);
                  if(!pa || !pb) continue;
                  
                  const va = new THREE.Vector3(pa.px, pa.py, pa.z).project(t.camera);
                  const vb = new THREE.Vector3(pb.px, pb.py, pb.z).project(t.camera);
                  
                  const ax = (va.x * .5 + .5) * rect.width;
                  const ay = (va.y * -.5 + .5) * rect.height;
                  const bx = (vb.x * .5 + .5) * rect.width;
                  const by = (vb.y * -.5 + .5) * rect.height;
                  
                  const d = pointToSegmentDist(x, y, ax, ay, bx, by);
                  if (d < bestD) { bestD = d; bestE = ei; }
              }
              hitEdge = bestE;
          }
      }

      return { hitNode, hitEdge };
  };

  const rotateNodeToFront = (idx, after) => {
    const s = stateRef.current;
    const p = posRef.current[idx];
    const len = Math.hypot(p.x, p.y, p.z) || 1;
    const dir = [p.x/len, p.y/len, p.z/len];
    const rotated = qApply(s.q, dir);
    const rlen = Math.hypot(rotated[0], rotated[1], rotated[2]) || 1;
    const cur = [rotated[0]/rlen, rotated[1]/rlen, rotated[2]/rlen];
    const r = qFromTo(cur, [0,0,1]);
    s.qStart = s.q.slice();
    s.targetQ = qNormalize(qMul(r, s.q));
    s.animStart = performance.now();
    s.animDur = 1100;
    s.idleSpin = false;
    setTimeout(() => after?.(), 1100);
  };

  const onPointerDown = (e) => {
    const { hitNode, hitEdge } = getHit(e);
    setHover(hitNode);
    setHoverEdge(hitEdge);

    const s = stateRef.current;
    s.lastX = e.clientX; s.lastY = e.clientY;
    s.dragStartX = e.clientX; s.dragStartY = e.clientY;
    s.velX = 0; s.velY = 0;
    s.targetQ = null;
    s.idleSpin = false;
    e.currentTarget.setPointerCapture(e.pointerId);

    if (hitNode != null && !cutMode) {
      const pos = posRef.current[hitNode];
      const v = qApply(s.q, [pos.x, pos.y, pos.z]);
      s.nodeDrag = { idx: hitNode, vz: v[2] };
    } else {
      s.rotating = true;
    }
  };

  const onPointerMove = (e) => {
    const s = stateRef.current;

    if (!s.rotating && !s.nodeDrag) {
      const { hitNode, hitEdge } = getHit(e);
      setHover(hitNode);
      setHoverEdge(hitEdge);
    }

    if (s.nodeDrag) {
      const t = threeRef.current;
      if(!t) return;
      const rect = wrapRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width/2, cy = rect.height/2;
      const camZ = CFG_SCENE.cameraZ ?? 800;

      const persp = camZ / (camZ - s.nodeDrag.vz * zoom);
      const newVx = (x - cx) / (persp * zoom);
      const newVy = -(y - cy) / (persp * zoom); 
      
      const qInv = qConj(s.q);
      const worldNew = qApply(qInv, [newVx, newVy, s.nodeDrag.vz]);
      posRef.current[s.nodeDrag.idx] = { x: worldNew[0], y: worldNew[1], z: worldNew[2] };
      s.lastInteract = performance.now();
      return;
    }

    if (s.rotating) {
      const dx = e.clientX - s.lastX;
      const dy = e.clientY - s.lastY;
      s.lastX = e.clientX; s.lastY = e.clientY;
      const sens = 0.005;
      const ax = dy * sens;
      const ay = dx * sens;
      const axis = [ax, ay, 0];
      const n = Math.hypot(axis[0],axis[1],axis[2]);
      if (n > 0.0001) {
        const dq = qFromAxisAngle([axis[0]/n, axis[1]/n, axis[2]/n], n);
        s.q = qNormalize(qMul(dq, s.q));
      }
      s.velX = ay * 0.6;
      s.velY = ax * 0.6;
      s.lastInteract = performance.now();
    }
  };

  const onPointerUp = (e) => {
    const s = stateRef.current;
    s.rotating = false;
    s.nodeDrag = null;
    s.lastInteract = performance.now();
    e.currentTarget.releasePointerCapture?.(e.pointerId);

    const dx = e.clientX - s.dragStartX;
    const dy = e.clientY - s.dragStartY;
    const moved = Math.hypot(dx, dy);
    if (moved >= 5) return;

    const { hitNode, hitEdge } = getHit(e);

    if (cutMode) {
      if (hitNode != null) {
        const node = graph.nodes[hitNode];
        if (node.clickable) {
          if (s.cutNodes.has(hitNode)) s.cutNodes.delete(hitNode);
          else s.cutNodes.add(hitNode);
        }
      } else if (hitEdge != null) {
        const [a, b] = graph.edges[hitEdge];
        const k = edgeKey(a, b);
        if (s.cutEdges.has(k)) s.cutEdges.delete(k);
        else s.cutEdges.add(k);
      }
      return;
    }

    if (hitNode != null) {
      const node = graph.nodes[hitNode];
      if (node.clickable && !s.cutNodes.has(hitNode)) {
        if (node.kind === "external") {
          if (typeof window !== "undefined" && node.href) {
            window.open(node.href, "_blank", "noopener,noreferrer");
          }
        } else {
          rotateNodeToFront(hitNode, () => onNavigate?.(node.href));
        }
      }
    }
  };

  const cursorStyle = (() => {
    if (cutMode) {
      if (hover != null && graph.nodes[hover]?.clickable) return "crosshair";
      if (hoverEdge != null) return "crosshair";
      return "crosshair";
    }
    return hover != null && graph.nodes[hover]?.clickable ? "pointer" : "grab";
  })();

  return (
    <div
      ref={wrapRef}
      style={{ position: "absolute", inset: 0, overflow: "hidden", cursor: cursorStyle, touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => { setHover(null); setHoverEdge(null); }}
    >
      <div 
        ref={tooltipRef} 
        style={{
          position: 'absolute', 
          display: 'none', 
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontWeight: 500,
          fontSize: '16px',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          transform: 'translateY(-50%)',
          zIndex: 10
        }}
      ></div>
    </div>
  );
}

window.Graph = Graph;
