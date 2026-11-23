/* ─────────────────────────────────────────────────────────────────────
   Risograph Print Emulation Config
   Play with these values to tune the soy-ink drums, misregistration,
   stochastic/halftone stencil screens, and uncoated paper stock on
   the main network page.
   ───────────────────────────────────────────────────────────────────── */

window.RISO_CONFIG = {
  // Master switch for the Risograph print emulation pass
  enabled: true,

  // ── Authentic Riso Soy-Ink Drums (Riso Kagaku color chart) ─────
  // Feel free to swap hex values! Classic Riso ink options:
  //   Fluorescent Pink: "#FF48B0"   | Crimson / Hot Pink: "#F53A61"
  //   Medium Blue:      "#0078BF"   | Federal Blue:       "#004992"
  //   Bright Olive:     "#B49F29"   | Sunflower / Gold:   "#FFB511"
  //   Hunter Green:     "#407060"   | Teal:               "#00838A"
  //   Fluorescent Orange: "#FF7477" | Flat Gold:          "#BB8B41"
  inks: {
    // Paper / Cream mode inks (subtractive multiply on uncoated stock)
    key: "#18181A",   // Riso Black drum (warm soy carbon, never dead #000)
    primary: "#F53A61",   // Drum A — Hot Pink / Fluorescent Magenta
    secondary: "#0078BF",   // Drum B — Medium Print Blue
    accent: "#FFB511",   // Drum C — Sunflower Yellow / Gold (perturb waves)
    paperLight: "#FBF9F3",   // Warm uncoated Munken / cream stock (light mode)
    paperCream: "#F4EFE4",   // Deeper warm newsprint / archival stock (cream mode)

    // Dark ("Ink") mode inks (metallic / fluorescent screen drums on black stock)
    darkPaper: "#111113", // Heavy black cardstock
    darkKey: "#EFECE4", // Opaque white / silver-grey drum
    darkPrimary: "#FF48B0", // Fluorescent Pink drum
    darkSecondary: "#3898EC", // Bright Cyan-Blue drum
    darkAccent: "#FFC436", // Bright Gold drum
  },

  // ── Drum Misregistration (Multi-pass feed offset) ──────────────
  registration: {
    // Base static offset per ink drum in CSS pixels [x, y].
    // Emulates paper sheet shift between drum passes, exposing subtle
    // cyan/magenta under-layers and rich overprint rims on nodes & tubes.
    primaryOffset: [2.1, -1.3],   // Pink/Magenta drum shift (px)
    secondaryOffset: [-1.9, 1.4],   // Blue/Cyan drum shift (px)
    // Optional slow organic "paper-feed breathing" wobble (px; 0 = locked register)
    wobbleAmount: 0.35,
    wobbleSpeed: 0.65,              // Hz
  },

  // ── Halftone & Stochastic Stencil Master ───────────────────────
  halftone: {
    enabled: true,
    // Dot screen frequency: dot cell pitch in CSS pixels (smaller = finer mesh, e.g. 2.8–5.5)
    dotScale: 4,
    // Blend between ordered rotated halftone dots (0.0) and Riso stochastic FM grain dither (1.0)
    // Real Riso masters sit in the sweet spot around 0.38–0.55 where halftone dots have ragged fiber edges.
    stochastic: 0.44,
    // How strongly midtones & out-of-focus bokeh break into distinct ink dots (0 = continuous, 1 = crisp zine screen)
    strength: 0.9,
    // Classic non-moiré process screen angles in degrees for each drum
    angles: {
      key: 45.0,
      primary: 15.0,
      secondary: 75.0,
    },
  },

  // ── Soy Ink Transfer & Stencil Imperfections ───────────────────
  ink: {
    // Max ink opacity on solid fills (real Riso soy ink never reaches 100% plastic gloss; ~0.88–0.94 lets paper fibers breathe through)
    maxDensity: 0.91,
    // Micro-voids / dry-ink speckling inside dark solid areas where banana-paper stencil fibers block transfer (0–1)
    stencilVoids: 0.34,
    // Ink squash / capillary bleed at high-contrast edges (0–1)
    edgeSquash: 0.8,
    // Under-ink ghosting: how much of the primary/secondary colour drums sit underneath the black key nodes & edges (0–1)
    underprint: 0.6,
  },

  // ── Uncoated Paper Stock & Roller Marks ────────────────────────
  paper: {
    // Organic multi-scale paper fiber tooth (subtle warm/cool tactile bump in paper & ink absorption)
    fiberIntensity: 0.1,
    // Fine horizontal drum/roller feed micro-striations across the print (0 = off)
    rollerLines: 0.9,
    // Warm ink absorption halo / print contrast curve (0 = linear, 1 = punchy zine press)
    pressContrast: 1,
  },
};
