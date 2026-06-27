import type { SectionGateDefinition } from './types'

/**
 * The Math Section Gate — covers Lesson 5 (Outs & Equity), Lesson 6 (Pot Odds),
 * Lesson 7 (Fold Equity & Bluffing) and Lesson 8 (Bet Sizing & Value Betting), 2 fresh
 * questions each (8 total). Every board is BRAND-NEW (no lesson / skill-check reuse).
 * No hints; pass at ~70% (6 of 8). Outs / pot-odds / decisions inside `outs-odds` are
 * computed by the evaluator from the spot, so the authored answers are cross-checks.
 *
 *  L5: (q1) count open-ended straight outs (the skill check counted flush/gutshot/combo),
 *      (q2) flush-draw equity on the FLOP (the skill check did flush equity on the turn).
 *  L6: (q3) price a call from fresh pot/bet numbers, (q4) outs → price → a FOLD when the
 *      price is too high (the skill check's combined spot was a call).
 *  L7: (q5) semibluff a fresh flush draw, (q6) where fold equity comes from (a concept
 *      comparison rather than another bet spot).
 *  L8: (q7) value-bet top pair top kicker, (q8) size a SMALL value bet on a dry board
 *      (the skill check sized half-pot and a big wet-board bet).
 * Keep `sectionId: 'math'`.
 */
export const gateMath: SectionGateDefinition = {
  sectionId: 'math',
  title: 'The Math Gate',
  questions: [
    {
      id: 'm-q1',
      lessonId: '5',
      prompt:
        'You hold 10-9 on a 8-7-2 flop: 10-9 with 8-7 is an open-ended straight draw (a Jack or a 6 completes it). How many outs do you have?',
      interaction: 'outs-odds',
      config: {
        hole: ['10S', '9S'],
        board: ['8H', '7D', '2C'],
        drawLabel: 'an open-ended straight',
        street: 'flop',
        ask: ['outs'],
      },
      answer: { outs: 8 },
      incorrectFeedback:
        'Either end fills the straight: four Jacks (J-10-9-8-7) plus four Sixes (10-9-8-7-6) = 8 outs.',
    },
    {
      id: 'm-q2',
      lessonId: '5',
      prompt:
        'You hold two clubs and the flop brings two more — a flush draw with two cards still to come. Estimate your equity by the river (Rule of 2 & 4, whole percent).',
      interaction: 'outs-odds',
      config: {
        hole: ['KC', 'QC'],
        board: ['9C', '4C', '2D'],
        drawLabel: 'a flush',
        street: 'flop',
        ask: ['equity'],
      },
      answer: { equityPercent: 35, equityTolerance: 3 },
      incorrectFeedback:
        'A flush draw is 9 outs. On the flop use the Rule of 4: 9 × 4 = 36% (exact ≈ 35%).',
    },
    {
      id: 'm-q3',
      lessonId: '6',
      prompt:
        'Turn. The pot is \\$80 and it costs \\$40 to call. What is the minimum equity you need to call profitably? (whole percent)',
      interaction: 'outs-odds',
      config: {
        hole: ['AH', 'KD'],
        board: ['QC', '7S', '2H', '5D'],
        drawLabel: 'two overcards',
        street: 'turn',
        ask: ['potOdds'],
        pot: 80,
        betToCall: 40,
        allowFractionAnswer: true,
      },
      answer: { potOddsPercent: 33 },
      incorrectFeedback:
        'Required equity = call / (pot + call) = 40 / (80 + 40) = 40/120 ≈ 33%.',
    },
    {
      id: 'm-q4',
      lessonId: '6',
      prompt:
        'Turn, flush draw. The pot is \\$90 and it costs \\$45 to call. Count your outs, then decide: call or fold?',
      interaction: 'outs-odds',
      config: {
        hole: ['JH', '9H'],
        board: ['AH', '6H', '3C', 'KS'],
        drawLabel: 'a flush',
        street: 'turn',
        ask: ['outs', 'decision'],
        pot: 90,
        betToCall: 45,
      },
      answer: { outs: 9, decision: 'fold' },
      incorrectFeedback:
        '9 outs on the turn ≈ 18% equity. The price is 45 / 135 ≈ 33%. Since 18% < 33%, fold.',
    },
    {
      id: 'm-q5',
      lessonId: '7',
      prompt:
        'You hold the Q and J of clubs on a 10♣ 4♣ 2♦ flop: a flush draw with two overcards, no made hand yet. No one has bet. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['QC', 'JC'],
        board: ['10C', '4C', '2D'],
        street: 'flop',
        pot: 70,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.5, 0.75, 1],
        seed: 705,
        task: 'choose-action',
        helperText: 'No bet faces you, so your choices are check or bet.',
      },
      answer: { action: 'bet' },
      incorrectFeedback:
        'Betting a strong draw is a semibluff: you can win the pot now, and you still have your flush outs when called. Bet.',
    },
    {
      id: 'm-q6',
      lessonId: '7',
      prompt: 'A bluff only profits when your opponent folds. Against which opponent is a bluff more likely to work?',
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Where is there more fold equity?',
        helperText: 'Fold equity is the chance your opponent folds to your bet.',
        eventA: {
          label: 'A cautious player',
          detail: 'Folds often when they miss the board',
        },
        eventB: {
          label: 'A calling station',
          detail: 'Calls down with any piece of the board',
        },
      },
      answer: { more: 'a' },
      incorrectFeedback:
        'A bluff needs fold equity. The cautious player folds often, so a bluff works far more often against them than against a calling station who never folds.',
    },
    {
      id: 'm-q7',
      lessonId: '8',
      prompt:
        'You hold A-Q on a Q-8-3 flop — **top pair, top kicker**. Many worse hands (a weaker Queen, draws, smaller pairs) would call. No one has bet. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['AH', 'QS'],
        board: ['QD', '8C', '3H'],
        street: 'flop',
        pot: 60,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.5, 0.75, 1],
        seed: 808,
        task: 'choose-action',
      },
      answer: { action: 'bet' },
      incorrectFeedback:
        'Top pair, top kicker is ahead of many hands that will pay you off. That is value — bet rather than checking it down.',
    },
    {
      id: 'm-q8',
      lessonId: '8',
      prompt:
        'You have top pair on a dry K-7-2 board and want a SMALL value bet that worse hands still call. The pot is 90. Which sizing is about one-third of the pot?',
      interaction: 'betting-round',
      config: {
        hole: ['AD', 'KC'],
        board: ['KS', '7D', '2C'],
        street: 'flop',
        pot: 90,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        seed: 815,
        task: 'choose-size',
      },
      answer: { sizeFraction: 0.33, sizeTolerance: 0.05 },
      incorrectFeedback:
        'On a dry board a small, one-third-pot bet (about 30 into 90) keeps worse hands in while still building the pot. It is the smallest option.',
    },
  ],
}
