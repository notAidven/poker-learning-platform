import type { SectionGateDefinition } from './types'

/**
 * Playing a Hand Section Gate — covers Lesson 3 (Flow of a Hand), Lesson 4 (Betting
 * Basics) and the Preflop lesson, 2 fresh questions each (6 total). Every spot is
 * BRAND-NEW (no lesson / skill-check reuse). No hints; pass at ~70% (5 of 6).
 *
 *  L3: (q1) name your best hand as it climbs flop→turn→river (graded live by the
 *      evaluator), and (q2) who acts first AFTER the flop (a fresh position question —
 *      the skill check asked about pre-flop order).
 *  L4: (q3) value-bet a monster when checked to, and (q4) fold air to a pot-sized bet
 *      (mechanics only, no pot-odds math — that is the Math gate).
 *  preflop: (q5) classify a premium hand (Ace-King suited), and (q6) pick the stronger
 *      of a big pair vs. a big suited ace.
 * Keep `sectionId: 'playing'`.
 */
export const gatePlaying: SectionGateDefinition = {
  sectionId: 'playing',
  title: 'Playing a Hand Gate',
  questions: [
    {
      id: 'p-q1',
      lessonId: '3',
      prompt: 'You hold Q♥ Q♦. Deal each street and name your best hand as it changes.',
      interaction: 'board-dealer',
      config: {
        hole: ['QH', 'QD'],
        board: ['9C', '5H', '2S', 'QS', '5D'],
        streets: ['preflop', 'flop', 'turn', 'river'],
        askBestHandAt: ['flop', 'turn', 'river'],
        annotateStreets: true,
        helperText: 'Deal the flop, turn, and river, naming your best hand at each.',
      },
      answer: {
        minStreetsRevealed: 4,
        bestHandByStreet: { flop: 'pair', turn: 'trips', river: 'full-house' },
      },
      incorrectFeedback:
        'Pair of Queens on the 9-5-2 flop; the turn Queen makes three Queens; the river pairs the board Fives, so QQQ + 55 is a full house.',
    },
    {
      id: 'p-q2',
      lessonId: '3',
      prompt: 'At a full table, AFTER the flop, which player acts first?',
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Post-flop, who acts first?',
        helperText: 'After the flop the button is the best seat — it always acts last.',
        eventA: {
          label: 'First player left of the button',
          detail: 'The earliest remaining seat (e.g. the small blind)',
        },
        eventB: { label: 'The button', detail: 'The dealer seat' },
      },
      answer: { more: 'a' },
      incorrectFeedback:
        'From the flop onward, action begins with the first active player left of the button and the button acts last, so the seat left of the button is first.',
    },
    {
      id: 'p-q3',
      lessonId: '4',
      prompt:
        'You flop **top set** (three Nines) on 9-6-2 and no one has bet. Worse hands can still call. Pick the best action.',
      interaction: 'betting-round',
      config: {
        hole: ['9D', '9C'],
        board: ['9S', '6H', '2C'],
        street: 'flop',
        pot: 60,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.5, 0.75, 1],
        seed: 311,
        task: 'choose-action',
      },
      answer: { action: 'bet' },
      incorrectFeedback:
        'A monster like top set wants chips in the pot. Bet for value — checking lets worse hands see a free card.',
    },
    {
      id: 'p-q4',
      lessonId: '4',
      prompt:
        'You hold 8-3 offsuit (no pair, no draw) on A-Q-7. The Opponent bets a pot-sized 60 into 60. Pick the best action.',
      interaction: 'betting-round',
      config: {
        hole: ['8C', '3H'],
        board: ['AS', 'QD', '7C'],
        street: 'flop',
        pot: 120,
        heroStack: 300,
        villainStack: 300,
        facing: { action: 'bet', amount: 60 },
        sizingOptions: [0.5, 0.75, 1],
        seed: 318,
        task: 'choose-action',
        helperText: 'The Opponent bets 60 into a pot of 60. You can call, raise, or fold.',
      },
      answer: { action: 'fold' },
      incorrectFeedback:
        'With no pair and no draw facing a big bet, there is nothing to continue with. Fold and save your chips.',
    },
    {
      id: 'p-q5',
      lessonId: 'preflop',
      prompt: 'You are dealt the Ace and King of clubs (Ace-King suited). How strong is this starting hand?',
      interaction: 'preflop-hand',
      config: {
        mode: 'classify',
        hand: ['AC', 'KC'],
        options: [
          { id: 'premium', label: 'Premium', sub: 'Raise from any seat' },
          { id: 'playable', label: 'Playable', sub: 'Worth seeing a flop' },
          { id: 'fold', label: 'Fold it', sub: 'Wait for better' },
        ],
      },
      answer: { optionId: 'premium' },
      incorrectFeedback:
        'Ace-King suited is one of the best non-pair starting hands — two big cards that can also make the nut flush. That is premium: raise it.',
    },
    {
      id: 'p-q6',
      lessonId: 'preflop',
      prompt: 'Which starting hand is stronger before the flop?',
      interaction: 'preflop-hand',
      config: {
        mode: 'pick-stronger',
        handA: ['QD', 'QC'],
        handB: ['AH', 'JH'],
        labelA: 'Pocket Queens',
        labelB: 'Ace-Jack suited',
        helperText: 'A made pair vs. two high cards that still need to connect.',
      },
      answer: { stronger: 'a' },
      incorrectFeedback:
        'Pocket Queens is already a strong pair; Ace-Jack suited still has to pair up or make a flush. Queens are the stronger starting hand.',
    },
  ],
}
