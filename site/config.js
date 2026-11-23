/* ─────────────────────────────────────────────────────────────────────
   Site Configuration
   Edit values here to change defaults without touching the source code.
   ───────────────────────────────────────────────────────────────────── */

window.SITE_CONFIG = {

  // ── Graph defaults (initial values before user interacts) ──────
  defaults: {
    nodeCount: 13,        // total nodes in the network (including fillers)
    density: 0.3,       // edge density: 0 = sparse, 1 = dense
    zoom: 0.7,       // camera zoom multiplier
    speed: 1,       // idle spin speed multiplier
    layout: "random",  // "random" | "spring" | "spherical" | "kamada-kawai"
    curveStrength: 0,         // edge curvature toward center: 0 = straight, 1 = max curve
    mode: "light",   // color mode: "light" | "cream" | "dark"
    grain: 0,        // CSS page grain overlay opacity: 0–100 (0 = use in-render ISO 800 film grain)
    blogAsNodes: false,     // show blog posts as clickable graph nodes
  },

  // ── Depth-of-field & optical film look (50mm f/1.8, ISO 800) ─────
  dof: {
    focus: 520,             // focal plane distance from camera (world units); front of graph sits razor sharp
    focusRange: 520,        // distance beyond focus where blur reaches maxBlur (hyperbolic thin-lens CoC)
    maxBlur: 18,            // max circular aperture bokeh radius in screen pixels
    renderScale: 2,         // supersamples the capture to kill jagged edges (1 = off; clamped to 2)
    bokehRing: 0,        // subtle 50mm f/1.8 spherical-aberration bokeh rim character (0 = flat disc)
    chromaticAberration: 0, // subtle lateral glass CA at frame corners (px; 0 = off)
    vignette: 0.8,         // natural f/1.8 cos^4 corner falloff (automatically gentled on light backgrounds)
    grain: 0.085,           // ISO 800 film grain intensity (H&D midtone-weighted; 0 = off)
    grainSize: 0.5,        // physical silver-halide clump size in CSS pixels
    grainChroma: 0.22,      // colour-film dye-cloud channel separation (0 = B&W, ~0.22 = colour 800)
    grainFps: 24,           // film-gate grain cadence in fps (0 = static still frame)
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
