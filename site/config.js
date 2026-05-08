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
    grain: 20,        // paper grain overlay opacity: 0–100
    blogAsNodes: false,     // show blog posts as clickable graph nodes
  },

  // ── Depth-of-field ─────────────────────────────────────────────
  dof: {
    nodeBlurMax: 0.4,    // max blur radius on farthest nodes (0 = sharp, ~0.5 = soft)
    edgeOpacityMin: 0.8,     // opacity of farthest edges (0 = invisible, 1 = no fade)
    edgeDefocusMax: 0.,     // extra thickness of farthest edges (0 = none, 1 = 2× thick)
  },

  // ── Scene / camera ─────────────────────────────────────────────
  scene: {
    fogNear: 600,           // distance where fog begins (world units)
    fogFar: 1000,          // distance where fog is fully opaque
    cameraZ: 800,           // camera distance from origin
    cameraFov: 45,            // base field-of-view in degrees (before zoom)
    cameraNear: 10,           // near clipping plane
    cameraFar: 3000,          // far clipping plane
  },

  // ── Node appearance ────────────────────────────────────────────
  nodes: {
    baseRadius: 26.4, // base node diameter in world units (12 × 2.2)
    hoverScale: 1.45, // scale multiplier when hovering a node
    fillerScale: 0.78, // scale multiplier for filler (non-clickable) nodes
    edgeThickness: 1,  // edge tube radius (normal edges)
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
