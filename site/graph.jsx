/* 3D node-graph landing.
   Features: drag-individual-nodes, drag-empty-space-rotates, click=>focus,
   zoom (wheel), 4 layout types, blog posts as nodes, "aside" mini-mode.
   Now also: SER perturbation model + scissors/cut mode.
*/

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
  return items.map(n => ({
    ...n,
    x: (Math.random() - 0.5) * 600,
    y: (Math.random() - 0.5) * 600,
    z: (Math.random() - 0.5) * 600,
  }));
}

function layoutSpherical(items) {
  // Fibonacci sphere — even spacing on a shell
  const N = items.length;
  return items.map((n, i) => {
    const phi = Math.acos(1 - 2 * (i + 0.5) / N);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = 280;
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
  const ideal = opts.ideal || 200;
  const k = ideal;
  const iters = opts.iters || 220;
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
  const L = 200; // ideal edge length
  // Replace infinity (disconnected) with diameter
  let diameter = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++)
    if (dist[i][j] !== Infinity && dist[i][j] > diameter) diameter = dist[i][j];
  if (!diameter) diameter = 1;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++)
    if (dist[i][j] === Infinity) dist[i][j] = diameter + 1;

  // Iterative stress majorization (gradient descent in 3D)
  const iters = opts.iters || 200;
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
  const canvasRef = React.useRef(null);
  const wrapRef = React.useRef(null);
  const [graph, setGraph] = React.useState(() => buildGraph(nodeCount, density, layout, blogPosts));
  const [hover, setHover] = React.useState(null);
  const [hoverEdge, setHoverEdge] = React.useState(null); // for cut-mode edge highlight
  const [size, setSize] = React.useState({w: 800, h: 600});
  // mutable node positions held in ref so we can drag in-place without re-layout
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
    // SER + cut state
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

  // Re-init SER state and adjacency when graph changes
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

  // SER helpers (closures over current graph)
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

  // External triggers
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
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({w: r.width, h: r.height});
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Wheel zoom — call onZoomChange so parent owns the value (lets it persist)
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

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    canvas.style.width = size.w + "px";
    canvas.style.height = size.h + "px";
    ctx.setTransform(dpr,0,0,dpr,0,0);

    let raf;
    let last = performance.now();

    const palette = dark ? {
      node: "#f4f4f0",          // internal clickable (page/theme/section/post)
      filler: "#5a5a58",         // non-clickable
      hoverInt: "#F53A61",       // red — hovered internal
      hoverExt: "#5b9eff",       // blue — hovered external (contact)
      active: "#FFB627",         // SER excited — bright
      activeR: "#a36e1a",        // SER refractory — faded
      label: "#F53A61",
      labelExt: "#5b9eff",
      cutFlash: "#F53A61",
    } : {
      node: "rgba(0,0,0,0.92)",
      filler: "#9a9a99",
      hoverInt: "#F53A61",
      hoverExt: "#004992",
      active: "#F39C12",
      activeR: "#7a4f08",
      label: "#F53A61",
      labelExt: "#004992",
      cutFlash: "#F53A61",
    };

    // Detect narrow viewports — mobile Safari handles ctx.filter blur poorly,
    // so we skip canvas blur there and rely on alpha/size/shadow cues instead.
    const isMobile = typeof window !== "undefined"
      && window.matchMedia
      && window.matchMedia("(max-width: 640px)").matches;

    const draw = (now) => {
      const dt = Math.min(50, now - last); last = now;
      const s = stateRef.current;

      // SER tick
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
        const t = Math.min(1, (now - s.animStart) / s.animDur);
        const eased = easeSigmoid(t);
        s.q = qSlerp(s.qStart, s.targetQ, eased);
        if (t >= 1) { s.targetQ = null; s.idleSpin = true; }
      } else if (!s.rotating && !s.nodeDrag) {
        if (Math.abs(s.velX) > 0.0001 || Math.abs(s.velY) > 0.0001) {
          const axis = [s.velY, s.velX, 0];
          const n = Math.hypot(axis[0],axis[1],axis[2]);
          if (n > 0.0001) {
            const dq = qFromAxisAngle([axis[0]/n, axis[1]/n, axis[2]/n], n);
            s.q = qNormalize(qMul(dq, s.q));
          }
          s.velX *= 0.93; s.velY *= 0.93;
        } else if (s.idleSpin && (now - s.lastInteract) > 800 && !aside) {
          const ang = 0.0009 * speed * (dt/16.67);
          const dq = qFromAxisAngle([0,1,0], ang);
          s.q = qNormalize(qMul(dq, s.q));
        } else if (s.idleSpin && (now - s.lastInteract) > 1500 && aside) {
          const ang = 0.0004 * speed * (dt/16.67);
          const dq = qFromAxisAngle([0,1,0], ang);
          s.q = qNormalize(qMul(dq, s.q));
        }
      }

      const w = size.w, h = size.h;
      const cx = w/2, cy = h/2;
      const cameraZ = 800;
      const pos = posRef.current;

      // Update pulse-scale per node (smooth pull-toward-center on activation)
      const N = graph.nodes.length;
      for (let i = 0; i < N; i++) {
        const st = s.ser[i];
        const target = (st === "E") ? 0.85 : (st === "R" ? 0.92 : 1.0);
        s.pulseScale[i] = s.pulseScale[i] + (target - s.pulseScale[i]) * 0.12;
      }

      const projected = graph.nodes.map((n, i) => {
        const p = pos[i];
        const sc = s.pulseScale[i] || 1;
        // Wobble offset for excited nodes
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
        const persp = cameraZ / (cameraZ - v[2] * zoom);
        return {
          i, n,
          px: cx + v[0] * persp * zoom,
          py: cy + v[1] * persp * zoom,
          z: v[2],
          scale: persp,
        };
      });

      const minZ = Math.min(...projected.map(p => p.z));
      const maxZ = Math.max(...projected.map(p => p.z));
      const zRange = Math.max(1, maxZ - minZ);

      ctx.clearRect(0,0,w,h);

      // World-space center for curve bending (origin since we recenter)
      const centerWorld = [0, 0, 0];
      const centerView = qApply(s.q, centerWorld);
      const cpersp = cameraZ / (cameraZ - centerView[2] * zoom);
      const centerPx = cx + centerView[0] * cpersp * zoom;
      const centerPy = cy + centerView[1] * cpersp * zoom;

      // ── Edges ─────────────────────────────────────────────────────
      for (let ei = 0; ei < graph.edges.length; ei++) {
        const [a, b] = graph.edges[ei];
        const pa = projected[a], pb = projected[b];
        const zMid = (pa.z + pb.z)/2;
        const t = (zMid - minZ) / zRange;
        const blur = (1 - t) * 8;
        const lw = (0.4 + t * 1.6) * zoom;
        const isCut = s.cutEdges.has(edgeKey(a, b)) || s.cutNodes.has(a) || s.cutNodes.has(b);
        const baseAlpha = 0.18 + t * 0.55;
        const alpha = isCut ? baseAlpha * 0.2 : baseAlpha;
        const isHoverEdge = cutMode && hoverEdge === ei;

        ctx.save();
        ctx.filter = (!isMobile && blur > 0.5) ? `blur(${blur.toFixed(1)}px)` : "none";
        if (isHoverEdge) {
          ctx.strokeStyle = palette.cutFlash;
          ctx.lineWidth = lw + 1.2;
        } else {
          ctx.strokeStyle = dark
            ? `rgba(244,244,240,${alpha.toFixed(2)})`
            : `rgba(0,0,0,${alpha.toFixed(2)})`;
          ctx.lineWidth = lw;
        }
        ctx.beginPath();
        ctx.moveTo(pa.px, pa.py);
        if (curveStrength > 0.001) {
          const mx = (pa.px + pb.px) / 2;
          const my = (pa.py + pb.py) / 2;
          const cxp = mx + (centerPx - mx) * curveStrength;
          const cyp = my + (centerPy - my) * curveStrength;
          ctx.quadraticCurveTo(cxp, cyp, pb.px, pb.py);
        } else {
          ctx.lineTo(pb.px, pb.py);
        }
        ctx.stroke();
        ctx.restore();
      }

      // ── Nodes ─────────────────────────────────────────────────────
      const sorted = [...projected].sort((a,b) => a.z - b.z);
      for (const p of sorted) {
        const t = (p.z - minZ) / zRange;
        const blur = (1 - t) * 10;
        // Slightly larger size variance for stronger depth on small screens
        const baseR = (4 + t * 11) * zoom;
        const isHoverThis = hover === p.i && p.n.clickable && !cutMode;
        const r = baseR * (isHoverThis ? 1.45 : 1);
        const isExternal = p.n.kind === "external";
        const isClickable = p.n.clickable;
        const isCut = s.cutNodes.has(p.i);
        const serState = s.ser[p.i] || "S";
        const isHoverCut = cutMode && hover === p.i && isClickable;

        let fill;
        if (serState === "E") {
          fill = palette.active;
        } else if (serState === "R") {
          fill = palette.activeR;
        } else if (isHoverCut) {
          fill = palette.cutFlash;
        } else if (isHoverThis) {
          fill = isExternal ? palette.hoverExt : palette.hoverInt;
        } else if (!isClickable) {
          fill = palette.filler;
        } else {
          fill = palette.node;
        }

        // Depth fade: far nodes more transparent. Active nodes stay vivid.
        const depthAlpha = serState !== "S" ? 1.0 : (0.45 + t * 0.55);
        const opacity = (isCut ? 0.2 : 1.0) * depthAlpha;

        ctx.save();
        ctx.filter = (!isMobile && blur > 0.5) ? `blur(${blur.toFixed(1)}px)` : "none";
        // Foreground halo — adds depth where canvas-blur is unavailable (mobile)
        if (t > 0.55 || serState === "E") {
          ctx.shadowColor = serState === "E" ? palette.active : fill;
          ctx.shadowBlur = serState === "E" ? 22 : (isMobile ? 14 : 10) * t;
        }
        ctx.globalAlpha = opacity;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(p.px, p.py, !isClickable ? r * 0.78 : r, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Glow ring for active
        if (serState === "E") {
          ctx.beginPath();
          ctx.arc(p.px, p.py, r * 1.9, 0, Math.PI*2);
          ctx.fillStyle = palette.active;
          ctx.globalAlpha = 0.18 * opacity;
          ctx.fill();
        }
        ctx.restore();

        // Label on hover (clickable nodes only)
        if (isHoverThis && t > 0.25 && p.n.label) {
          ctx.save();
          ctx.fillStyle = isExternal ? palette.labelExt : palette.label;
          ctx.font = "500 16px 'IBM Plex Sans', sans-serif";
          ctx.textBaseline = "middle";
          ctx.fillText(p.n.label, p.px + r + 12, p.py);
          ctx.restore();
        }
      }

      stateRef.current.projected = projected;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size, graph, hover, hoverEdge, speed, dark, zoom, aside, curveStrength, cutMode, stepSER, kickSER]);

  const getHit = (x, y) => {
    const s = stateRef.current;
    const proj = s.projected || [];
    let hitNode = null;
    let hitEdge = null;
    
    if (proj.length) {
      const sortedDesc = [...proj].sort((a,b)=>b.z-a.z);
      const minZ = Math.min(...proj.map(q=>q.z));
      const maxZ = Math.max(...proj.map(q=>q.z));
      const zRange = Math.max(1, maxZ - minZ);
      for (const p of sortedDesc) {
        const t = (p.z - minZ) / zRange;
        const r = (4 + t*11) * zoom;
        const dx = x - p.px, dy = y - p.py;
        if (dx*dx + dy*dy < (r + 8)*(r + 8)) { hitNode = p.i; break; }
      }
      
      if (cutMode && hitNode == null) {
        let bestE = null, bestD = 7;
        for (let ei = 0; ei < graph.edges.length; ei++) {
          const [a, b] = graph.edges[ei];
          const pa = proj[a], pb = proj[b];
          const d = pointToSegmentDist(x, y, pa.px, pa.py, pb.px, pb.py);
          if (d < bestD) { bestD = d; bestE = ei; }
        }
        hitEdge = bestE;
      }
    }
    return { hitNode, hitEdge };
  };

  const onPointerDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Immediate hit test for touch devices where hover isn't pre-populated
    const { hitNode, hitEdge } = getHit(x, y);
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
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const s = stateRef.current;

    if (!s.rotating && !s.nodeDrag) {
      const { hitNode, hitEdge } = getHit(x, y);
      setHover(hitNode);
      setHoverEdge(hitEdge);
    }

    if (s.nodeDrag) {
      const w = size.w, h = size.h;
      const cx = w/2, cy = h/2;
      const cameraZ = 800;
      const persp = cameraZ / (cameraZ - s.nodeDrag.vz * zoom);
      const newVx = (x - cx) / (persp * zoom);
      const newVy = (y - cy) / (persp * zoom);
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

    // Use synchronous hit test to ensure tapping works independently of state race conditions
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { hitNode, hitEdge } = getHit(x, y);

    if (cutMode) {
      // Cut a node or an edge
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
          // External link — open in new tab, no rotation/transition
          if (typeof window !== "undefined" && node.href) {
            window.open(node.href, "_blank", "noopener,noreferrer");
          }
        } else {
          rotateNodeToFront(hitNode, () => onNavigate?.(node.href));
        }
      }
    }
  };

  // Expose recenter + uncut handles to the host page
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
      style={{ position: "absolute", inset: 0, cursor: cursorStyle }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => { setHover(null); setHoverEdge(null); }}
        style={{display:"block", touchAction:"none"}}
      />
    </div>
  );
}

window.Graph = Graph;
