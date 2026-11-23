import React, { useState } from 'react';
import { ExternalLink, Cpu, Activity, Network, GitBranch, Zap, Layers } from 'lucide-react';

export default function MsaResearchAct() {
  const [nodeCount, setNodeCount] = useState(19);
  const [msaFeature, setMsaFeature] = useState('sampling');

  // Vignette 1 (Fakhar & Hilgetag, PLoS Comput. Biol. 2022):
  // Paradoxical Lesion Effect (The Sprague Effect)
  // States: 'intact' (90%) | 'lesionA' (15% crash) | 'doubleAB' (75% paradoxical recovery!) | 'msa' (2D MSA view)
  const [v1State, setV1State] = useState('lesionA');

  // Vignette 2 (Fakhar et al., Sci. Rep. 2024): Activity vs Causal Contribution
  const [v2Lens, setV2Lens] = useState('activity');

  // Vignette 3 (Fakhar et al., eLife 2025): Shortest Path vs Game-Theoretic Coalition Backbone
  const [v3Lens, setV3Lens] = useState('shapley');

  const exactCombinations = Math.pow(2, nodeCount);
  const formattedExact =
    nodeCount <= 20
      ? exactCombinations.toLocaleString()
      : `${(exactCombinations / Math.pow(10, Math.floor(Math.log10(exactCombinations)))).toFixed(2)} × 10^${Math.floor(
          Math.log10(exactCombinations)
        )}`;
  const msaSampledCombinations = nodeCount * 100;

  return (
    <section id="act-3" className="py-16 px-4 sm:px-8 max-w-5xl mx-auto border-t-2 border-current">
      {/* Section Header */}
      <div className="mb-12">
        <p className="kf-kicker mb-2">
          <span className="text-riso-magenta">▦</span> Act III · Bringing it home to neuroscience (MSA)
        </p>
        <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-4 riso-misreg-title">
          Who’s actually doing what in the brain?
        </h2>
        <p className="text-lg sm:text-xl opacity-85 max-w-3xl leading-relaxed">
          During my PhD, I realised that although neuroscience has fancy tools to record and zap thousands of neurons,
          our logical foundation for deciding <em>what caused what</em> hasn’t changed much in a century. We usually break
          one region, see what fails, and call it a day. To fix that, we built upon{' '}
          <strong>Multi-perturbation Shapley value Analysis (MSA)</strong>—and with my friend Shrey Dixit, packaged it into{' '}
          <a
            href="https://github.com/kuffmode/msa"
            target="_blank"
            rel="noopener noreferrer"
            className="text-riso-magenta underline font-semibold"
          >
            MSApy ↗
          </a>
          .
        </p>
      </div>

      {/* Part 1: Visual Diagram — How MSA Expands Upon Classical Shapley */}
      <div className="riso-card p-5 sm:p-8 mb-14">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-current/20">
          <div className="kf-kicker">
            <span className="text-riso-magenta">▦</span> How MSA expands classical Shapley (MSApy)
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'sampling', label: '1. Permutation Sampling', icon: GitBranch },
              { id: 'interactions', label: '2. 2D Interactions (Synergy/Antagonism)', icon: Zap },
              { id: 'multidim', label: '3. Time-Series & Causal Flow', icon: Layers },
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setMsaFeature(tab.id)}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 border-2 transition-all ${
                    msaFeature === tab.id
                      ? 'border-riso-magenta bg-riso-magenta text-paper'
                      : 'border-current bg-paper dark:bg-zinc-900 hover:bg-current/5'
                  }`}
                >
                  <IconComp size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {msaFeature === 'sampling' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6 space-y-4">
              <h3 className="font-display text-2xl sm:text-3xl">
                Dodging the <code className="font-mono text-riso-magenta">2ᴺ</code> combinatorial explosion.
              </h3>
              <p className="text-sm sm:text-base opacity-85 leading-relaxed">
                With 3 diners at a restaurant, there are only <code className="font-mono">2³ = 8</code> combinations.
                With <strong>19 neurons</strong> or <strong>52 cortical areas</strong>, testing every combination of
                lesions takes <code className="font-mono">4.5 × 10¹⁵</code> experiments (good luck running that before the
                sun burns out). Instead, <strong>MSApy</strong> samples random arrival permutations, translates them into
                multi-site virtual lesions (<code className="font-mono">complement_space</code>), and converges on unbiased
                Shapley values in a fraction of the time.
              </p>

              {/* Interactive Node Count Slider */}
              <div className="p-4 border-2 border-current bg-paper-cream/50 dark:bg-zinc-900 text-xs">
                <div className="flex justify-between font-bold mb-2">
                  <span>Network Size: N = {nodeCount} nodes</span>
                  <span className="text-riso-magenta">
                    {nodeCount === 3
                      ? '3 Diners'
                      : nodeCount === 19
                      ? '19-Unit Neural Circuit'
                      : nodeCount >= 50
                      ? 'Whole-Brain Connectome'
                      : 'Artificial Neural Network'}
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="52"
                  value={nodeCount}
                  onChange={(e) => setNodeCount(Number(e.target.value))}
                  className="w-full accent-riso-magenta mb-3"
                />
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-current/20">
                  <div>
                    <div className="opacity-70">All possible lesion sets (2ᴺ):</div>
                    <div className="text-base font-bold text-riso-magenta font-mono">{formattedExact}</div>
                  </div>
                  <div>
                    <div className="opacity-70">MSApy sampled (100 perms):</div>
                    <div className="text-base font-bold text-riso-cyan font-mono">≤ {msaSampledCombinations.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Pipeline Diagram of MSApy */}
            <div className="lg:col-span-6 border-2 border-current p-4 bg-paper-cream/30 dark:bg-zinc-900">
              <div className="text-xs font-bold uppercase opacity-70 mb-2">
                ▦ Unbiased Permutation Sampling Pipeline (MSApy)
              </div>
              <svg viewBox="0 0 380 185" className="w-full h-auto" style={{ filter: 'url(#kf-riso-stamp-rough)' }}>
                <rect x="8" y="20" width="76" height="145" fill="var(--color-paper)" stroke="currentColor" strokeWidth="2" />
                <text x="46" y="38" textAnchor="middle" className="text-[9px] font-bold" fill="currentColor">
                  1. PLAYERS
                </text>
                <circle cx="30" cy="68" r="11" fill="#F53A61" stroke="currentColor" strokeWidth="1.5" />
                <text x="30" y="71" textAnchor="middle" className="text-[9px] font-bold" fill="#FBF9F3">A</text>
                <circle cx="62" cy="68" r="11" fill="#0078BF" stroke="currentColor" strokeWidth="1.5" />
                <text x="62" y="71" textAnchor="middle" className="text-[9px] font-bold" fill="#FBF9F3">B</text>
                <circle cx="30" cy="105" r="11" fill="#FFB511" stroke="currentColor" strokeWidth="1.5" />
                <text x="30" y="108" textAnchor="middle" className="text-[9px] font-bold" fill="#18181A">C</text>
                <circle cx="62" cy="105" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
                <text x="62" y="108" textAnchor="middle" className="text-[9px]" fill="currentColor">..N</text>
                <text x="46" y="145" textAnchor="middle" className="text-[8px]" fill="currentColor">
                  Brain / ANN
                </text>

                <line x1="84" y1="92" x2="104" y2="92" stroke="currentColor" strokeWidth="2" />

                <rect x="104" y="20" width="128" height="145" fill="var(--color-paper)" stroke="currentColor" strokeWidth="2" />
                <text x="168" y="38" textAnchor="middle" className="text-[9px] font-bold" fill="currentColor">
                  2. MULTI-SITE LESIONS
                </text>
                <rect x="114" y="50" width="108" height="24" fill="#F53A61" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.2" />
                <text x="168" y="65" textAnchor="middle" className="text-[8.5px]" fill="currentColor">
                  Lesion &#123;B, C&#125; → v(&#123;A&#125;)
                </text>
                <rect x="114" y="82" width="108" height="24" fill="#0078BF" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.2" />
                <text x="168" y="97" textAnchor="middle" className="text-[8.5px]" fill="currentColor">
                  Lesion &#123;C&#125; → v(&#123;A,B&#125;)
                </text>
                <rect x="114" y="114" width="108" height="24" fill="#FFB511" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.2" />
                <text x="168" y="129" textAnchor="middle" className="text-[8.5px]" fill="currentColor">
                  Intact → v(All)
                </text>
                <text x="168" y="153" textAnchor="middle" className="text-[8px]" fill="currentColor">
                  Parallel / Ray / Joblib
                </text>

                <line x1="232" y1="92" x2="252" y2="92" stroke="currentColor" strokeWidth="2" />

                <rect x="252" y="20" width="120" height="145" fill="var(--color-paper)" stroke="currentColor" strokeWidth="2" />
                <text x="312" y="38" textAnchor="middle" className="text-[9px] font-bold" fill="currentColor">
                  3. SHAPLEY TABLE
                </text>
                <rect x="266" y="55" width="70" height="18" fill="#F53A61" />
                <text x="272" y="67" className="text-[9px] font-bold" fill="#FBF9F3">φ(A) = 0.58</text>
                <rect x="266" y="82" width="46" height="18" fill="#0078BF" />
                <text x="272" y="94" className="text-[9px] font-bold" fill="#FBF9F3">φ(B) = 0.28</text>
                <rect x="266" y="109" width="28" height="18" fill="#FFB511" />
                <text x="270" y="121" className="text-[8.5px] font-bold" fill="#18181A">0.14</text>
                <text x="312" y="148" textAnchor="middle" className="text-[8px]" fill="currentColor">
                  Causal Contribution
                </text>
              </svg>
            </div>
          </div>
        )}

        {msaFeature === 'interactions' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6 space-y-3">
              <h3 className="font-display text-2xl sm:text-3xl">
                2D MSA: Synergy, Redundancy, and Paradoxical Antagonism.
              </h3>
              <p className="text-sm sm:text-base opacity-85 leading-relaxed">
                A 1D Shapley value tells you how much each node contributes on average. Push it to <strong>2D MSA</strong>{' '}
                (<code className="font-mono">msa.network_interaction_2d</code>) and you can measure how pairs of brain
                regions team up or sabotage each other—comparing their joint contribution <code className="font-mono">γ(AB)</code>{' '}
                against the sum of their individual contributions when the partner is lesioned.
              </p>
              <div className="p-3.5 kf-paper-slip text-xs">
                <strong>2D Interaction Index:</strong>{' '}
                <code className="font-mono">I(A, B) = γ(AB) − [γ(A without B) + γ(B without A)]</code>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="border-2 border-current p-4 bg-riso-magenta/10">
                <div className="font-bold text-riso-magenta uppercase mb-1">Synergy (I &gt; 0)</div>
                <div className="opacity-85 mb-3">
                  Whole &gt; sum of parts. Both regions must stay intact together—knock out either one and the circuit
                  collapses.
                </div>
                <div className="space-y-1 font-medium">
                  <div className="flex justify-between"><span>A without B:</span><strong>10%</strong></div>
                  <div className="flex justify-between"><span>B without A:</span><strong>10%</strong></div>
                  <div className="flex justify-between border-t border-current/30 pt-1 text-riso-magenta">
                    <span>A &amp; B together:</span><strong>75% (+55%)</strong>
                  </div>
                </div>
              </div>

              <div className="border-2 border-current p-4 bg-riso-cyan/10">
                <div className="font-bold text-riso-cyan uppercase mb-1">Redundancy / Backup (I &lt; 0)</div>
                <div className="opacity-85 mb-3">
                  Overlap or backup pathways. Lesioning one barely dents performance until the backup partner is also
                  lesioned.
                </div>
                <div className="space-y-1 font-medium">
                  <div className="flex justify-between"><span>A without B:</span><strong>60%</strong></div>
                  <div className="flex justify-between"><span>B without A:</span><strong>60%</strong></div>
                  <div className="flex justify-between border-t border-current/30 pt-1 text-riso-cyan">
                    <span>A &amp; B together:</span><strong>65% (-55%)</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {msaFeature === 'multidim' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6 space-y-3">
              <h3 className="font-display text-2xl sm:text-3xl">
                Beyond a single number: Time-series &amp; causal influence matrices.
              </h3>
              <p className="text-sm sm:text-base opacity-85 leading-relaxed">
                A dinner check is one number ($60). Brain activity unfolds over <strong>time, frequency bands, and
                downstream targets</strong>. MSApy generalises the game output to N-dimensional arrays
                (<code className="font-mono">ShapleyTableND</code>) and iteratively runs MSA on every target node
                (<code className="font-mono">estimate_causal_influences</code>) to recover the directed causal flow matrix
                of the whole network.
              </p>
            </div>
            <div className="lg:col-span-6 border-2 border-current p-4 bg-paper-cream/40 dark:bg-zinc-900 text-xs">
              <div className="uppercase font-bold opacity-70 mb-2">▦ Temporal Shapley Trajectory φᵢ(t)</div>
              <svg viewBox="0 0 320 110" className="w-full h-28">
                <line x1="25" y1="90" x2="305" y2="90" stroke="currentColor" strokeWidth="1.5" />
                <line x1="25" y1="15" x2="25" y2="90" stroke="currentColor" strokeWidth="1.5" />
                <path d="M25 88 Q75 10, 130 65 T300 85" fill="none" stroke="#F53A61" strokeWidth="3" />
                <path d="M25 88 Q120 85, 195 20 T300 55" fill="none" stroke="#0078BF" strokeWidth="3" />
                <text x="85" y="24" className="text-[9px] font-bold" fill="#F53A61">Early Sensory Driver φA(t)</text>
                <text x="195" y="22" className="text-[9px] font-bold" fill="#0078BF">Late Integrator φB(t)</text>
                <text x="275" y="104" className="text-[8px]" fill="currentColor">Time (ms) →</text>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Part 2: Three Interactive Research Vignettes */}
      <div className="mb-6">
        <p className="kf-kicker mb-1">
          <span className="text-riso-magenta">▦</span> Three playgrounds from our papers
        </p>
        <h3 className="font-display text-3xl sm:text-4xl">
          Where conventional intuition falls apart—and MSA shines.
        </h3>
      </div>

      <div className="space-y-8">
        {/* VIGNETTE 1: Fakhar & Hilgetag (2022) PLOS CB — THE PARADOXICAL LESION (Sprague Effect) */}
        <div className="riso-card p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-5 border-b border-current/20">
            <div>
              <span className="text-xs font-bold uppercase px-2 py-0.5 bg-riso-magenta text-paper mr-2">
                01 · PLoS Comput. Biol. (2022)
              </span>
              <span className="text-xs font-semibold opacity-75">Fakhar &amp; Hilgetag</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'intact', label: '1. Intact (90%)' },
                { id: 'lesionA', label: '2. Lesion A (15%!)' },
                { id: 'doubleAB', label: '3. Double Lesion A+B (75%?!)' },
                { id: 'msa', label: '4. MSA 2D Explanation' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setV1State(btn.id)}
                  className={`text-xs font-bold px-2.5 py-1 border-2 transition-colors ${
                    v1State === btn.id
                      ? btn.id === 'msa'
                        ? 'border-riso-cyan bg-riso-cyan text-paper'
                        : 'border-riso-magenta bg-riso-magenta text-paper'
                      : 'border-current bg-paper dark:bg-zinc-900 hover:bg-current/5'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6">
              <h4 className="font-display text-2xl sm:text-3xl mb-2">
                The Paradoxical Lesion: When breaking a second region heals the first.
              </h4>
              <p className="text-sm sm:text-base opacity-85 leading-relaxed mb-4">
                If you think single lesions tell you what a brain area does, meet the <strong>Sprague effect
                (paradoxical lesion)</strong>. You damage <strong className="text-riso-magenta">Region A</strong> and the
                animal goes blind in one hemifield (performance crashes from 90% to 15%). Then you damage a second area,{' '}
                <strong className="text-riso-cyan">Region B</strong>, on top of the broken brain—and vision{' '}
                <strong>miraculously comes back (75%)!</strong> Step through buttons <strong>1 → 4</strong> above:
              </p>

              <div className="p-4 border-2 border-current bg-paper-cream/50 dark:bg-zinc-900 text-xs sm:text-sm leading-relaxed">
                {v1State === 'intact' && (
                  <>
                    <div className="font-bold text-riso-cyan uppercase mb-1">State 1: Intact Brain (Performance = 90%)</div>
                    <p className="m-0">
                      <strong className="text-riso-magenta">Region A</strong> excites the downstream output while also
                      keeping <strong className="text-riso-cyan">Region B</strong> (an inhibitory competitor) in check.
                      Everything is balanced. Now click <strong>2. Lesion A</strong> →
                    </p>
                  </>
                )}
                {v1State === 'lesionA' && (
                  <>
                    <div className="font-bold text-riso-magenta uppercase mb-1">
                      State 2: Single Lesion of A (Performance crashes to 15%)
                    </div>
                    <p className="m-0">
                      With <strong className="text-riso-magenta">Region A</strong> knocked out,{' '}
                      <strong className="text-riso-cyan">Region B</strong> is disinhibited—it goes rogue and slams the
                      downstream target with runaway inhibition. Classical single-lesion logic concludes the circuit is
                      permanently destroyed. Now try <strong>3. Double Lesion A+B</strong> →
                    </p>
                  </>
                )}
                {v1State === 'doubleAB' && (
                  <>
                    <div className="font-bold text-riso-yellow uppercase mb-1">
                      State 3: Double Lesion A + B (Paradoxical Recovery to 75%!)
                    </div>
                    <p className="m-0">
                      Wait—we broke <em>more</em> of the network and it got <em>better</em>?! By also lesioning{' '}
                      <strong className="text-riso-cyan">Region B</strong>, we silenced the runaway inhibition, allowing
                      auxiliary pathways to drive the output again. Single-lesion logic breaks down completely here.
                    </p>
                  </>
                )}
                {v1State === 'msa' && (
                  <>
                    <div className="font-bold text-riso-cyan uppercase mb-1">
                      State 4: How MSA Nails the Paradox
                    </div>
                    <p className="m-0">
                      Because MSA systematically perturbs <code className="font-mono">&#123;A&#125;</code>,{' '}
                      <code className="font-mono">&#123;B&#125;</code>, and{' '}
                      <code className="font-mono">&#123;A, B&#125;</code> together, it assigns <strong className="text-riso-magenta">Region A</strong> a
                      strong positive Shapley value (<code className="font-mono">φA = +62%</code>), catches{' '}
                      <strong className="text-riso-cyan">Region B’s</strong> suppressive role (<code className="font-mono">φB = -18%</code>),
                      and pinpoints the exact inhibitory rivalry in the 2D interaction matrix!
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Interactive SVG Circuit + Performance Meter */}
            <div className="lg:col-span-6 border-2 border-current p-4 bg-paper-cream/30 dark:bg-zinc-900">
              <div className="text-xs font-bold uppercase opacity-70 mb-2 flex justify-between">
                <span>▦ Paradoxical Lesion Circuit (Click nodes to toggle)</span>
                <span className="text-riso-magenta">
                  {v1State === 'intact'
                    ? 'Accuracy: 90%'
                    : v1State === 'lesionA'
                    ? 'Accuracy: 15% (Crash!)'
                    : v1State === 'doubleAB'
                    ? 'Accuracy: 75% (Restored!)'
                    : 'MSA Shapley Map'}
                </span>
              </div>

              <svg viewBox="0 0 330 145" className="w-full h-36 mb-3">
                {/* Input to A and Auxiliary relay */}
                <line x1="48" y1="72" x2="132" y2="32" stroke="currentColor" strokeWidth="2.5" />
                <line x1="48" y1="72" x2="262" y2="72" stroke="currentColor" strokeWidth="1.8" strokeDasharray="4 3" />
                <text x="155" y="66" textAnchor="middle" className="text-[8px]" fill="currentColor">
                  Backup Relay (+60%)
                </text>

                {/* A excites Output */}
                <line
                  x1="168"
                  y1="32"
                  x2="265"
                  y2="64"
                  stroke={v1State === 'lesionA' || v1State === 'doubleAB' ? '#999' : '#F53A61'}
                  strokeWidth="3"
                  strokeDasharray={v1State === 'lesionA' || v1State === 'doubleAB' ? '4 3' : 'none'}
                />

                {/* A restrains B */}
                <line
                  x1="150"
                  y1="52"
                  x2="150"
                  y2="92"
                  stroke={v1State === 'lesionA' || v1State === 'doubleAB' ? '#999' : '#F53A61'}
                  strokeWidth="2.2"
                  strokeDasharray={v1State === 'lesionA' || v1State === 'doubleAB' ? '3 3' : 'none'}
                />
                <text x="112" y="76" className="text-[8px] font-bold" fill="#F53A61">
                  restrains ⊣
                </text>

                {/* B hyper-inhibits Output when A is gone */}
                <line
                  x1="168"
                  y1="112"
                  x2="265"
                  y2="80"
                  stroke={v1State === 'doubleAB' ? '#999' : '#0078BF'}
                  strokeWidth={v1State === 'lesionA' ? '5' : '2.5'}
                  strokeDasharray={v1State === 'doubleAB' ? '4 3' : 'none'}
                />
                <text x="225" y="114" textAnchor="middle" className="text-[8.5px] font-bold" fill="#0078BF">
                  {v1State === 'lesionA' ? 'RUNAWAY INHIBITION ⊣' : 'Inhibition ⊣'}
                </text>

                {/* Input Node */}
                <circle cx="36" cy="72" r="16" fill="var(--color-paper)" stroke="currentColor" strokeWidth="2" />
                <text x="36" y="75" textAnchor="middle" className="text-[9px] font-bold" fill="currentColor">IN</text>

                {/* Region A (Clickable) */}
                <g
                  onClick={() => setV1State(v1State === 'intact' ? 'lesionA' : 'intact')}
                  className="cursor-pointer"
                >
                  <circle
                    cx="150"
                    cy="32"
                    r="20"
                    fill={v1State === 'lesionA' || v1State === 'doubleAB' ? '#76736B' : '#F53A61'}
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <text x="150" y="36" textAnchor="middle" className="text-[10px] font-bold" fill="#FBF9F3">
                    {v1State === 'lesionA' || v1State === 'doubleAB' ? '✕ A' : v1State === 'msa' ? 'φ=+62%' : 'Node A'}
                  </text>
                </g>

                {/* Region B (Clickable) */}
                <g
                  onClick={() => setV1State(v1State === 'doubleAB' ? 'lesionA' : 'doubleAB')}
                  className="cursor-pointer"
                >
                  <circle
                    cx="150"
                    cy="112"
                    r="20"
                    fill={v1State === 'doubleAB' ? '#76736B' : '#0078BF'}
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <text x="150" y="116" textAnchor="middle" className="text-[10px] font-bold" fill="#FBF9F3">
                    {v1State === 'doubleAB' ? '✕ B' : v1State === 'msa' ? 'φ=-18%' : 'Node B'}
                  </text>
                </g>

                {/* Output Node */}
                <circle cx="284" cy="72" r="24" fill="#FFB511" stroke="currentColor" strokeWidth="2" />
                <text x="284" y="69" textAnchor="middle" className="text-[8.5px] font-bold" fill="#18181A">BEHAVIOUR</text>
                <text x="284" y="81" textAnchor="middle" className="text-[11px] font-bold" fill="#18181A">
                  {v1State === 'intact' ? '90%' : v1State === 'lesionA' ? '15%' : v1State === 'doubleAB' ? '75%' : 'Solved'}
                </text>
              </svg>

              {/* System Output Bar across the 3 lesion states */}
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span>Behavioral Performance under current lesion state:</span>
                  <span className="text-riso-magenta">
                    {v1State === 'intact'
                      ? '90% (Healthy)'
                      : v1State === 'lesionA'
                      ? '15% (Collapsed)'
                      : v1State === 'doubleAB'
                      ? '75% (Paradoxically Restored!)'
                      : 'MSA: φA = +62%, φB = -18%'}
                  </span>
                </div>
                <div className="h-5 border-2 border-current bg-paper dark:bg-zinc-800">
                  <div
                    style={{
                      width:
                        v1State === 'intact'
                          ? '90%'
                          : v1State === 'lesionA'
                          ? '15%'
                          : v1State === 'doubleAB'
                          ? '75%'
                          : '82%',
                    }}
                    className={`h-full transition-all duration-500 ${
                      v1State === 'lesionA'
                        ? 'bg-riso-magenta'
                        : v1State === 'doubleAB'
                        ? 'bg-riso-yellow'
                        : 'bg-riso-cyan'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VIGNETTE 2: Fakhar et al. (2024) Scientific Reports */}
        <div className="riso-card p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-5 border-b border-current/20">
            <div>
              <span className="text-xs font-bold uppercase px-2 py-0.5 bg-riso-cyan text-paper mr-2">
                02 · Scientific Reports (2024)
              </span>
              <span className="text-xs font-semibold opacity-75">Fakhar, Dixit, Hadaeghi, Kording &amp; Hilgetag</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setV2Lens('activity')}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 border-2 ${
                  v2Lens === 'activity'
                    ? 'border-riso-yellow bg-riso-yellow text-ink'
                    : 'border-current bg-paper dark:bg-zinc-900'
                }`}
              >
                <Activity size={13} />
                <span>What Electrodes See (Activity)</span>
              </button>
              <button
                onClick={() => setV2Lens('causal')}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 border-2 ${
                  v2Lens === 'causal'
                    ? 'border-riso-magenta bg-riso-magenta text-paper'
                    : 'border-current bg-paper dark:bg-zinc-900'
                }`}
              >
                <Cpu size={13} />
                <span>What MSA Sees (Causal φ)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6">
              <h4 className="font-display text-2xl sm:text-3xl mb-2">
                Shouting the loudest doesn’t mean you’re driving the bus.
              </h4>
              <p className="text-sm sm:text-base opacity-85 leading-relaxed mb-4">
                In neuroscience, we love recording from neurons, seeing which ones light up during a task, and declaring
                they “encode” and drive the behaviour. In this paper, we showed that <strong>downstream network
                transformations dissociate neural activity from causal functional contribution</strong>. Toggle between
                the recording view and the MSA view:
              </p>
              <div className="p-3.5 border-2 border-current bg-paper-cream/50 dark:bg-zinc-900 text-xs sm:text-sm">
                {v2Lens === 'activity' ? (
                  <>
                    <div className="font-bold text-riso-yellow uppercase mb-1">
                      Recording View: Looking at spike rates &amp; task correlation
                    </div>
                    <p className="m-0 leading-snug">
                      <strong>Neuron 01 (“The Screamer”)</strong> fires like crazy at 92 Hz right when the stimulus
                      appears! Meanwhile <strong>Neuron 02 (“The Quiet Gate”)</strong> barely whispers at 18 Hz. Any
                      standard correlation analysis bets the house on Neuron 01. Now flip to <strong>What MSA Sees</strong> →
                    </p>
                  </>
                ) : (
                  <>
                    <div className="font-bold text-riso-magenta uppercase mb-1">
                      MSA Causal View: Complete inversion!
                    </div>
                    <p className="m-0 leading-snug">
                      Downstream layers filter and cancel out Neuron 01’s noisy bursts (<code className="font-mono">φ = 12%</code>),
                      while quiet Neuron 02 sits at a nonlinear bottleneck that actually steers the decision (<code className="font-mono">φ = 88%</code>).
                      Bottom line: high activity ≠ high causal contribution!
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Interactive Activity vs Causal Inversion Chart */}
            <div className="lg:col-span-6 border-2 border-current p-4 bg-paper-cream/30 dark:bg-zinc-900 text-xs">
              <div className="uppercase font-bold opacity-70 mb-3">
                ▦ {v2Lens === 'activity' ? 'Recorded Neural Activity (Spike Rate)' : 'MSA Causal Shapley Value (φ)'}
              </div>

              <div className="space-y-4">
                <div className="p-3 border border-current bg-paper dark:bg-zinc-800">
                  <div className="flex justify-between mb-1.5">
                    <strong>Neuron 01 (“Loud Upstream Unit”)</strong>
                    <span className="font-bold text-riso-yellow">
                      {v2Lens === 'activity' ? '92% Firing Rate' : 'φ = 12% (Cancelled Downstream)'}
                    </span>
                  </div>
                  <div className="h-6 border border-current bg-current/10">
                    <div
                      style={{ width: v2Lens === 'activity' ? '92%' : '12%' }}
                      className={`h-full transition-all duration-500 ${
                        v2Lens === 'activity' ? 'bg-riso-yellow' : 'bg-current/40'
                      }`}
                    />
                  </div>
                </div>

                <div className="p-3 border border-current bg-paper dark:bg-zinc-800">
                  <div className="flex justify-between mb-1.5">
                    <strong>Neuron 02 (“Quiet Bottleneck Gate”)</strong>
                    <span className="font-bold text-riso-magenta">
                      {v2Lens === 'activity' ? '18% Firing Rate' : 'φ = 88% (True Causal Driver)'}
                    </span>
                  </div>
                  <div className="h-6 border border-current bg-current/10">
                    <div
                      style={{ width: v2Lens === 'activity' ? '18%' : '88%' }}
                      className="h-full bg-riso-magenta transition-all duration-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VIGNETTE 3: Fakhar et al. (2025) eLife */}
        <div className="riso-card p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-5 border-b border-current/20">
            <div>
              <span className="text-xs font-bold uppercase px-2 py-0.5 bg-riso-yellow text-ink mr-2">
                03 · eLife (2025)
              </span>
              <span className="text-xs font-semibold opacity-75">
                Fakhar, Hadaeghi, Seguin, Dixit, Messé, Zamora-López, Misic &amp; Hilgetag
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setV3Lens('shortest')}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 border-2 ${
                  v3Lens === 'shortest'
                    ? 'border-current bg-ink text-paper'
                    : 'border-current bg-paper dark:bg-zinc-900'
                }`}
              >
                <span>Naive Shortest Path</span>
              </button>
              <button
                onClick={() => setV3Lens('shapley')}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 border-2 ${
                  v3Lens === 'shapley'
                    ? 'border-riso-magenta bg-riso-magenta text-paper'
                    : 'border-current bg-paper dark:bg-zinc-900'
                }`}
              >
                <Network size={13} />
                <span>Game-Theoretic Coalition Backbone</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6">
              <h4 className="font-display text-2xl sm:text-3xl mb-2">
                Optimal communication on top of brain networks.
              </h4>
              <p className="text-sm sm:text-base opacity-85 leading-relaxed mb-4">
                Is the human brain wired to optimise communication efficiency? To even test that, we first needed to know
                what optimal communication on top of the connectome looks like. Instead of assuming signals magically know
                the single shortest path, our game-theoretic framework treats cortical regions as players forming routing
                coalitions—revealing how real brains trade pure efficiency for computational reliability.
              </p>
              <div className="p-3.5 kf-paper-slip text-xs">
                {v3Lens === 'shortest'
                  ? 'Shortest-Path Assumption: Credits 100% of routing to a single direct wire, ignoring the parallel coalition of bridges that keep the brain resilient.'
                  : 'Shapley Communication Backbone: Weighs every multi-path coalition across the connectome (φ = 46%, 21%, 21%, 12%).'}
              </div>
            </div>

            <div className="lg:col-span-6 border-2 border-current p-4 bg-paper-cream/30 dark:bg-zinc-900">
              <svg viewBox="0 0 320 135" className="w-full h-36">
                <line
                  x1="45"
                  y1="68"
                  x2="155"
                  y2="28"
                  stroke="#F53A61"
                  strokeWidth={v3Lens === 'shortest' ? '4' : '3.5'}
                />
                <line
                  x1="155"
                  y1="28"
                  x2="275"
                  y2="68"
                  stroke="#F53A61"
                  strokeWidth={v3Lens === 'shortest' ? '4' : '3.5'}
                />

                <line
                  x1="45"
                  y1="68"
                  x2="115"
                  y2="72"
                  stroke={v3Lens === 'shapley' ? '#0078BF' : 'currentColor'}
                  strokeOpacity={v3Lens === 'shapley' ? '1' : '0.25'}
                  strokeWidth={v3Lens === 'shapley' ? '3' : '1.5'}
                />
                <line
                  x1="115"
                  y1="72"
                  x2="205"
                  y2="72"
                  stroke={v3Lens === 'shapley' ? '#0078BF' : 'currentColor'}
                  strokeOpacity={v3Lens === 'shapley' ? '1' : '0.25'}
                  strokeWidth={v3Lens === 'shapley' ? '3' : '1.5'}
                />
                <line
                  x1="205"
                  y1="72"
                  x2="275"
                  y2="68"
                  stroke={v3Lens === 'shapley' ? '#0078BF' : 'currentColor'}
                  strokeOpacity={v3Lens === 'shapley' ? '1' : '0.25'}
                  strokeWidth={v3Lens === 'shapley' ? '3' : '1.5'}
                />
                <line
                  x1="155"
                  y1="28"
                  x2="115"
                  y2="72"
                  stroke={v3Lens === 'shapley' ? '#FFB511' : 'currentColor'}
                  strokeOpacity={v3Lens === 'shapley' ? '1' : '0.2'}
                  strokeWidth={v3Lens === 'shapley' ? '2.5' : '1'}
                />
                <line
                  x1="155"
                  y1="28"
                  x2="205"
                  y2="72"
                  stroke={v3Lens === 'shapley' ? '#FFB511' : 'currentColor'}
                  strokeOpacity={v3Lens === 'shapley' ? '1' : '0.2'}
                  strokeWidth={v3Lens === 'shapley' ? '2.5' : '1'}
                />
                <line
                  x1="45"
                  y1="68"
                  x2="155"
                  y2="112"
                  stroke={v3Lens === 'shapley' ? '#FFB511' : 'currentColor'}
                  strokeOpacity={v3Lens === 'shapley' ? '0.9' : '0.2'}
                  strokeWidth={v3Lens === 'shapley' ? '2.2' : '1'}
                />
                <line
                  x1="155"
                  y1="112"
                  x2="275"
                  y2="68"
                  stroke={v3Lens === 'shapley' ? '#FFB511' : 'currentColor'}
                  strokeOpacity={v3Lens === 'shapley' ? '0.9' : '0.2'}
                  strokeWidth={v3Lens === 'shapley' ? '2.2' : '1'}
                />

                <circle cx="42" cy="68" r="17" fill="var(--color-paper)" stroke="currentColor" strokeWidth="2" />
                <text x="42" y="71" textAnchor="middle" className="text-[9px] font-bold" fill="currentColor">SRC</text>

                <circle cx="155" cy="28" r="17" fill="#F53A61" stroke="currentColor" strokeWidth="2" />
                <text x="155" y="31" textAnchor="middle" className="text-[9px] font-bold" fill="#FBF9F3">
                  {v3Lens === 'shortest' ? '100%' : 'φ=46%'}
                </text>

                <circle
                  cx="115"
                  cy="72"
                  r="14"
                  fill={v3Lens === 'shapley' ? '#0078BF' : 'var(--color-paper)'}
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <text
                  x="115"
                  y="75"
                  textAnchor="middle"
                  className="text-[8px] font-bold"
                  fill={v3Lens === 'shapley' ? '#FBF9F3' : 'currentColor'}
                >
                  {v3Lens === 'shortest' ? '0%' : 'φ=21%'}
                </text>

                <circle
                  cx="205"
                  cy="72"
                  r="14"
                  fill={v3Lens === 'shapley' ? '#0078BF' : 'var(--color-paper)'}
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <text
                  x="205"
                  y="75"
                  textAnchor="middle"
                  className="text-[8px] font-bold"
                  fill={v3Lens === 'shapley' ? '#FBF9F3' : 'currentColor'}
                >
                  {v3Lens === 'shortest' ? '0%' : 'φ=21%'}
                </text>

                <circle
                  cx="155"
                  cy="112"
                  r="13"
                  fill={v3Lens === 'shapley' ? '#FFB511' : 'var(--color-paper)'}
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <text x="155" y="115" textAnchor="middle" className="text-[8px] font-bold" fill="#18181A">
                  {v3Lens === 'shortest' ? '0%' : 'φ=12%'}
                </text>

                <circle cx="278" cy="68" r="17" fill="var(--color-paper)" stroke="currentColor" strokeWidth="2" />
                <text x="278" y="71" textAnchor="middle" className="text-[9px] font-bold" fill="currentColor">TGT</text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / References & Links */}
      <footer className="mt-16 pt-8 border-t-2 border-current flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="font-bold uppercase tracking-wider">
            <span className="text-riso-magenta">▦</span> The Crown Jewel of Cooperative Game Theory
          </div>
          <div className="opacity-75">
            Human creativity × AI execution · Kayson Fakhar
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://github.com/kuffmode/msa"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border-2 border-current hover:bg-riso-magenta hover:text-paper hover:border-riso-magenta transition-colors font-bold lowercase"
          >
            <span>explore msapy</span>
            <ExternalLink size={13} />
          </a>
          <a
            href="https://kaysonfakhar.com"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border-2 border-current hover:bg-ink hover:text-paper transition-colors font-bold lowercase"
          >
            <span>back to kaysonfakhar.com</span>
          </a>
        </div>
      </footer>
    </section>
  );
}
