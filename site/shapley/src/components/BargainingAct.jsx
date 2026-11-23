import React, { useState } from 'react';
import { Lock, CheckCircle2, XCircle, Sparkles, ArrowDown } from 'lucide-react';

const PRICE_CHIPS = [
  {
    amount: 20,
    tag: 'The “Communist” 1/3 Split',
    shortDesc: '“Hey, let’s just divide $60 by three and call it a night!”',
    splits: { you: 20, alex: 26, sam: 14 },
    status: 'rejected',
    rejectedBy: ['Alex', 'Sam'],
    headline: 'Alex and Sam immediately call your bluff.',
    visualRule: 'Walk-out threat: Alex & Sam’s food together only costs $30',
    violationMath: {
      label: 'What Alex + Sam would pay under your offer vs. getting their own table',
      offeredPairCost: 40,
      maxFairPairCost: 30,
      diff: '+$10 overcharged',
    },
    reactions: {
      you: '“Look, $20 each is super simple, no math required…”',
      alex: '“Bruh, you ordered a Wagyu steak and a carafe of wine! If you pay $20, Sam and I cover $40—when our food together would’ve only cost $30 without you.”',
      sam: '“I had a $12 salad. Why the hell would I pay $14 just to sponsor your meat sweats?”',
    },
  },
  {
    amount: 28,
    tag: 'The “Almost Half” Offer',
    shortDesc: '“Alright, chill, I’ll cover nearly half the entire bill.”',
    splits: { you: 28, alex: 21, sam: 11 },
    status: 'rejected',
    rejectedBy: ['Alex', 'Sam'],
    headline: 'Still doesn’t survive the {Alex + Sam} walk-out check.',
    visualRule: 'Walk-out threat: Alex + Sam together ≤ $30',
    violationMath: {
      label: 'What Alex + Sam still end up paying if you put in $28',
      offeredPairCost: 32,
      maxFairPairCost: 30,
      diff: '+$2 overcharged',
    },
    reactions: {
      you: '“Come on, $28 is nearly half the table’s check!”',
      alex: '“Still doesn’t add up. If you pay $28, the two of us owe $32 combined. Again, eating without you costs us $30.”',
      sam: '“Put it another way: without you, our table is $30. With you, it’s $60. You added at least $30 to this bill!”',
    },
  },
  {
    amount: 32,
    tag: 'The “Marginal Minimum”',
    shortDesc: '“Fine, $32—that leaves $28 for you two, beating your $30.”',
    splits: { you: 32, alex: 19, sam: 9 },
    status: 'rejected',
    rejectedBy: ['Alex'],
    headline: 'Sam is tempted, but Alex spots the lopsided discount.',
    visualRule: 'Combo synergy imbalance: You & Alex shared the biggest deal (-$12)',
    violationMath: {
      label: 'You’re pocketing $10 of the $18 table discount for yourself',
      offeredPairCost: 51,
      maxFairPairCost: 54,
      diff: 'You take 56% of the group savings',
    },
    reactions: {
      you: '“At $32 you two pay $28 together—that’s cheaper than eating without me!”',
      alex: '“Hold on. Your feast costs $42 solo. At $32 you’re taking a $10 discount, leaving only $8 of savings for Sam and me combined—even though the biggest discount ($12) came from you and me splitting the wine carafe!”',
      sam: '“Alex has a point. Why do you get treated like you arrived last and claimed most of the combo deals?”',
    },
  },
  {
    amount: 42,
    tag: 'The Martyr ($42 Solo)',
    shortDesc: '“Whatever! I’ll just pay what my feast costs on its own.”',
    splits: { you: 42, alex: 12, sam: 6 },
    status: 'rejected-self',
    rejectedBy: ['You'],
    headline: 'They’d love that—but now YOU are getting ripped off.',
    visualRule: 'Self-check: You deserve a fair share of the $18 group savings too',
    violationMath: {
      label: 'Your share of the $18 group discount if you pay $42',
      offeredPairCost: 42,
      maxFairPairCost: 35,
      diff: 'You get $0 of the $18 discount!',
    },
    reactions: {
      you: '“Wait a second. Why am I paying full solo price ($42) and gifting 100% of our $18 group combo discount to you two?!”',
      alex: '“Hey, I wasn’t going to stop you, but yeah—the wine carafe deal only happened because both of us ordered wine.”',
      sam: '“Okay, so $32 is too stingy and $42 is martyrdom. The fair number is trapped right in between.”',
    },
  },
  {
    amount: 35,
    tag: 'The Shapley Equilibrium',
    shortDesc: '“$35 from me, $17 from Alex, $8 from Sam.”',
    splits: { you: 35, alex: 17, sam: 8 },
    status: 'accepted',
    rejectedBy: [],
    headline: 'Equilibrium. Nobody has a better option alone or in a pair.',
    visualRule: 'Every solo & pairwise constraint satisfied ($35 + $17 + $8 = $60)',
    violationMath: {
      label: 'What Alex + Sam pay ($25 vs $30), You + Sam ($43 vs $48), You + Alex ($52 vs $54)',
      offeredPairCost: 25,
      maxFairPairCost: 30,
      diff: 'Everyone wins equally at the margin',
    },
    reactions: {
      you: '“I pay $35—saving $7 off my $42 solo feast.”',
      alex: '“I pay $17—also saving $7 off my $24 solo meal, since you and I generated the biggest combo discount together.”',
      sam: '“And I pay $8—saving $4 off my $12 salad. Nobody is subsidising anyone, and no pair can do better by walking out. Tada!”',
    },
  },
];

const REQUIRED_ATTEMPTS_TO_UNLOCK = 3;

export default function BargainingAct({ onSolved, isSolved }) {
  const [testedAmounts, setTestedAmounts] = useState([]);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [lockedNotice, setLockedNotice] = useState(false);

  const nonWinningAttempts = testedAmounts.filter((a) => a !== 35).length;
  const isWinningUnlocked = nonWinningAttempts >= REQUIRED_ATTEMPTS_TO_UNLOCK || isSolved;

  const currentChip = PRICE_CHIPS.find((c) => c.amount === selectedAmount) || null;

  const handleSelectChip = (chip) => {
    if (chip.amount === 35 && !isWinningUnlocked) {
      setLockedNotice(true);
      return;
    }
    setLockedNotice(false);
    setSelectedAmount(chip.amount);
    if (!testedAmounts.includes(chip.amount)) {
      setTestedAmounts((prev) => [...prev, chip.amount]);
    }
    if (chip.amount === 35) {
      onSolved();
    }
  };

  return (
    <section id="act-1" className="relative pt-28 pb-16 px-4 sm:px-8 max-w-5xl mx-auto">
      {/* Act Header */}
      <div className="mb-8">
        <p className="kf-kicker mb-2">
          <span className="text-riso-magenta">▦</span> Act I · A little dinner-table game theory
        </p>
        <h1 className="font-display text-4xl sm:text-6xl leading-[1.03] tracking-tight mb-5 riso-misreg-title">
          The total bill is $60. Who should pay how much?
        </h1>
        <p className="text-lg sm:text-xl opacity-85 max-w-3xl leading-relaxed">
          Alright, let’s start with a familiar headache. You, <strong className="text-riso-cyan">Alex</strong>, and{' '}
          <strong className="text-riso-yellow">Sam</strong> just had dinner together. The total bill comes back at{' '}
          <strong>$60</strong>—thanks to a few shared table combos and a carafe deal—without an itemised breakdown. You
          had the big feast, Alex had a medium meal, and Sam barely ate. Naturally, you’re trying not to pay extra if
          you can avoid it.
        </p>
      </div>

      {/* Single Clean Dinner Table Card (No Receipt) */}
      <div className="riso-card p-5 sm:p-7 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-current/20 pb-4 mb-5">
          <div>
            <span className="kf-kicker block">
              <span className="text-riso-magenta">▦</span> What everyone ate
            </span>
            <p className="text-sm opacity-80 m-0 mt-0.5">
              Ordered separately, the three meals would’ve cost <strong>$78</strong> ($42 + $24 + $12), but sharing table
              combos brought the total bill down to <strong>$60</strong>.
            </p>
          </div>
          <div className="kf-paper-slip px-4 py-2 shrink-0 flex items-baseline gap-3 self-start sm:self-auto">
            <span className="text-xs font-bold uppercase tracking-wider opacity-75">Total Bill</span>
            <span className="font-display text-3xl text-riso-magenta riso-misreg-title">$60</span>
          </div>
        </div>

        {/* 3 Diners Side-by-Side */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* YOU */}
          <div className="border-2 border-current p-4 relative bg-riso-magenta/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase px-2 py-0.5 bg-riso-magenta text-paper">
                You
              </span>
              <span className="text-xs font-bold">~$42 alone</span>
            </div>
            <svg viewBox="0 0 120 76" className="w-full h-20 my-1" style={{ filter: 'url(#kf-riso-stamp-rough)' }}>
              <circle cx="54" cy="42" r="29" fill="none" stroke="#0078BF" strokeWidth="2" strokeOpacity="0.45" />
              <circle cx="52" cy="40" r="30" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <circle cx="52" cy="40" r="23" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
              <path
                d="M38 38 C38 27, 68 26, 70 40 C72 52, 44 56, 38 44 Z"
                fill="#F53A61"
                fillOpacity="0.88"
              />
              <path
                d="M36 36 C36 25, 66 24, 68 38 C70 50, 42 54, 36 42 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <line x1="45" y1="33" x2="58" y2="45" stroke="#FBF9F3" strokeWidth="1.75" />
              <line x1="52" y1="31" x2="62" y2="41" stroke="#FBF9F3" strokeWidth="1.75" />
              <path
                d="M97 18 L105 18 L103 34 C108 40, 109 60, 105 66 L97 66 C93 60, 94 40, 99 34 Z"
                fill="#F53A61"
                fillOpacity="0.75"
              />
              <path
                d="M95 16 L103 16 L101 32 C106 38, 107 58, 103 64 L95 64 C91 58, 92 38, 97 32 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <div className="font-bold text-base mt-1">The Feast</div>
            <div className="text-xs opacity-80 leading-snug">
              Wagyu steak + shared wine carafe &amp; sides. You’d love to pay as little as possible.
            </div>
          </div>

          {/* ALEX */}
          <div className="border-2 border-current p-4 relative bg-riso-cyan/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase px-2 py-0.5 bg-riso-cyan text-paper">
                Alex
              </span>
              <span className="text-xs font-bold">~$24 alone</span>
            </div>
            <svg viewBox="0 0 120 76" className="w-full h-20 my-1" style={{ filter: 'url(#kf-riso-stamp-rough)' }}>
              <circle cx="58" cy="42" r="28" fill="none" stroke="#F53A61" strokeWidth="2" strokeOpacity="0.4" />
              <circle cx="56" cy="40" r="28" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <path
                d="M42 40 C44 29, 68 29, 68 40 C68 49, 46 50, 48 39 C50 33, 62 34, 60 41"
                fill="none"
                stroke="#0078BF"
                strokeWidth="3.8"
                strokeLinecap="round"
              />
              <path d="M96 28 L108 28 L106 42 C105 46, 99 46, 98 42 Z" fill="#0078BF" fillOpacity="0.8" />
              <path d="M94 26 L106 26 L104 40 C103 44, 97 44, 96 40 Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <line x1="100" y1="43" x2="100" y2="58" stroke="currentColor" strokeWidth="2" />
              <line x1="94" y1="58" x2="106" y2="58" stroke="currentColor" strokeWidth="2" />
            </svg>
            <div className="font-bold text-base mt-1">Medium Meal</div>
            <div className="text-xs opacity-80 leading-snug">
              Truffle pasta + split the wine carafe deal with you. Knows what things cost.
            </div>
          </div>

          {/* SAM */}
          <div className="border-2 border-current p-4 relative bg-riso-yellow/15">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase px-2 py-0.5 bg-riso-yellow text-ink">
                Sam
              </span>
              <span className="text-xs font-bold">~$12 alone</span>
            </div>
            <svg viewBox="0 0 120 76" className="w-full h-20 my-1" style={{ filter: 'url(#kf-riso-stamp-rough)' }}>
              <circle cx="62" cy="42" r="25" fill="none" stroke="#0078BF" strokeWidth="1.8" strokeOpacity="0.4" />
              <circle cx="60" cy="40" r="25" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <ellipse cx="55" cy="38" rx="10" ry="6" transform="rotate(-20 55 38)" fill="#FFB511" stroke="currentColor" strokeWidth="1.8" />
              <ellipse cx="66" cy="42" rx="10" ry="6" transform="rotate(25 66 42)" fill="#FFB511" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="59" cy="34" r="3.5" fill="#F53A61" />
            </svg>
            <div className="font-bold text-base mt-1">Light Salad</div>
            <div className="text-xs opacity-80 leading-snug">
              Just a side salad + shared bread. Definitely not paying for your Wagyu.
            </div>
          </div>
        </div>

        {/* Pairwise combo benchmarks strip */}
        <div className="mt-4 pt-3 border-t border-current/20 flex flex-wrap items-center justify-between gap-2 text-xs opacity-85">
          <span className="font-semibold">What any pair would have paid together without the third person:</span>
          <div className="flex flex-wrap gap-3 font-bold">
            <span>Alex + Sam = $30</span>
            <span>·</span>
            <span>You + Sam = $48</span>
            <span>·</span>
            <span>You + Alex = $54</span>
          </div>
        </div>
      </div>

      {/* Discrete Price-Chip Selector */}
      <div className="riso-card p-5 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <p className="kf-kicker mb-1">
              <span className="text-riso-magenta">▦</span> Start the bargaining
            </p>
            <h2 className="font-display text-2xl sm:text-3xl">
              How much of the $60 check do you offer to pay?
            </h2>
          </div>

          <div className="kf-paper-slip text-xs px-3.5 py-2 shrink-0 self-start sm:self-auto">
            {!isWinningUnlocked ? (
              <span>
                Search progress:{' '}
                <strong className="text-riso-magenta">
                  {nonWinningAttempts} / {REQUIRED_ATTEMPTS_TO_UNLOCK}
                </strong>{' '}
                offers tested
              </span>
            ) : (
              <span className="text-riso-cyan font-bold flex items-center gap-1.5">
                <Sparkles size={14} /> Window narrowed ($32–$42)
              </span>
            )}
          </div>
        </div>

        {/* Price Chips Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {PRICE_CHIPS.map((chip, idx) => {
            const isTested = testedAmounts.includes(chip.amount);
            const isSelected = selectedAmount === chip.amount;
            const isLocked = chip.amount === 35 && !isWinningUnlocked;
            const isWinChip = chip.amount === 35;
            const spanClass = idx === 4 ? 'col-span-2 sm:col-span-1' : '';

            return (
              <button
                key={chip.amount}
                onClick={() => handleSelectChip(chip)}
                className={`${spanClass} group relative text-left p-3.5 border-2 transition-all flex flex-col justify-between ${
                  isSelected
                    ? isWinChip
                      ? 'border-riso-cyan bg-riso-cyan text-paper shadow-riso-ink -translate-y-0.5'
                      : 'border-riso-magenta bg-riso-magenta text-paper shadow-riso-ink -translate-y-0.5'
                    : isLocked
                    ? 'border-current/40 bg-current/5 opacity-75 hover:opacity-100 cursor-pointer'
                    : isTested
                    ? 'border-current/50 bg-paper-cream/60 dark:bg-zinc-800/60 hover:border-current'
                    : 'border-current bg-paper dark:bg-zinc-900 hover:-translate-y-0.5 hover:shadow-riso'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-display text-2xl sm:text-3xl">
                    {isLocked ? '$??' : `$${chip.amount}`}
                  </span>
                  {isLocked && <Lock size={16} className="opacity-60" />}
                  {!isLocked && isTested && !isWinChip && (
                    <XCircle size={18} className={isSelected ? 'text-paper' : 'text-riso-magenta'} />
                  )}
                  {!isLocked && isTested && isWinChip && (
                    <CheckCircle2 size={18} className={isSelected ? 'text-paper' : 'text-riso-cyan'} />
                  )}
                </div>

                <div className="text-xs font-bold leading-tight">
                  {isLocked ? 'Locked Equilibrium' : chip.tag}
                </div>
                <div className="text-xs opacity-75 mt-1 leading-snug">
                  {isLocked
                    ? `Try ${REQUIRED_ATTEMPTS_TO_UNLOCK - nonWinningAttempts} more offer${
                        REQUIRED_ATTEMPTS_TO_UNLOCK - nonWinningAttempts === 1 ? '' : 's'
                      } first to narrow the search`
                    : chip.shortDesc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Locked Notice Banner */}
        {lockedNotice && !isWinningUnlocked && (
          <div className="mb-6 p-3.5 border-2 border-riso-yellow bg-riso-yellow/15 text-xs sm:text-sm">
            <strong>Hold on—no lucky guessing yet!</strong> Try at least{' '}
            <strong>{REQUIRED_ATTEMPTS_TO_UNLOCK - nonWinningAttempts} more offer(s)</strong> on the table first so you
            can see <em>why</em> the other splits fall apart.
          </div>
        )}

        {/* Active Bargaining Round Visual Feedback */}
        {currentChip ? (
          <div className="border-2 border-current p-4 sm:p-6 bg-paper-cream/50 dark:bg-zinc-900/80 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-current/20">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-bold uppercase px-2.5 py-0.5 border-2 ${
                      currentChip.status === 'accepted'
                        ? 'border-riso-cyan bg-riso-cyan text-paper'
                        : 'border-riso-magenta text-riso-magenta'
                    }`}
                  >
                    {currentChip.status === 'accepted'
                      ? '✓ Equilibrium Found'
                      : currentChip.status === 'rejected-self'
                      ? '✗ Vetoed by You'
                      : `✗ Vetoed by ${currentChip.rejectedBy.join(' & ')}`}
                  </span>
                  <span className="text-xs font-semibold opacity-75">{currentChip.visualRule}</span>
                </div>
                <h3 className="font-display text-2xl mt-2">{currentChip.headline}</h3>
              </div>
            </div>

            {/* Visual Stacked Bar & Coalition Meter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="flex flex-wrap justify-between items-center gap-2 text-xs font-semibold mb-2">
                  <span>Proposed $60 Split:</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-riso-magenta inline-block" /> You: ${currentChip.splits.you}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-riso-cyan inline-block" /> Alex: ${currentChip.splits.alex}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-riso-yellow inline-block border border-current/40" /> Sam: ${currentChip.splits.sam}
                    </span>
                  </div>
                </div>

                <div className="h-10 w-full border-2 border-current flex overflow-hidden text-xs font-bold">
                  <div
                    style={{ width: `${(currentChip.splits.you / 60) * 100}%` }}
                    className="bg-riso-magenta text-paper flex items-center justify-center transition-all duration-300 truncate px-1"
                  >
                    ${currentChip.splits.you}
                  </div>
                  <div
                    style={{ width: `${(currentChip.splits.alex / 60) * 100}%` }}
                    className="bg-riso-cyan text-paper flex items-center justify-center border-l-2 border-current transition-all duration-300 truncate px-1"
                  >
                    ${currentChip.splits.alex}
                  </div>
                  <div
                    style={{ width: `${(currentChip.splits.sam / 60) * 100}%` }}
                    className="bg-riso-yellow text-ink flex items-center justify-center border-l-2 border-current transition-all duration-300 truncate px-1"
                  >
                    ${currentChip.splits.sam}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mt-2 text-[11px] text-center">
                  <div className="border border-current/30 py-1 px-1">
                    You vs $42:{' '}
                    <strong className="text-riso-magenta">
                      {currentChip.splits.you - 42 === 0 ? '$0' : `-$${42 - currentChip.splits.you}`}
                    </strong>
                  </div>
                  <div className="border border-current/30 py-1 px-1">
                    Alex vs $24:{' '}
                    <strong className="text-riso-cyan">
                      {currentChip.splits.alex > 24
                        ? `+$${currentChip.splits.alex - 24}`
                        : `-$${24 - currentChip.splits.alex}`}
                    </strong>
                  </div>
                  <div className="border border-current/30 py-1 px-1">
                    Sam vs $12:{' '}
                    <strong className="text-riso-yellow">
                      {currentChip.splits.sam > 12
                        ? `+$${currentChip.splits.sam - 12}`
                        : `-$${12 - currentChip.splits.sam}`}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between border border-current/30 p-3.5 bg-paper dark:bg-zinc-900">
                <div className="text-xs font-medium opacity-80">{currentChip.violationMath.label}</div>
                <div className="my-2.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-24 sm:w-28 shrink-0">Under offer:</span>
                    <div className="flex-1 bg-current/10 h-5 relative border border-current/40">
                      <div
                        style={{ width: `${Math.min(100, (currentChip.violationMath.offeredPairCost / 60) * 100)}%` }}
                        className={`h-full transition-all duration-300 ${
                          currentChip.status === 'accepted' ? 'bg-riso-cyan' : 'bg-riso-magenta'
                        }`}
                      />
                    </div>
                    <span className="w-9 text-right font-bold">${currentChip.violationMath.offeredPairCost}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-24 sm:w-28 shrink-0">Fair ceiling:</span>
                    <div className="flex-1 bg-current/10 h-5 relative border border-current/40">
                      <div
                        style={{ width: `${Math.min(100, (currentChip.violationMath.maxFairPairCost / 60) * 100)}%` }}
                        className="h-full bg-current/60 transition-all duration-300"
                      />
                    </div>
                    <span className="w-9 text-right font-bold">${currentChip.violationMath.maxFairPairCost}</span>
                  </div>
                </div>
                <div className="text-xs font-bold text-right text-riso-magenta">
                  {currentChip.violationMath.diff}
                </div>
              </div>
            </div>

            {/* 3 Diner Reactions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 border border-current/40 bg-paper dark:bg-zinc-900">
                <div className="text-xs font-bold text-riso-magenta mb-1">▦ You</div>
                <p className="text-sm m-0 leading-snug">{currentChip.reactions.you}</p>
              </div>
              <div className="p-3.5 border border-current/40 bg-paper dark:bg-zinc-900">
                <div className="text-xs font-bold text-riso-cyan mb-1">▦ Alex</div>
                <p className="text-sm m-0 leading-snug">{currentChip.reactions.alex}</p>
              </div>
              <div className="p-3.5 border border-current/40 bg-paper dark:bg-zinc-900">
                <div className="text-xs font-bold text-riso-yellow mb-1">▦ Sam</div>
                <p className="text-sm m-0 leading-snug">{currentChip.reactions.sam}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-current/40 p-6 sm:p-8 text-center text-sm opacity-80">
            ↑ Pick an offer chip above (try starting with <strong>$20</strong>) to test what you can get away with.
          </div>
        )}

        {/* Transition CTA once solved */}
        {isSolved && (
          <div className="mt-6 p-5 border-2 border-riso-cyan bg-riso-cyan/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-riso-cyan font-bold">
                ▦ Bargaining settled · ($35, $17, $8)
              </div>
              <p className="text-base m-0 mt-1">
                You see, haggling through every possible walk-out threat works, but it’s exhausting. What if we outsource
                the whole argument to an external mathematical authority?
              </p>
            </div>
            <a
              href="#act-2"
              className="shrink-0 inline-flex items-center gap-2 text-sm font-bold px-5 py-3 border-2 border-current bg-riso-magenta text-paper hover:bg-ink transition-colors lowercase"
            >
              <span>scroll to the algorithm</span>
              <ArrowDown size={16} />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
