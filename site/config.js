/* ─────────────────────────────────────────────────────────────────────
   Site Configuration
   Edit values here to change defaults without touching the source code.
   ───────────────────────────────────────────────────────────────────── */

window.SITE_CONFIG = {

  // ── Graph defaults (initial values before user interacts) ──────
  defaults: {
    nodeCount: 13,        // total nodes in the network (including fillers)
    density: 0.5,       // edge density: 0 = sparse, 1 = dense
    zoom: 0.7,       // camera zoom multiplier
    speed: 2.9,       // idle spin speed multiplier
    layout: "random",  // "random" | "spring" | "spherical" | "kamada-kawai"
    curveStrength: 0,         // edge curvature toward center: 0 = straight, 1 = max curve
    mode: "light",   // color mode: "light" | "cream" | "dark"
    grain: 5,        // paper grain overlay opacity: 0–100
    blogAsNodes: false,     // show blog posts as clickable graph nodes
  },

  // ── Depth-of-field (real lens blur, screen-space) ────────────────
  dof: {
    focus: 450,           // distance from camera that stays sharp (world units); cameraZ (800) = rotation center in focus
    focusRange: 500,          // world units from focus before blur reaches its max
    maxBlur: 15,            // blur radius in screen pixels at full defocus (the pyramid goes up to ~32)
    renderScale: 2,          // supersamples the capture to kill jagged edges (1 = off; clamped to 2 — beyond that is pure cost)
    frost: 0.2,             // px of uniform softness on everything — the "frosted pane" (0 = razor sharp in focus)
    grain: 0.05,            // in-render grain, stronger where blurred (0 = off). Prefer this over the CSS paper grain.
  },

  // ── Scene / camera ─────────────────────────────────────────────
  scene: {
    fogNear: 500,           // distance where fog begins (world units)
    fogFar: 1000,          // distance where fog is fully opaque
    cameraZ: 800,           // camera distance from origin
    cameraFov: 45,            // base field-of-view in degrees (before zoom)
    cameraNear: 10,           // near clipping plane
    cameraFar: 3000,          // far clipping plane
    edgeFadeMin: 1,          // opacity-toward-fog of the farthest edges — atmospheric fade, separate from lens blur (0 = invisible, 1 = no fade)
  },

  // ── Node appearance ────────────────────────────────────────────
  nodes: {
    baseRadius: 26.4, // base node diameter in world units (12 × 2.2)
    hoverScale: 1.45, // scale multiplier when hovering a node
    fillerScale: 0.78, // scale multiplier for filler (non-clickable) nodes
    shading: 0.3,      // matte lighting on nodes & edges (0 = flat, 1 = strong) — sells them as solid objects
    edgeThickness: 2.2,  // edge tube radius (normal edges) — thin tubes dissolve under the frost blur
    hoverEdgeThickness: 2,  // edge tube radius (hovered edge in cut mode)
  },

  // ── Layout tuning ──────────────────────────────────────────────
  layout: {
    sphereRadius: 280,     // radius for spherical/fibonacci layout
    springIdealDist: 200,     // ideal edge length for spring & Kamada-Kawai
    springIters: 220,     // iteration count for spring relaxation
    kkIters: 200,     // iteration count for Kamada-Kawai stress minimization
    randomSpread: 600,     // coordinate range for random layout (±spread/2)
  },

  // ── Idle rotation ──────────────────────────────────────────────
  idle: {
    spinRate: 0.0009,   // radians/frame when idle (full-screen graph)
    asideSpinRate: 0.0004,   // radians/frame when sidebar is open
    idleDelay: 800,      // ms of inactivity before idle spin starts
    asideIdleDelay: 1500,     // ms of inactivity before aside idle spin starts
  },
};
