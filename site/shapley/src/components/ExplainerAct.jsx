import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, ShieldAlert, Check, Sparkles, Sliders } from 'lucide-react';
import { RisoShapleyPortrait } from './RisoEffects.jsx';

const PERMUTATIONS = [
  {
    id: 'Y → A → S',
    shortId: 'Y-A-S',
    order: ['You', 'Alex', 'Sam'],
    steps: [
      { who: 'You', before: 'Empty ($0)', after: '{You} ($42)', marginal: 42 },
      { who: 'Alex', before: '{You} ($42)', after: '{You, Alex} ($54)', marginal: 12 },
      { who: 'Sam', before: '{You, Alex} ($54)', after: '{All} ($60)', marginal: 6 },
    ],
    contribs: { You: 42, Alex: 12, Sam: 6 },
  },
  {
    id: 'Y → S → A',
    shortId: 'Y-S-A',
    order: ['You', 'Sam', 'Alex'],
    steps: [
      { who: 'You', before: 'Empty ($0)', after: '{You} ($42)', marginal: 42 },
      { who: 'Sam', before: '{You} ($42)', after: '{You, Sam} ($48)', marginal: 6 },
      { who: 'Alex', before: '{You, Sam} ($48)', after: '{All} ($60)', marginal: 12 },
    ],
    contribs: { You: 42, Alex: 12, Sam: 6 },
  },
  {
    id: 'A → Y → S',
    shortId: 'A-Y-S',
    order: ['Alex', 'You', 'Sam'],
    steps: [
      { who: 'Alex', before: 'Empty ($0)', after: '{Alex} ($24)', marginal: 24 },
      { who: 'You', before: '{Alex} ($24)', after: '{Alex, You} ($54)', marginal: 30 },
      { who: 'Sam', before: '{Alex, You} ($54)', after: '{All} ($60)', marginal: 6 },
    ],
    contribs: { You: 30, Alex: 24, Sam: 6 },
  },
  {
    id: 'A → S → Y',
    shortId: 'A-S-Y',
    order: ['Alex', 'Sam', 'You'],
    steps: [
      { who: 'Alex', before: 'Empty ($0)', after: '{Alex} ($24)', marginal: 24 },
      { who: 'Sam', before: '{Alex} ($24)', after: '{Alex, Sam} ($30)', marginal: 6 },
      { who: 'You', before: '{Alex, Sam} ($30)', after: '{All} ($60)', marginal: 30 },
    ],
    contribs: { You: 30, Alex: 24, Sam: 6 },
  },
  {
    id: 'S → Y → A',
    shortId: 'S-Y-A',
    order: ['Sam', 'You', 'Alex'],
    steps: [
      { who: 'Sam', before: 'Empty ($0)', after: '{Sam} ($12)', marginal: 12 },
      { who: 'You', before: '{Sam} ($12)', after: '{Sam, You} ($48)', marginal: 36 },
      { who: 'Alex', before: '{Sam, You} ($48)', after: '{All} ($60)', marginal: 12 },
    ],
    contribs: { You: 36, Alex: 12, Sam: 12 },
  },
  {
    id: 'S → A → Y',
    shortId: 'S-A-Y',
    order: ['Sam', 'Alex', 'You'],
    steps: [
      { who: 'Sam', before: 'Empty ($0)', after: '{Sam} ($12)', marginal: 12 },
      { who: 'Alex', before: '{Sam} ($12)', after: '{Sam, Alex} ($30)', marginal: 18 },
      { who: 'You', before: '{Sam, Alex} ($30)', after: '{All} ($60)', marginal: 30 },
    ],
    contribs: { You: 30, Alex: 18, Sam: 12 },
  },
];

const PLAYER_COLORS = {
  You: { bg: 'bg-riso-magenta', text: 'text-riso-magenta', hex: '#F53A61' },
  Alex: { bg: 'bg-riso-cyan', text: 'text-riso-cyan', hex: '#0078BF' },
  Sam: { bg: 'bg-riso-yellow', text: 'text-riso-yellow', hex: '#FFB511' },
};

const AXIOMS = [
  {
    id: 'efficiency',
    number: '01',
    name: 'Efficiency',
    subtitle: 'The whole check gets paid. Nothing vanishes.',
    math: '∑ φᵢ(v) = v(N)',
    plain:
      'All individual payouts must add up to the exact value of the grand coalition. You can’t leave $8 unpaid on the table, and the algorithm can’t skim a phantom tax off the top.',
    fairState: {
      label: 'Axiom intact: Exact $60 distributed ($35 + $17 + $8)',
      bars: [
        { name: 'You', val: 35, color: 'bg-riso-magenta text-paper' },
        { name: 'Alex', val: 17, color: 'bg-riso-cyan text-paper' },
        { name: 'Sam', val: 8, color: 'bg-riso-yellow text-ink' },
      ],
      verdict: 'Total collected = $60.00. The restaurant is happy; no surplus is wasted.',
    },
    brokenState: {
      label: 'Axiom broken: $8 shortfall left sitting on the table!',
      bars: [
        { name: 'You', val: 30, color: 'bg-riso-magenta text-paper' },
        { name: 'Alex', val: 15, color: 'bg-riso-cyan text-paper' },
        { name: 'Sam', val: 7, color: 'bg-riso-yellow text-ink' },
        { name: 'Gap', val: 8, color: 'border-2 border-dashed border-riso-magenta text-riso-magenta' },
      ],
      verdict: 'Only $52 collected on a $60 check. Someone is washing dishes tonight.',
    },
  },
  {
    id: 'symmetry',
    number: '02',
    name: 'Symmetry',
    subtitle: 'Same contribution, same bill.',
    math: 'v(S ∪ {i}) = v(S ∪ {j})  ⇒  φᵢ = φⱼ',
    plain:
      'If two players contribute the exact same amount to every possible group they join, they must get the exact same score. The math doesn’t care about your name or where you sat.',
    fairState: {
      label: 'Axiom intact: Suppose Alex & Sam ordered identical $18 meals',
      bars: [
        { name: 'You', val: 34, color: 'bg-riso-magenta text-paper' },
        { name: 'Alex', val: 13, color: 'bg-riso-cyan text-paper' },
        { name: 'Sam', val: 13, color: 'bg-riso-yellow text-ink' },
      ],
      verdict: 'Identical marginal contributions to every subgroup → both pay $13.',
    },
    brokenState: {
      label: 'Axiom broken: Arbitrary seat-order favouritism',
      bars: [
        { name: 'You', val: 34, color: 'bg-riso-magenta text-paper' },
        { name: 'Alex', val: 19, color: 'bg-riso-cyan text-paper' },
        { name: 'Sam', val: 7, color: 'bg-riso-yellow text-ink' },
      ],
      verdict: 'Alex and Sam ate the exact same meal, yet Alex gets slapped with $19 and Sam pays $7!',
    },
  },
  {
    id: 'null-player',
    number: '03',
    name: 'Null Player (Dummy)',
    subtitle: 'Add nothing, pay nothing.',
    math: 'v(S ∪ {i}) = v(S)  ⇒  φᵢ = 0',
    plain:
      'Suppose a fourth friend (“Casey”) drops by just to chat, doesn’t order a crumb, and changes the cost of every possible combination by $0. Casey’s fair share must be strictly $0.',
    fairState: {
      label: 'Axiom intact: Casey (Null Player) adds $0 → pays $0',
      bars: [
        { name: 'You', val: 35, color: 'bg-riso-magenta text-paper' },
        { name: 'Alex', val: 17, color: 'bg-riso-cyan text-paper' },
        { name: 'Sam', val: 8, color: 'bg-riso-yellow text-ink' },
      ],
      verdict: 'Casey contributed $0 to every coalition → Casey owes $0.00.',
    },
    brokenState: {
      label: 'Axiom broken: Charging a bystander $10 just for sitting there',
      bars: [
        { name: 'You', val: 30, color: 'bg-riso-magenta text-paper' },
        { name: 'Alex', val: 14, color: 'bg-riso-cyan text-paper' },
        { name: 'Sam', val: 6, color: 'bg-riso-yellow text-ink' },
        { name: 'Casey', val: 10, color: 'bg-riso-magenta/40 text-ink' },
      ],
      verdict: 'Casey didn’t even drink tap water, yet gets taxed $10 to subsidise your dinner!',
    },
  },
  {
    id: 'additivity',
    number: '04',
    name: 'Additivity',
    subtitle: 'One combined check = two separate checks.',
    math: 'φ(u + v) = φ(u) + φ(v)',
    plain:
      'If you play two independent games—say Dinner ($60) and Dessert ($12)—splitting them on one combined receipt must yield the exact same total as splitting Dinner and Dessert separately.',
    fairState: {
      label: 'Axiom intact: Dinner ($35) + Dessert ($5) = $40 total',
      bars: [
        { name: 'You', val: 40, color: 'bg-riso-magenta text-paper' },
        { name: 'Alex', val: 21, color: 'bg-riso-cyan text-paper' },
        { name: 'Sam', val: 11, color: 'bg-riso-yellow text-ink' },
      ],
      verdict: 'Whether the waiter prints one check or two checks, nobody’s total changes.',
    },
    brokenState: {
      label: 'Axiom broken: Stapling receipts together changes what you owe',
      bars: [
        { name: 'You', val: 46, color: 'bg-riso-magenta text-paper' },
        { name: 'Alex', val: 17, color: 'bg-riso-cyan text-paper' },
        { name: 'Sam', val: 9, color: 'bg-riso-yellow text-ink' },
      ],
      verdict: 'Just by bundling two separate bills onto one piece of paper, your share jumps by $6!',
    },
  },
];

const CROSS_FIELD_EXAMPLES = [
  {
    id: 'economics',
    tag: 'Economics & Infrastructure',
    title: 'The Airport Runway Game',
    unit: 'Runway Cost ($M)',
    baseline: 'Total Heavy Runway Cost: $60M',
    description:
      'This is a classic textbook problem. Small Cessnas only need a short $12M strip; regional jets need $24M; jumbo 747s need the full $42M pavement (or $60M with shared high-speed taxiways). Airports actually use Shapley values to set landing fees so light planes don’t subsidise jumbo jets.',
    nodes: [
      { role: 'Boeing 747s (Heavy)', mapTo: 'You (Feast)', share: '$35M', pct: 58 },
      { role: 'Regional Jets (Medium)', mapTo: 'Alex (Pasta)', share: '$17M', pct: 28 },
      { role: 'Light Cessnas (Short)', mapTo: 'Sam (Salad)', share: '$8M', pct: 14 },
    ],
  },
  {
    id: 'xai',
    tag: 'Explainable AI (SHAP)',
    title: 'Who Drove the Black-Box Prediction?',
    unit: 'Prediction Shift (%)',
    baseline: 'Total Shift from Base Rate: +60%',
    description:
      'Deep networks are notorious black boxes. If a medical model predicts a +60% risk score, which input feature caused it? Since features interact nonlinearly, Lundberg & Lee (2017) treated features as cooperative players—turning Shapley values into SHAP, the gold standard in Explainable AI.',
    nodes: [
      { role: 'Feature A (Age × History)', mapTo: 'You', share: '+35%', pct: 58 },
      { role: 'Feature B (Blood Pressure)', mapTo: 'Alex', share: '+17%', pct: 28 },
      { role: 'Feature C (Sleep Score)', mapTo: 'Sam', share: '+8%', pct: 14 },
    ],
  },
  {
    id: 'neuroscience',
    tag: 'Computational Neuroscience',
    title: 'Which Brain Region Caused the Behaviour?',
    unit: 'Causal Contribution (%)',
    baseline: 'Intact Network Performance: 60%',
    description:
      'Think of a cognitive function as a house built by a crew of brain regions with wildly different expertise. By virtually perturbing coalitions of neural units and computing their Shapley value, we get an axiomatic map of who is causally doing what in the brain.',
    nodes: [
      { role: 'Association Hub (V4 / PFC)', mapTo: 'You', share: '35%', pct: 58 },
      { role: 'Relay Region (Parietal)', mapTo: 'Alex', share: '17%', pct: 28 },
      { role: 'Early Sensory Unit', mapTo: 'Sam', share: '8%', pct: 14 },
    ],
  },
];

export default function ExplainerAct({ darkMode }) {
  const [activePermIdx, setActivePermIdx] = useState(0);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [brokenAxioms, setBrokenAxioms] = useState({});
  const [activeField, setActiveField] = useState('neuroscience');

  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [customSoloYou, setCustomSoloYou] = useState(42);
  const [customSoloAlex, setCustomSoloAlex] = useState(24);
  const [customSoloSam, setCustomSoloSam] = useState(12);

  useEffect(() => {
    if (!isPlayingAll) return;
    const timer = setInterval(() => {
      setActivePermIdx((prev) => {
        if (prev >= PERMUTATIONS.length - 1) {
          setIsPlayingAll(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1100);
    return () => clearInterval(timer);
  }, [isPlayingAll]);

  const activePerm = PERMUTATIONS[activePermIdx];

  const toggleAxiomBroken = (id) => {
    setBrokenAxioms((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sY = customSoloYou;
  const sA = customSoloAlex;
  const sS = customSoloSam;
  const cAS = Math.max(0, sA + sS - 6);
  const cYS = Math.max(0, sY + sS - 6);
  const cYA = Math.max(0, sY + sA - 12);
  const cYAS = Math.max(0, sY + sA + sS - 18);

  const shapleyYou = ((sY + sY + (cYA - sA) + (cYAS - cAS) + (cYS - sS) + (cYAS - cAS)) / 6).toFixed(1);
  const shapleyAlex = (((cYA - sY) + (cYAS - cYS) + sA + sA + (cYAS - cYS) + (cAS - sS)) / 6).toFixed(1);
  const shapleySam = (((cYAS - cYA) + (cYS - sY) + (cYAS - cYA) + (cAS - sA) + sS + sS) / 6).toFixed(1);

  return (
    <section id="act-2" className="py-16 px-4 sm:px-8 max-w-5xl mx-auto border-t-2 border-current">
      {/* Chapter 1: From Bargaining to an External Authority & Who is Shapley */}
      <div className="mb-20">
        <p className="kf-kicker mb-2">
          <span className="text-riso-cyan">▦</span> Act II · Part 01 / 04 · Outsourcing the argument
        </p>
        <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-4 riso-misreg-title">
          What if an algorithm settled the bill before anyone started arguing?
        </h2>
        <p className="text-lg sm:text-xl opacity-85 max-w-3xl leading-relaxed mb-8">
          You see, at the dinner table you landed on <strong>($35, $17, $8)</strong> by haggling—testing lowball offers
          until every subgroup stopped threatening to walk out. It’s intuitive, sure, but how exactly should we define
          <em> fairness</em> without relying on who argues the loudest? In 1953, game theory settled that debate for us.
        </p>

        {/* Visual Comparison + Lloyd Shapley Multi-Drum Risograph Portrait Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 5 cols: Who was Lloyd Shapley with real Risograph halftone canvas portrait */}
          <div className="lg:col-span-5 riso-card p-5 sm:p-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-4">
              <RisoShapleyPortrait darkMode={darkMode} />
              <div className="text-center sm:text-left">
                <div className="text-xs uppercase tracking-wider text-riso-magenta font-bold">
                  1923 – 2016 · RAND &amp; UCLA
                </div>
                <h3 className="font-display text-2xl sm:text-3xl mt-1">Lloyd S. Shapley</h3>
                <div className="text-xs opacity-75 mt-1.5 space-y-0.5">
                  <div>1953: <em>“A Value for n-Person Games”</em></div>
                  <div>2012: Nobel Prize in Economics</div>
                </div>
                <p className="text-sm leading-relaxed opacity-85 mt-3 mb-0">
                  Shapley was one of the giants who built cooperative game theory. Instead of asking how rational egoists
                  fight each other, he asked: <strong>when a coalition cooperates to create something, what is each
                  member’s indisputable fair share?</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Right 7 cols: Bargaining vs External Authority Diagram */}
          <div className="lg:col-span-7 riso-card p-5 sm:p-6 flex flex-col justify-between">
            <div className="kf-kicker mb-4">
              <span className="text-riso-magenta">▦</span> Two paths to the exact same equilibrium
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-auto">
              {/* Box A: Messy Bargaining */}
              <div className="border-2 border-current/60 p-4 bg-paper-cream/50 dark:bg-zinc-900">
                <div className="text-xs font-bold uppercase text-riso-magenta mb-2">
                  1. Table Bargaining (What you just did)
                </div>
                <svg viewBox="0 0 200 90" className="w-full h-24 mb-2" style={{ filter: 'url(#kf-riso-stamp-rough)' }}>
                  <circle cx="35" cy="45" r="16" fill="#F53A61" stroke="currentColor" strokeWidth="2" />
                  <circle cx="100" cy="22" r="14" fill="#0078BF" stroke="currentColor" strokeWidth="2" />
                  <circle cx="165" cy="45" r="14" fill="#FFB511" stroke="currentColor" strokeWidth="2" />
                  <path d="M52 38 Q75 15 84 22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeDasharray="3 2" />
                  <path d="M88 32 Q65 55 52 46" fill="none" stroke="#F53A61" strokeWidth="1.75" />
                  <path d="M114 25 Q145 20 154 35" fill="none" stroke="currentColor" strokeWidth="1.75" strokeDasharray="3 2" />
                  <path d="M52 52 Q100 82 150 52" fill="none" stroke="currentColor" strokeWidth="1.75" />
                  <text x="100" y="82" textAnchor="middle" className="text-[10px]" fill="currentColor">
                    Offers, vetoes &amp; subgroup threats
                  </text>
                </svg>
                <div className="text-xs opacity-85 leading-snug">
                  Players push and veto until no coalition gets squeezed. Works for 3 diners; hopeless for 50 brain
                  regions.
                </div>
              </div>

              {/* Box B: Shapley Authority */}
              <div className="border-2 border-current p-4 bg-riso-cyan/10">
                <div className="text-xs font-bold uppercase text-riso-cyan mb-2">
                  2. The External Authority (φ)
                </div>
                <svg viewBox="0 0 200 90" className="w-full h-24 mb-2" style={{ filter: 'url(#kf-riso-stamp-rough)' }}>
                  <rect x="10" y="18" width="52" height="54" fill="var(--color-paper)" stroke="currentColor" strokeWidth="1.75" />
                  <text x="36" y="36" textAnchor="middle" className="text-[9px]" fill="currentColor">v(Solo)</text>
                  <text x="36" y="50" textAnchor="middle" className="text-[9px]" fill="currentColor">v(Pairs)</text>
                  <text x="36" y="64" textAnchor="middle" className="text-[9px]" fill="currentColor">v(All)</text>
                  <line x1="64" y1="45" x2="82" y2="45" stroke="currentColor" strokeWidth="2" />
                  <rect x="82" y="22" width="44" height="46" fill="#0078BF" stroke="currentColor" strokeWidth="2" />
                  <text x="104" y="50" textAnchor="middle" className="font-serif text-lg font-bold" fill="#FBF9F3">φᵢ(v)</text>
                  <line x1="126" y1="45" x2="144" y2="45" stroke="currentColor" strokeWidth="2" />
                  <rect x="144" y="16" width="48" height="17" fill="#F53A61" stroke="currentColor" strokeWidth="1.5" />
                  <text x="168" y="28" textAnchor="middle" className="text-[9px] font-bold" fill="#FBF9F3">$35</text>
                  <rect x="144" y="36" width="48" height="17" fill="#0078BF" stroke="currentColor" strokeWidth="1.5" />
                  <text x="168" y="48" textAnchor="middle" className="text-[9px] font-bold" fill="#FBF9F3">$17</text>
                  <rect x="144" y="56" width="48" height="17" fill="#FFB511" stroke="currentColor" strokeWidth="1.5" />
                  <text x="168" y="68" textAnchor="middle" className="text-[9px] font-bold" fill="#18181A">$8</text>
                </svg>
                <div className="text-xs opacity-85 leading-snug">
                  An impartial mathematical authority takes every subgroup’s cost and directly computes the unique fair
                  division.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter 2: How It Is Computed — The Interactive Arrival-Order Machine */}
      <div className="mb-20 pt-12 border-t border-current/20">
        <p className="kf-kicker mb-2">
          <span className="text-riso-magenta">▦</span> Act II · Part 02 / 04 · Under the hood
        </p>
        <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-3 riso-misreg-title">
          How it’s actually computed: The Arrival-Order Machine.
        </h2>
        <p className="text-lg opacity-85 max-w-3xl leading-relaxed mb-6">
          Here’s the intuition. Imagine the three of you walk through the restaurant door <strong>one by one</strong>.
          Whoever walks in first pays their full solo price. Whoever walks in second only pays the{' '}
          <strong>extra jump (marginal contribution)</strong> they add to the first person’s tab—which means the second
          and third arrivals pocket the combo discounts! Since it isn’t fair to let one person always arrive last,
          Shapley’s recipe is dead simple: <strong>play out all 3! = 6 possible arrival orders and average them.</strong>
        </p>

        {/* Arrival Order Interactive Machine */}
        <div className="riso-card p-5 sm:p-8">
          {/* Controls bar — responsive grid on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-current/20">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">
                Click any of the 6 possible arrival orders:
              </div>
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
                {PERMUTATIONS.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setIsPlayingAll(false);
                      setActivePermIdx(idx);
                    }}
                    className={`text-xs font-bold px-2.5 py-1.5 border-2 transition-all ${
                      activePermIdx === idx
                        ? 'border-riso-magenta bg-riso-magenta text-paper shadow-riso-ink'
                        : 'border-current bg-paper dark:bg-zinc-900 hover:bg-current/10'
                    }`}
                  >
                    #{idx + 1}: {p.shortId}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsPlayingAll((v) => !v)}
              className="self-start sm:self-end inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 border-2 border-current bg-riso-yellow text-ink hover:bg-riso-magenta hover:text-paper transition-colors lowercase shrink-0"
            >
              {isPlayingAll ? <RotateCcw size={14} /> : <Play size={14} />}
              <span>{isPlayingAll ? 'stop cycling' : 'animate all 6 orders'}</span>
            </button>
          </div>

          {/* Active Permutation Step-by-Step Visual */}
          <div className="mb-8">
            <div className="kf-kicker mb-3">
              <span className="text-riso-magenta">▦</span> Marginal jump as each person walks in (Order #{activePermIdx + 1}: {activePerm.id})
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {activePerm.steps.map((st, sIdx) => {
                const c = PLAYER_COLORS[st.who];
                return (
                  <div key={st.who} className="border-2 border-current p-4 bg-paper-cream/40 dark:bg-zinc-900 relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold opacity-65">Arrival 0{sIdx + 1}</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 ${c.bg} ${
                          st.who === 'Sam' ? 'text-ink' : 'text-paper'
                        }`}
                      >
                        {st.who} walks in
                      </span>
                    </div>
                    <div className="text-xs opacity-80 mb-2">
                      Table before: <strong>{st.before}</strong> → after: <strong>{st.after}</strong>
                    </div>
                    <div className="flex items-baseline justify-between pt-2 border-t border-current/20">
                      <span className="text-xs">Marginal cost added:</span>
                      <span className={`font-display text-2xl ${c.text}`}>+${st.marginal}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Visual stacked bar for this single permutation */}
            <div className="h-9 w-full border-2 border-current flex overflow-hidden text-xs font-bold">
              {activePerm.steps.map((st) => {
                const c = PLAYER_COLORS[st.who];
                return (
                  <div
                    key={st.who}
                    style={{ width: `${(st.marginal / 60) * 100}%` }}
                    className={`${c.bg} ${
                      st.who === 'Sam' ? 'text-ink' : 'text-paper'
                    } flex items-center justify-center border-r border-current last:border-r-0 transition-all duration-300 truncate px-1`}
                  >
                    <span className="hidden sm:inline">{st.who}: </span>+${st.marginal}
                  </div>
                );
              })}
            </div>
          </div>

          {/* All 6 Permutations Matrix Table -> Average = Shapley Value */}
          <div>
            <div className="kf-kicker mb-3">
              <span className="text-riso-cyan">▦</span> Average across all 6 arrival orders = The Shapley Value
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b-2 border-current text-left">
                    <th className="py-2 px-2 sm:px-3">Arrival Order</th>
                    <th className="py-2 px-2 sm:px-3 text-riso-magenta">You Add</th>
                    <th className="py-2 px-2 sm:px-3 text-riso-cyan">Alex Adds</th>
                    <th className="py-2 px-2 sm:px-3">Sam Adds</th>
                    <th className="py-2 px-2 sm:px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {PERMUTATIONS.map((p, idx) => {
                    const isCurrent = idx === activePermIdx;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setActivePermIdx(idx)}
                        className={`border-b border-current/20 cursor-pointer transition-colors ${
                          isCurrent ? 'bg-riso-magenta/15 font-bold' : 'hover:bg-current/5'
                        }`}
                      >
                        <td className="py-2 px-2 sm:px-3 whitespace-nowrap">
                          {isCurrent ? '▶ ' : ''}#{idx + 1} ({p.id})
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-riso-magenta font-semibold">${p.contribs.You}</td>
                        <td className="py-2 px-2 sm:px-3 text-riso-cyan font-semibold">${p.contribs.Alex}</td>
                        <td className="py-2 px-2 sm:px-3 font-semibold">${p.contribs.Sam}</td>
                        <td className="py-2 px-2 sm:px-3 text-right opacity-70">$60</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-current bg-current/5 font-bold text-xs sm:text-base">
                    <td className="py-3 px-2 sm:px-3">Shapley Average (÷ 6)</td>
                    <td className="py-3 px-2 sm:px-3 text-riso-magenta">$35</td>
                    <td className="py-3 px-2 sm:px-3 text-riso-cyan">$17</td>
                    <td className="py-3 px-2 sm:px-3">$8</td>
                    <td className="py-3 px-2 sm:px-3 text-right">$60</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Optional Interactive Sandbox Drawer */}
          <div className="mt-6 pt-5 border-t border-current/20">
            <button
              onClick={() => setSandboxOpen((v) => !v)}
              className="inline-flex items-center gap-2 text-xs font-bold px-3.5 py-2 border border-current hover:bg-current hover:text-paper transition-colors lowercase"
            >
              <Sliders size={13} />
              <span>{sandboxOpen ? 'close what-if sandbox' : 'what-if sandbox: change everyone’s solo menu prices'}</span>
            </button>

            {sandboxOpen && (
              <div className="mt-4 p-4 border-2 border-current bg-paper-cream/50 dark:bg-zinc-900 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 text-xs">
                  <div className="font-bold uppercase tracking-wider mb-1">
                    Drag anyone’s solo price (keeping the -$18 table discount fixed):
                  </div>
                  <label className="block">
                    <div className="flex justify-between mb-1">
                      <span className="text-riso-magenta font-bold">Your Solo Meal: ${customSoloYou}</span>
                      <span className="opacity-70">Default: $42</span>
                    </div>
                    <input
                      type="range"
                      min="18"
                      max="60"
                      value={customSoloYou}
                      onChange={(e) => setCustomSoloYou(Number(e.target.value))}
                      className="w-full accent-riso-magenta"
                    />
                  </label>
                  <label className="block">
                    <div className="flex justify-between mb-1">
                      <span className="text-riso-cyan font-bold">Alex’s Solo Meal: ${customSoloAlex}</span>
                      <span className="opacity-70">Default: $24</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="48"
                      value={customSoloAlex}
                      onChange={(e) => setCustomSoloAlex(Number(e.target.value))}
                      className="w-full accent-riso-cyan"
                    />
                  </label>
                  <label className="block">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold">Sam’s Solo Meal: ${customSoloSam}</span>
                      <span className="opacity-70">Default: $12</span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="36"
                      value={customSoloSam}
                      onChange={(e) => setCustomSoloSam(Number(e.target.value))}
                      className="w-full accent-riso-yellow"
                    />
                  </label>
                </div>

                <div className="flex flex-col justify-center border-l-0 md:border-l-2 border-current/20 md:pl-6">
                  <div className="text-xs uppercase font-semibold opacity-70 mb-2">
                    Live Recomputed Shapley Split (New Total Bill: ${cYAS})
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 border-2 border-current bg-riso-magenta text-paper">
                      <div className="text-[11px] font-bold">YOU</div>
                      <div className="font-display text-xl">${shapleyYou}</div>
                    </div>
                    <div className="p-2.5 border-2 border-current bg-riso-cyan text-paper">
                      <div className="text-[11px] font-bold">ALEX</div>
                      <div className="font-display text-xl">${shapleyAlex}</div>
                    </div>
                    <div className="p-2.5 border-2 border-current bg-riso-yellow text-ink">
                      <div className="text-[11px] font-bold">SAM</div>
                      <div className="font-display text-xl">${shapleySam}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCustomSoloYou(42);
                      setCustomSoloAlex(24);
                      setCustomSoloSam(12);
                    }}
                    className="mt-3 self-start text-xs underline opacity-75 hover:opacity-100 lowercase"
                  >
                    reset to ($42, $24, $12)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chapter 3: The 4 Axioms — Interactive Stress-Test Grid */}
      <div className="mb-20 pt-12 border-t border-current/20">
        <p className="kf-kicker mb-2">
          <span className="text-riso-yellow">▦</span> Act II · Part 03 / 04 · Why there is no alternative
        </p>
        <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-3 riso-misreg-title">
          The four axioms: Why it’s the <em>only</em> fair solution.
        </h2>
        <p className="text-lg opacity-85 max-w-3xl leading-relaxed mb-8">
          Here’s the real gem. You might think, <em>“Sure, averaging over arrival orders is neat, but couldn’t someone
          invent another fair formula?”</em> Nope. Shapley proved that if you want four basic, common-sense rules of
          fairness to hold, <strong>this formula is mathematically unique</strong>—meaning there is literally no other
          way to divide the return if you want everyone to get what they deserve. Click <strong>break this axiom</strong>{' '}
          on any card below to see what goes wrong when you drop even one of them:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AXIOMS.map((ax) => {
            const isBroken = !!brokenAxioms[ax.id];
            const state = isBroken ? ax.brokenState : ax.fairState;

            return (
              <div
                key={ax.id}
                className={`riso-card p-5 sm:p-6 flex flex-col justify-between transition-colors ${
                  isBroken ? 'border-riso-magenta bg-riso-magenta/5' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold uppercase px-2 py-0.5 border border-current">
                      Axiom {ax.number}
                    </span>
                    <button
                      onClick={() => toggleAxiomBroken(ax.id)}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 border-2 transition-colors lowercase ${
                        isBroken
                          ? 'border-riso-cyan bg-riso-cyan text-paper'
                          : 'border-riso-magenta text-riso-magenta hover:bg-riso-magenta hover:text-paper'
                      }`}
                    >
                      {isBroken ? <Check size={13} /> : <ShieldAlert size={13} />}
                      <span>{isBroken ? 'restore axiom' : 'break this axiom'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                    <h3 className="font-display text-2xl">{ax.name}</h3>
                    <code className="font-mono text-xs px-2 py-0.5 bg-current/10">{ax.math}</code>
                  </div>
                  <p className="text-sm opacity-85 leading-relaxed mb-4">{ax.plain}</p>
                </div>

                {/* Interactive Visual Bar inside the Axiom Card */}
                <div className="border-2 border-current p-3.5 bg-paper dark:bg-zinc-900">
                  <div className="text-xs font-bold mb-1.5 flex items-center justify-between">
                    <span className={isBroken ? 'text-riso-magenta' : 'text-riso-cyan'}>{state.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold opacity-80 mb-1.5">
                    {state.bars.map((b) => (
                      <span key={b.name}>
                        {b.name}: <strong>${b.val}</strong>
                      </span>
                    ))}
                  </div>
                  <div className="h-8 w-full border border-current flex overflow-hidden text-xs font-bold mb-2">
                    {state.bars.map((b) => (
                      <div
                        key={b.name}
                        style={{ width: `${Math.max(15, (b.val / 60) * 100)}%` }}
                        className={`${b.color} flex items-center justify-center px-1 border-r border-current last:border-r-0 transition-all duration-300 truncate`}
                      >
                        <span className="hidden sm:inline">{b.name}: </span>${b.val}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs opacity-85">{state.verdict}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chapter 4: Why It's So Useful Across Different Fields */}
      <div className="pt-12 border-t border-current/20">
        <p className="kf-kicker mb-2">
          <span className="text-riso-cyan">▦</span> Act II · Part 04 / 04 · Universal credit assignment
        </p>
        <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-3 riso-misreg-title">
          Why this one idea quietly took over science.
        </h2>
        <p className="text-lg opacity-85 max-w-3xl leading-relaxed mb-6">
          Once you realise that <strong>“players”</strong> don’t have to be hungry friends and <strong>“the bill”</strong>{' '}
          doesn’t have to be dollars, the Shapley value turns into a universal lens for any complex system where parts
          cooperate to produce an outcome. Flip between domains below—notice how the exact same{' '}
          <strong>(35, 17, 8)</strong> math keeps showing up:
        </p>

        <div className="riso-card p-5 sm:p-8">
          {/* Domain Switcher Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {CROSS_FIELD_EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setActiveField(ex.id)}
                className={`p-3.5 border-2 text-left transition-all ${
                  activeField === ex.id
                    ? 'border-riso-magenta bg-riso-magenta text-paper shadow-riso-ink'
                    : 'border-current bg-paper dark:bg-zinc-900 hover:bg-current/5'
                }`}
              >
                <div className="text-xs uppercase tracking-wider font-semibold opacity-80">{ex.tag}</div>
                <div className="font-display text-lg mt-0.5">{ex.title}</div>
              </button>
            ))}
          </div>

          {/* Active Domain Visual */}
          {CROSS_FIELD_EXAMPLES.filter((ex) => ex.id === activeField).map((ex) => (
            <div key={ex.id} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5">
                <div className="text-xs uppercase tracking-widest text-riso-magenta font-bold mb-1">
                  {ex.baseline}
                </div>
                <h3 className="font-display text-2xl sm:text-3xl mb-3">{ex.title}</h3>
                <p className="text-base opacity-85 leading-relaxed mb-4">{ex.description}</p>
                <div className="text-xs p-3 kf-paper-slip">
                  <Sparkles size={13} className="inline mr-1.5 text-riso-magenta" />
                  Same math, different players: swap diners for runways, model features, or cortical areas.
                </div>
              </div>

              <div className="lg:col-span-7 border-2 border-current p-4 sm:p-5 bg-paper-cream/40 dark:bg-zinc-900">
                <div className="text-xs uppercase font-bold opacity-70 mb-4">
                  ▦ Fair Attribution Breakdown ({ex.unit})
                </div>
                <div className="space-y-4">
                  {ex.nodes.map((n, idx) => {
                    const colors = ['bg-riso-magenta text-paper', 'bg-riso-cyan text-paper', 'bg-riso-yellow text-ink'];
                    return (
                      <div key={n.role}>
                        <div className="flex justify-between text-xs sm:text-sm mb-1">
                          <span>
                            <strong>{n.role}</strong> <span className="opacity-65">← {n.mapTo}</span>
                          </span>
                          <span className="font-bold">{n.share}</span>
                        </div>
                        <div className="h-7 w-full border border-current bg-paper dark:bg-zinc-800">
                          <div
                            style={{ width: `${n.pct}%` }}
                            className={`h-full ${colors[idx]} flex items-center px-2.5 text-xs font-bold transition-all duration-500`}
                          >
                            φ = {n.share}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
