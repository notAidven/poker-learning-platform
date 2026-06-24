import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check 6 (design doc §6, Lesson 6). Three quick questions that reuse light
 * interactions (`compare-events` / `hand-ranker`) rather than the full simulator, so
 * they fit the 3-question format: (1) stronger starting hand, (2) the better action at
 * a street, (3) award the pot at showdown. Keep `lessonId: '6'` / export `skillCheck6`.
 */
export const skillCheck6: SkillCheckDefinition = {
  lessonId: '6',
  title: 'Play a Full Hand Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'You can choose your starting hand. Which one is stronger?',
      interaction: 'compare-events',
      config: {
        helperText: 'Two sets of hole cards. Premium hands are worth playing aggressively; weak ones get folded.',
        chooseLabel: 'Which starting hand is stronger?',
        eventA: {
          label: 'A♣ A♦',
          detail: 'Pocket Aces — the best starting hand in Hold’em.',
        },
        eventB: {
          label: 'Q♥ 9♠',
          detail: 'Queen-nine offsuit — unconnected, different suits, easily dominated.',
        },
      },
      answer: { more: 'a' },
      incorrectFeedback:
        'Pocket Aces (A♣A♦) is the strongest starting hand; Q♥9♠ is a weak, easily dominated offsuit hand.',
    },
    {
      id: 'q2',
      prompt:
        'You hold K♠ Q♦ and the flop is K♥ 8♣ 3♠, giving you top pair. A passive opponent checks to you. What’s the better play?',
      interaction: 'compare-events',
      config: {
        helperText: 'You likely have the best hand against a player who checks and rarely folds.',
        chooseLabel: 'What should you do with top pair?',
        eventA: {
          label: 'Bet for value',
          detail: 'Put chips in while you’re ahead, so a worse hand can pay you off.',
        },
        eventB: {
          label: 'Check it back',
          detail: 'Pass and take a free card, winning nothing extra with the best hand.',
        },
      },
      answer: { more: 'a' },
      incorrectFeedback:
        'Bet for value. Most of a beginner’s profit comes from value-betting strong hands — checking the best hand just lets worse hands off the hook.',
    },
    {
      id: 'q3',
      prompt: 'Two players reach showdown. Order the hands from strongest to weakest to award the pot.',
      interaction: 'hand-ranker',
      config: {
        mode: 'order-hands',
        hands: [
          { id: 'boat', cards: ['KC', 'KD', 'KH', '4S', '4D'] },
          { id: 'flush', cards: ['AH', 'QH', '9H', '6H', '3H'] },
        ],
      },
      answer: { handOrder: ['boat', 'flush'] },
      incorrectFeedback: 'A full house outranks a flush, so Kings full of Fours wins the pot over the Ace-high flush.',
    },
  ],
}
