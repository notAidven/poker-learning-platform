import type { LessonDefinition } from '../../types/lesson'

/**
 * Lesson "Tournaments & ICM" (Section 4 · Advanced Play), the fifth and last Advanced
 * lesson, placed right before the Casino Floor. It introduces tournament thinking:
 *   1. ICM (Independent Chip Model): you play for chips but cash out by finishing place,
 *      so chips you can WIN are worth less than chips you can LOSE. Near pay jumps,
 *      survival matters and you tighten up.
 *   2. Push/fold: at short stacks (~10bb or less) you jam all-in or fold. Late position
 *      shoves wide; ICM pressure tightens the range.
 *
 * Reuses the new `range-grid` widget (short-stack shove ranges) plus `compare-events`
 * for the ICM reasoning, and two concept steps. 6 problems / 8 steps = 75% interactive;
 * concepts never run back-to-back. ASCII only. Keep `id: 'adv-icm'`.
 */

/** A wide late-position short-stack jamming range (no ICM pressure, ~10bb). */
const SHOVE_WIDE = [
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
  'KQo', 'KJo', 'KTo', 'K9o', 'K8o',
  'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'QJo', 'QTo',
  'JTs', 'J9s', 'J8s', 'JTo', 'T9s', 'T8s', '98s', '97s', '87s', '76s', '65s', '54s',
]

/** A tight bubble shoving range (high ICM pressure trims it to premiums only). */
const BUBBLE_TIGHT = ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo']

export const advIcm: LessonDefinition = {
  id: 'adv-icm',
  title: 'Tournaments & ICM',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Chips are not cash',
      content: `In a tournament you play for **chips**, but you are paid in **cash** based on the place you finish. That changes everything.

The chips you can **win** are worth a little **less** than the chips you can **lose**, because busting out drops you to zero. This idea is the **Independent Chip Model (ICM)**.

The practical effect: as you near a **pay jump** (like the money bubble), simply **surviving** has real value, so you avoid marginal all-ins that risk your tournament life.

A cash game is different: there, a chip is always worth its face value, so ICM does not apply.`,
    },
    {
      type: 'problem',
      id: 'p1',
      prompt: 'In a tournament, is doubling your chip stack the same as doubling your real money equity?',
      interaction: 'compare-events',
      concepts: ['icm'],
      config: {
        chooseLabel: 'Which statement is true?',
        helperText: 'Remember how tournament payouts work: you cash by finishing place, not by chip count.',
        eventA: {
          label: 'No, it is worth less',
          detail: 'Doubling your chips raises your money equity by less than double (ICM).',
        },
        eventB: {
          label: 'Yes, exactly double',
          detail: 'It would be double only in a cash game, where chips equal cash.',
        },
      },
      answer: { more: 'a' },
      feedback: {
        correct: 'Right. Under ICM, doubling your chips is worth LESS than doubling your money.',
        incorrect:
          'Tournament chips do not equal cash. Doubling your stack raises your money equity by less than double, because busting means zero. That is ICM.',
        hints: [
          'You are paid by finishing place, not by chip count.',
          'The chips you can lose (going to zero) cost you more than new chips gain you.',
          'This is only true in tournaments, not cash games.',
        ],
        why: 'Under the **Independent Chip Model**, the chips you can **lose** are worth more than the chips you can **win**, because busting out pays nothing. So doubling your stack increases your real-money equity by **less** than double. This is why tournament play is more cautious than a cash game.',
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt:
        'You have about 10 big blinds and it folds to you on the button. Is A-7 offsuit a profitable all-in shove here?',
      interaction: 'range-grid',
      concepts: ['push-fold'],
      config: {
        mode: 'is-hand-in-range',
        rangeName: 'a 10bb button jam',
        range: SHOVE_WIDE,
        hand: 'A7o',
        helperText: 'Short-stacked in late position with few players behind, you can shove a wide range.',
      },
      answer: { inRange: true },
      feedback: {
        correct: 'Right. At 10bb on the button, any Ace is a fine shove, so A-7 offsuit is in.',
        incorrect:
          'Short-stacked on the button, you jam a wide range. A-7 offsuit is comfortably **in** a 10bb button shoving range.',
        hints: [
          'You are short and in the best seat with few players left to act.',
          'An Ace blocks the strongest calling hands and has decent equity when called.',
          'Wide shoving range means hands like A-7 offsuit get to jam.',
        ],
        why: 'At about **10 big blinds** on the **button**, with only the blinds behind, shoving any Ace is standard: you have fold equity plus a card that blocks big Aces, and reasonable equity when called. So A-7 offsuit is a clear jam.',
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Push or fold',
      content: `Stack depth is counted in big blinds: a 10 big blind stack just means you have ten times the big blind in front of you. When your stack is short, about **10 big blinds** or less, a small raise commits most of your chips anyway. So short stacks play **push or fold**: move **all-in** or **fold**, with nothing in between.

Going all-in stacks two edges: your **fold equity** (they may fold now) on top of your hand's equity when called.

- In **late position** with few players left to act, you shove a **wide** range.
- **ICM pressure** (a pay jump) **tightens** it: near the money you shove fewer hands, because busting is so costly.

Pick your spot by stack size, position, and ICM, not by hoping to outplay anyone after the flop.`,
    },
    {
      type: 'problem',
      id: 'p3',
      prompt:
        'It is the money bubble, so ICM pressure is high. Build a TIGHT bubble shoving range by tapping exactly: AA, KK, QQ, JJ, AKs, AKo.',
      interaction: 'range-grid',
      concepts: ['push-fold', 'icm'],
      config: {
        mode: 'build-range',
        rangeName: 'a tight bubble jam',
        range: BUBBLE_TIGHT,
        helperText: 'High ICM pressure means you shove only premium hands. Tap the six listed.',
      },
      answer: { hands: BUBBLE_TIGHT },
      feedback: {
        correct: 'Nice. On a tense bubble you jam only the premiums, because busting is so costly.',
        incorrect: 'Tap exactly the six premiums: AA, KK, QQ, JJ, AKs, and AKo.',
        hints: [
          'The four pairs (AA, KK, QQ, JJ) are on the diagonal.',
          'AKs is just above the diagonal; AKo just below it.',
          'High ICM pressure means premiums only, not a wide range.',
        ],
        why: 'On the **bubble**, busting out is the worst result, so **ICM** says tighten up. A premium-only jam (the big pairs plus A-K) keeps you shoving the hands with the most equity while avoiding the marginal spots that risk your tournament life.',
      },
    },
    {
      type: 'problem',
      id: 'p4',
      prompt:
        'Different tournament, no pay jump near. You have about 8 big blinds and it folds to you on the button. Is K-9 suited a shove?',
      interaction: 'range-grid',
      concepts: ['push-fold'],
      config: {
        mode: 'is-hand-in-range',
        rangeName: 'an 8bb button jam',
        range: SHOVE_WIDE,
        hand: 'K9s',
        helperText: 'With no ICM pressure and a short stack in late position, jam wide.',
      },
      answer: { inRange: true },
      feedback: {
        correct: 'Right. With no ICM pressure and 8bb on the button, K-9 suited is an easy jam.',
        incorrect:
          'Short-stacked on the button with no pay jump near, you shove a wide range. K-9 suited is clearly **in**.',
        hints: [
          'There is no bubble pressure here, so you can shove wide.',
          'K-9 suited has decent equity and can make flushes and straights.',
          'Late position plus a short stack equals a wide jam.',
        ],
        why: 'Without **ICM** pressure, a short stack in late position jams a **wide** range to pick up the blinds. K-9 suited has enough equity and fold equity to be a routine shove at 8 big blinds on the button.',
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt: 'On the money bubble, an opponent shoves all-in. Should you CALL wider or tighter than you normally would?',
      interaction: 'compare-events',
      concepts: ['icm'],
      config: {
        chooseLabel: 'Call wider or tighter on the bubble?',
        helperText: 'Think about what busting out costs you near a pay jump.',
        eventA: {
          label: 'Tighter',
          detail: 'Busting on the bubble is very costly, so you need a stronger hand to call.',
        },
        eventB: {
          label: 'Wider',
          detail: 'This would risk your tournament life for marginal spots.',
        },
      },
      answer: { more: 'a' },
      feedback: {
        correct: 'Right. ICM pressure on the bubble means you call all-ins TIGHTER than normal.',
        incorrect:
          'Busting on the bubble is the worst outcome, so ICM says call all-ins with a TIGHTER, stronger range than usual.',
        hints: [
          'What does busting out right before the money cost you?',
          'ICM makes the chips you could lose worth more than the chips you could win.',
          'Does that push you toward stronger or weaker calling hands?',
        ],
        why: 'Near a **pay jump**, **ICM** makes the chips you could lose worth more than those you could win, so calling an all-in and busting is especially bad. You therefore **tighten** your calling range and only stack off with strong hands.',
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt: 'You are down to about 8 big blinds. Which playing style fits a stack this short?',
      interaction: 'compare-events',
      concepts: ['push-fold'],
      config: {
        chooseLabel: 'Which style fits 8 big blinds?',
        helperText: 'Think about how much a small raise would commit of an 8bb stack.',
        eventA: {
          label: 'Push or fold',
          detail: 'Jam all-in or fold. A small raise would commit you anyway.',
        },
        eventB: {
          label: 'Min-raise and play postflop',
          detail: 'Leaves you pot-committed with an awkward stack behind.',
        },
      },
      answer: { more: 'a' },
      feedback: {
        correct: 'Right. At 8 big blinds you play push or fold: jam or muck, no small raises.',
        incorrect:
          'With only 8 big blinds, a small raise commits most of your stack anyway. The clean approach is push or fold: jam all-in or fold.',
        hints: [
          'How much of an 8bb stack does a normal raise use up?',
          'Playing a small pot postflop is hard with almost nothing behind.',
          'Short stacks keep it simple: all-in or fold.',
        ],
        why: 'At about **8 big blinds**, a standard raise already commits most of your chips, so playing a small pot postflop makes no sense. **Push or fold** captures the **fold equity** of an all-in and avoids tricky short-stack postflop spots.',
      },
    },
  ],
}
