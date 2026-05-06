/* 3D node-graph landing.
   Features: drag-individual-nodes, drag-empty-space-rotates, click=>focus,
   zoom (wheel), 4 layout types, blog posts as nodes, "aside" mini-mode.
*/

const PAGES = [
  { id: "about",    label: "about",              href: "about",    clickable: true, kind: "page" },
  { id: "research", label: "research interests", href: "research", clickable: true, kind: "page" },
  { id: "cv",       label: "cv",                 href: "cv",       clickable: true, kind: "page" },
  { id: "blog",     label: "blog",               href: "blog",     clickable: true, kind: "page" },
  { id: "monkey",   label: "anxious monkey",     href: "monkey",   clickable: true, kind: "page" },
  { id: "contact",  label: "contact",            href: "contact",  clickable: true, kind: "page" },
];

function buildNodeList(nodeCount, blogPosts) {
  const postNodes = (blogPosts || []).map(p => ({
    id: p.id,
    label: p.title.toLowerCase().replace(/\.$/, ''),
    href: "blog/" + p.id,
    clickable: true,
    kind: "post",
  }));
  const clickable = postNodes.length ? [...PAGES, ...postNodes] : [...PAGES];
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

// ── Component ───────────────────────────────────────────────────────
function Graph({
  nodeCount = 16, density = 0.5, speed = 1, dark = false,
  layout = "spring", blogPosts = [],
  zoom = 1, onZoomChange,
  curveStrength = 0,
  aside = false,
  onNavigate
}) {
  const canvasRef = React.useRef(null);
  const wrapRef = React.useRef(null);
  const [graph, setGraph] = React.useState(() => buildGraph(nodeCount, density, layout, blogPosts));
  const [hover, setHover] = React.useState(null);
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
    nodeDrag: null, // {idx, depth} — depth is z-distance for unproject plane
    lastX: 0, lastY: 0,
    dragStartX: 0, dragStartY: 0,
    velX: 0, velY: 0,
    lastInteract: performance.now(),
    projected: [],
  });

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
      bg: "transparent", node: "#f4f4f0", post: "#7a7a78",
      hover: "#F53A61", label: "#F53A61",
    } : {
      bg: "transparent", node: "rgba(0,0,0,0.92)", post: "#9a9a99",
      hover: "#F53A61", label: "#F53A61",
    };

    const draw = (now) => {
      const dt = Math.min(50, now - last); last = now;
      const s = stateRef.current;

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
          // very slow even in aside mode
          const ang = 0.0004 * speed * (dt/16.67);
          const dq = qFromAxisAngle([0,1,0], ang);
          s.q = qNormalize(qMul(dq, s.q));
        }
      }

      const w = size.w, h = size.h;
      const cx = w/2, cy = h/2;
      const cameraZ = 800;
      const pos = posRef.current;
      const projected = graph.nodes.map((n, i) => {
        const p = pos[i];
        const v = qApply(s.q, [p.x, p.y, p.z]);
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

      const sorted = [...projected].sort((a,b) => a.z - b.z);

      // World-space center for curve bending (origin since we recenter)
      const centerWorld = [0, 0, 0];
      const centerView = qApply(s.q, centerWorld);
      const cpersp = cameraZ / (cameraZ - centerView[2] * zoom);
      const centerPx = cx + centerView[0] * cpersp * zoom;
      const centerPy = cy + centerView[1] * cpersp * zoom;

      for (const [a, b] of graph.edges) {
        const pa = projected[a], pb = projected[b];
        const zMid = (pa.z + pb.z)/2;
        const t = (zMid - minZ) / zRange;
        const blur = (1 - t) * 8;
        const lw = (0.4 + t * 1.6) * zoom;
        const alpha = 0.18 + t * 0.55;
        ctx.save();
        ctx.filter = blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : "none";
        ctx.strokeStyle = dark
          ? `rgba(244,244,240,${alpha.toFixed(2)})`
          : `rgba(0,0,0,${alpha.toFixed(2)})`;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(pa.px, pa.py);
        if (curveStrength > 0.001) {
          // Quadratic curve toward graph center; control point biases toward centerPx/Py
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

      for (const p of sorted) {
        const t = (p.z - minZ) / zRange;
        const blur = (1 - t) * 10;
        const baseR = (5 + t * 9) * zoom;
        const r = baseR * (hover === p.i ? 1.45 : 1);
        const isHover = hover === p.i && p.n.clickable;
        const isPost = p.n.kind === "post";
        ctx.save();
        ctx.filter = blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : "none";
        ctx.fillStyle = isHover ? palette.hover : (isPost ? palette.post : palette.node);
        ctx.beginPath();
        ctx.arc(p.px, p.py, isPost ? r * 0.82 : r, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();

        if (isHover && t > 0.25) {
          ctx.save();
          ctx.fillStyle = palette.label;
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
  }, [size, graph, hover, speed, dark, zoom, aside, curveStrength]);

  const onPointerDown = (e) => {
    const s = stateRef.current;
    s.lastX = e.clientX; s.lastY = e.clientY;
    s.dragStartX = e.clientX; s.dragStartY = e.clientY;
    s.velX = 0; s.velY = 0;
    s.targetQ = null;
    s.idleSpin = false;
    e.currentTarget.setPointerCapture(e.pointerId);

    // Hit-test for node grab
    if (hover != null) {
      // remember the z-depth (rotated) of the grabbed node so we drag in its plane
      const proj = s.projected[hover];
      const pos = posRef.current[hover];
      const v = qApply(s.q, [pos.x, pos.y, pos.z]);
      s.nodeDrag = { idx: hover, vz: v[2] };
    } else {
      s.rotating = true;
    }
  };

  const onPointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const s = stateRef.current;

    // Hit test only when not dragging anything
    if (!s.rotating && !s.nodeDrag) {
      const proj = s.projected || [];
      let hit = null;
      const sorted = [...proj].sort((a,b)=>b.z-a.z);
      const minZ = proj.length ? Math.min(...proj.map(q=>q.z)) : 0;
      const maxZ = proj.length ? Math.max(...proj.map(q=>q.z)) : 1;
      const zRange = Math.max(1, maxZ - minZ);
      for (const p of sorted) {
        const t = (p.z - minZ) / zRange;
        const r = (5 + t*9) * zoom;
        const dx = x - p.px, dy = y - p.py;
        if (dx*dx + dy*dy < (r + 8)*(r + 8)) { hit = p.i; break; }
      }
      setHover(hit);
    }

    if (s.nodeDrag) {
      // Move the dragged node so its projected position follows the cursor.
      const w = size.w, h = size.h;
      const cx = w/2, cy = h/2;
      const cameraZ = 800;
      const persp = cameraZ / (cameraZ - s.nodeDrag.vz * zoom);
      const newVx = (x - cx) / (persp * zoom);
      const newVy = (y - cy) / (persp * zoom);
      // Inverse-rotate (newVx, newVy, vz) by q -> world
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
    const wasRotating = s.rotating;
    const wasNodeDrag = s.nodeDrag;
    s.rotating = false;
    s.nodeDrag = null;
    s.lastInteract = performance.now();
    e.currentTarget.releasePointerCapture?.(e.pointerId);

    const dx = e.clientX - s.dragStartX;
    const dy = e.clientY - s.dragStartY;
    const moved = Math.hypot(dx, dy);

    if (moved < 5 && hover != null) {
      const node = graph.nodes[hover];
      if (node.clickable) {
        rotateNodeToFront(hover, () => onNavigate?.(node.href));
      }
    }
  };

  // Expose a recenter handle to the host page (Explorer button calls this)
  React.useEffect(() => {
    window.__kfRecenter = () => {
      const s = stateRef.current;
      // reset rotation to identity, restore positions to their layout values, kill velocity
      s.qStart = s.q.slice();
      s.targetQ = qIdentity();
      s.animStart = performance.now();
      s.animDur = 700;
      s.idleSpin = true;
      s.velX = 0; s.velY = 0;
      // restore node positions from the laid-out graph (undoes manual node drags)
      posRef.current = graph.nodes.map(n => ({x:n.x, y:n.y, z:n.z}));
      s.lastInteract = performance.now();
    };
    return () => { if (window.__kfRecenter) delete window.__kfRecenter; };
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

  return (
    <div
      ref={wrapRef}
      style={{
        position: "absolute", inset: 0,
        cursor: hover != null && graph.nodes[hover]?.clickable ? "pointer" : "grab"
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => { setHover(null); }}
        style={{display:"block", touchAction:"none"}}
      />
    </div>
  );
}

window.Graph = Graph;
