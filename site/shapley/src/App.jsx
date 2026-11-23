import React, { useState, useEffect } from 'react';
import { Sun, Moon, Unlock } from 'lucide-react';
import BargainingAct from './components/BargainingAct.jsx';
import ExplainerAct from './components/ExplainerAct.jsx';
import MsaResearchAct from './components/MsaResearchAct.jsx';
import { RisoAtmosphere } from './components/RisoEffects.jsx';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isBargainingSolved, setIsBargainingSolved] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    document.body.dataset.mode = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - doc.clientHeight;
      if (maxScroll <= 0) {
        setScrollPct(0);
      } else {
        setScrollPct(Math.min(100, Math.round((window.scrollY / maxScroll) * 100)));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen relative riso-halftone-bg font-sans">
      {/* Global Risograph Film Grain, Roller Lines, SVG Deckled Edge Filter & DoF Bokeh */}
      <RisoAtmosphere darkMode={darkMode} />

      {/* Top Fixed Header matching main site's .kf-nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-paper/95 dark:bg-paper-dark/95 backdrop-blur-sm border-b border-current/15">
        {/* Scroll Progress Bar */}
        <div className="h-[3px] w-full bg-current/10">
          <div
            style={{ width: `${scrollPct}%` }}
            className="h-full bg-riso-magenta transition-all duration-150"
          />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-2">
          <a
            href="https://kaysonfakhar.com"
            className="flex flex-col items-start leading-none group"
          >
            <span className="font-display text-base sm:text-lg tracking-wide group-hover:text-riso-magenta transition-colors">
              kayson <span className="text-riso-magenta">▦</span> fakhar
            </span>
            <span className="text-[11px] italic opacity-65 mt-1 hidden sm:block">
              I do not understand what I do not break
            </span>
          </a>

          {/* Navigation Links in Asta Sans (lowercase + dot, matching main site) */}
          <nav className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-sans">
            <a
              href="#act-1"
              className="hover:text-riso-magenta transition-colors whitespace-nowrap"
            >
              bargain.
            </a>
            <a
              href="#act-2"
              onClick={() => {
                if (!isBargainingSolved) setIsBargainingSolved(true);
              }}
              className="hover:text-riso-magenta transition-colors whitespace-nowrap"
            >
              shapley.
            </a>
            <a
              href="#act-3"
              onClick={() => {
                if (!isBargainingSolved) setIsBargainingSolved(true);
              }}
              className="hover:text-riso-magenta transition-colors whitespace-nowrap"
            >
              brains &amp; msa.
            </a>

            {!isBargainingSolved && (
              <button
                onClick={() => setIsBargainingSolved(true)}
                title="Skip straight to the full explainer"
                className="hidden md:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 border border-current/60 hover:bg-riso-magenta hover:text-paper hover:border-riso-magenta transition-colors lowercase"
              >
                <Unlock size={12} />
                <span>unlock all</span>
              </button>
            )}

            <button
              onClick={() => setDarkMode((d) => !d)}
              className="p-1.5 hover:text-riso-magenta transition-transform hover:-rotate-12"
              aria-label="Toggle colour mode"
              title={darkMode ? 'switch to light' : 'switch to dark'}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content — padded top & bottom so the first and last lines sit inside the sharp focal zone */}
      <main className="relative z-10 pt-[14vh] pb-[24vh]">
        <BargainingAct
          isSolved={isBargainingSolved}
          onSolved={() => setIsBargainingSolved(true)}
        />

        {isBargainingSolved ? (
          <>
            <ExplainerAct darkMode={darkMode} />
            <MsaResearchAct darkMode={darkMode} />
          </>
        ) : (
          <div className="max-w-5xl mx-auto px-4 sm:px-8 pb-20">
            <div className="riso-card p-6 sm:p-8 text-center border-dashed">
              <p className="kf-kicker mb-2">
                <span className="text-riso-magenta">▦</span> Next up: The scroll explainer (Acts II &amp; III)
              </p>
              <p className="text-base sm:text-lg opacity-85 max-w-xl mx-auto mb-5">
                Try at least 3 offers at the dinner table above to see how the bargaining narrows down—or, if you’re
                impatient, unlock the full scroll explainer right away.
              </p>
              <button
                onClick={() => setIsBargainingSolved(true)}
                className="inline-flex items-center gap-2 text-sm px-4 py-2 border-2 border-current hover:bg-riso-magenta hover:text-paper hover:border-riso-magenta transition-colors lowercase"
              >
                <Unlock size={14} />
                <span>skip bargaining &amp; open explainer</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
