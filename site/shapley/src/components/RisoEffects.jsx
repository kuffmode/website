import React, { useEffect, useRef, useState } from 'react';

/**
 * Clean Optical Depth-of-Field (50mm f/1.8) Focal Plane & Riso Filters:
 * - No dirty full-screen noise or dark vignette overlays.
 * - Middle ~65% of the viewport sits razor-sharp on clean #FBF9F3 paper.
 * - Top ~18% and Bottom ~18% smoothly blur and fade into clean paper fog (#FBF9F3 / #111113).
 */
export function RisoAtmosphere({ darkMode }) {
  useEffect(() => {
    let rafId = null;

    const SELECTOR = [
      'main h1',
      'main h2',
      'main h3',
      'main h4',
      'main p',
      'main .kf-kicker',
      'main .kf-paper-slip',
      'main button',
      'main a',
      'main svg',
      'main canvas',
      'main tr',
      'main label',
    ].join(', ');

    const updateFocalPlane = () => {
      rafId = null;
      const vh = window.innerHeight;
      if (!vh) return;

      const topFocusY = Math.max(82, vh * 0.18);
      const botFocusY = vh * 0.82;
      const topSpan = Math.max(1, topFocusY - 36);
      const botSpan = Math.max(1, vh - botFocusY);

      const nodes = document.querySelectorAll(SELECTOR);
      for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i];
        const rect = el.getBoundingClientRect();

        if (rect.bottom < -40 || rect.top > vh + 40) continue;

        if (rect.height > vh * 0.45) {
          if (el.dataset.dofBlurred === '1') {
            el.style.filter = '';
            el.style.opacity = '';
            el.dataset.dofBlurred = '0';
          }
          continue;
        }

        const cy = rect.top + rect.height * 0.5;
        let coc = 0;

        if (cy < topFocusY) {
          const raw = (topFocusY - cy) / topSpan;
          coc = Math.max(0, Math.min(1, raw));
        } else if (cy > botFocusY) {
          const raw = (cy - botFocusY) / botSpan;
          coc = Math.max(0, Math.min(1, raw));
        }

        if (coc <= 0.015) {
          if (el.dataset.dofBlurred === '1') {
            el.style.filter = '';
            el.style.opacity = '';
            el.dataset.dofBlurred = '0';
          }
        } else {
          const curve = Math.pow(coc, 1.35);
          const blurPx = (curve * 12.5).toFixed(2);
          const shiftPx = (curve * 2.8).toFixed(2);
          const fogOpacity = Math.max(0.16, 1 - curve * 0.78).toFixed(3);

          el.style.filter = `blur(${blurPx}px) drop-shadow(${shiftPx}px -${(curve * 1.5).toFixed(
            2
          )}px 0 rgba(245, 58, 97, ${(curve * 0.36).toFixed(2)})) drop-shadow(-${shiftPx}px ${(
            curve * 1.5
          ).toFixed(2)}px 0 rgba(0, 120, 191, ${(curve * 0.3).toFixed(2)}))`;
          el.style.opacity = fogOpacity;
          el.dataset.dofBlurred = '1';
        }
      }
    };

    const scheduleUpdate = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateFocalPlane);
      }
    };

    updateFocalPlane();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.addEventListener('click', () => setTimeout(scheduleUpdate, 40));

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [darkMode]);

  return (
    <>
      {/* Shared SVG Filters: Deckled Paper Edge + Riso Stamp */}
      <svg
        width="0"
        height="0"
        style={{ position: 'fixed', pointerEvents: 'none', overflow: 'hidden' }}
        aria-hidden="true"
      >
        <defs>
          <filter id="kf-paper-edge" x="-4%" y="-12%" width="108%" height="124%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.045 0.08"
              numOctaves="3"
              seed="11"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="3.2"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <filter id="kf-riso-stamp-rough" x="-8%" y="-8%" width="116%" height="116%">
            <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="7" result="rough" />
            <feDisplacementMap in="SourceGraphic" in2="rough" scale="1.9" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* ── Top Out-of-Focus & Clean Paper-Fog Zone (0 -> 18vh) ── */}
      <div
        className="kf-dof-band kf-dof-top-feather"
        style={{ top: '48px', height: '6vh', backdropFilter: 'blur(11px)', WebkitBackdropFilter: 'blur(11px)' }}
        aria-hidden="true"
      />
      <div
        className="kf-dof-band kf-dof-top-feather"
        style={{ top: '48px', height: '10vh', backdropFilter: 'blur(5.5px)', WebkitBackdropFilter: 'blur(5.5px)' }}
        aria-hidden="true"
      />
      <div
        className="kf-dof-band kf-dof-top-feather"
        style={{ top: '48px', height: '15vh', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
        aria-hidden="true"
      />
      <div className="kf-dof-fog-top" aria-hidden="true" />

      {/* ── Bottom Out-of-Focus & Clean Paper-Fog Zone (82vh -> 100vh) ── */}
      <div
        className="kf-dof-band kf-dof-bot-feather"
        style={{ bottom: '0px', height: '16vh', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
        aria-hidden="true"
      />
      <div
        className="kf-dof-band kf-dof-bot-feather"
        style={{ bottom: '0px', height: '11vh', backdropFilter: 'blur(5.5px)', WebkitBackdropFilter: 'blur(5.5px)' }}
        aria-hidden="true"
      />
      <div
        className="kf-dof-band kf-dof-bot-feather"
        style={{ bottom: '0px', height: '6.5vh', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        aria-hidden="true"
      />
      <div className="kf-dof-fog-bottom" aria-hidden="true" />
    </>
  );
}

/**
 * Multi-Drum Risograph Halftone Portrait of Lloyd S. Shapley
 * Renders ./shapley.jpg through the 3-drum Risograph halftone screen.
 */
export function RisoShapleyPortrait({ darkMode }) {
  const canvasRef = useRef(null);
  const [loadedPhoto, setLoadedPhoto] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoadedPhoto(img);
    img.src = './shapley.jpg';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedPhoto) return;

    const W = 240;
    const H = 310;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = W;
    srcCanvas.height = H;
    const sctx = srcCanvas.getContext('2d');

    sctx.fillStyle = '#E8E2D5';
    sctx.fillRect(0, 0, W, H);
    const scale = Math.max(W / loadedPhoto.width, H / loadedPhoto.height);
    const dw = loadedPhoto.width * scale;
    const dh = loadedPhoto.height * scale;
    sctx.drawImage(loadedPhoto, (W - dw) / 2, (H - dh) / 2, dw, dh);

    const srcData = sctx.getImageData(0, 0, W, H).data;
    const outImg = ctx.createImageData(W, H);
    const out = outImg.data;

    const paperCol = darkMode ? [17, 17, 19] : [251, 249, 243];
    const keyInk = darkMode ? [239, 236, 228] : [24, 24, 26];
    const primaryInk = darkMode ? [255, 72, 176] : [245, 58, 97];
    const secondaryInk = darkMode ? [56, 152, 236] : [0, 120, 191];

    const misreg = 2.4;
    const dotPitch = 3.4;

    const samplePixel = (x, y) => {
      const cx = Math.max(0, Math.min(W - 1, Math.round(x)));
      const cy = Math.max(0, Math.min(H - 1, Math.round(y)));
      const idx = (cy * W + cx) * 4;
      const r = srcData[idx] / 255;
      const g = srcData[idx + 1] / 255;
      const b = srcData[idx + 2] / 255;
      const luma = r * 0.299 + g * 0.587 + b * 0.114;
      const cLuma = Math.pow(Math.max(0, Math.min(1, (luma - 0.06) / 0.88)), 0.95);
      const warm = Math.max(0, r - b);
      const cool = Math.max(0, b - r * 0.7);
      return { darkness: 1.0 - cLuma, warm, cool };
    };

    const hash2 = (x, y) => {
      const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return h - Math.floor(h);
    };

    const risoScreen = (density, x, y, angleDeg, pitch, stochasticMix) => {
      if (density <= 0.015) return 0;
      const rad = angleDeg * 0.01745329;
      const c = Math.cos(rad);
      const s = Math.sin(rad);
      const gx = (c * x - s * y) / pitch;
      const gy = (s * x + c * y) / pitch;
      const dotWave = Math.sin(gx * 6.2831853) * Math.sin(gy * 6.2831853) * 0.5 + 0.5;
      const noise = hash2(x, y);
      const thresh = dotWave * (1 - stochasticMix) + noise * stochasticMix;
      const edge0 = thresh - 0.15;
      const edge1 = thresh + 0.15;
      const t = Math.max(0, Math.min(1, (density * 1.06 - edge0) / (edge1 - edge0)));
      const screened = t * t * (3 - 2 * t);
      const midWeight = 1.0 - Math.pow(Math.min(1, density), 2.5) * 0.55;
      return density * (1 - 0.88 * midWeight) + screened * (0.88 * midWeight);
    };

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const s0 = samplePixel(x, y);
        const sP = samplePixel(x + misreg, y - misreg * 0.62);
        const sS = samplePixel(x - misreg * 0.88, y + misreg * 0.68);

        const dKey = s0.darkness * 0.86;
        const dPrimary = Math.min(1, sP.darkness * 0.48 + sP.warm * 0.72);
        const dSecondary = Math.min(1, sS.darkness * 0.42 + sS.cool * 0.85);

        let kScreen = risoScreen(dKey, x, y, 45.0, dotPitch, 0.35);
        let pScreen = risoScreen(dPrimary, x, y, 15.0, dotPitch * 1.04, 0.36);
        let sScreen = risoScreen(dSecondary, x, y, 75.0, dotPitch * 1.04, 0.36);

        let r = paperCol[0];
        let g = paperCol[1];
        let b = paperCol[2];

        if (!darkMode) {
          r = r * (1 - pScreen * (1 - primaryInk[0] / 255));
          g = g * (1 - pScreen * (1 - primaryInk[1] / 255));
          b = b * (1 - pScreen * (1 - primaryInk[2] / 255));

          r = r * (1 - sScreen * (1 - secondaryInk[0] / 255));
          g = g * (1 - sScreen * (1 - secondaryInk[1] / 255));
          b = b * (1 - sScreen * (1 - secondaryInk[2] / 255));

          r = r * (1 - kScreen * (1 - keyInk[0] / 255));
          g = g * (1 - kScreen * (1 - keyInk[1] / 255));
          b = b * (1 - kScreen * (1 - keyInk[2] / 255));
        } else {
          r = r + (primaryInk[0] - r) * pScreen * 0.55;
          g = g + (primaryInk[1] - g) * pScreen * 0.55;
          b = b + (primaryInk[2] - b) * pScreen * 0.55;

          r = r + (secondaryInk[0] - r) * sScreen * 0.55;
          g = g + (secondaryInk[1] - g) * sScreen * 0.55;
          b = b + (secondaryInk[2] - b) * sScreen * 0.55;

          r = r + (keyInk[0] - r) * (1 - kScreen) * 0.78;
          g = g + (keyInk[1] - g) * (1 - kScreen) * 0.78;
          b = b + (keyInk[2] - b) * (1 - kScreen) * 0.78;
        }

        const idx = (y * W + x) * 4;
        out[idx] = Math.max(0, Math.min(255, Math.round(r)));
        out[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
        out[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
        out[idx + 3] = 255;
      }
    }

    ctx.putImageData(outImg, 0, 0);
  }, [darkMode, loadedPhoto]);

  return (
    <div className="relative border-2 border-current p-1.5 bg-paper dark:bg-zinc-900 shadow-riso shrink-0">
      <canvas
        ref={canvasRef}
        className="w-36 sm:w-40 h-auto block"
        aria-label="Risograph halftone portrait of Lloyd Shapley"
      />
    </div>
  );
}
