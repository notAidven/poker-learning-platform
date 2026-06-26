import type { LessonDefinition } from '../../types/lesson'

/**
 * Lesson 7: "Fold Equity & Bluffing" (Section 3 · The Math).
 *
 * The EV of a CALL (and the call/fold decision) now lives entirely in Lesson 6, so
 * this lesson is rewritten to teach the genuinely new idea: **fold equity**. When you
 * BET you can win two ways (everyone folds now, OR you make the best hand later), which
 * is what makes a **semibluff** and a well-chosen **bluff** profitable, and why a bluff
 * fails when the opponent cannot fold. Built entirely on the `betting-round` widget
 * with `choose-action`, so nothing re-drills the Lesson 6 call decision.
 *
 * Every "correct" action is set up to be unambiguous (a strong draw to semibluff, a
 * busted hand vs a folding opponent, a hand with no fold equity). Scripted opponent
 * responses (`villainAction`) make each reveal match the lesson point. Ratio:
 * 4 problems / 6 steps = 67% interactive. Keep `id: '7'` / export `lesson7`.
 */
export const lesson7: LessonDefinition = {
  id: '7',
  title: 'Fold Equity & Bluffing',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Two ways to win',
      content: `In Pot Odds you used **expected value** to price a call. A call can only win one way: at **showdown**, by having the best hand.

When **you** are the one betting, you add a second way to win: everyone **folds**. That extra chance is **fold equity**.

So a bet can win **two ways**: opponents fold now, **or** you go on to make the best hand. That is what makes betting a strong draw, a **semibluff**, so powerful, and it is the whole engine behind bluffing.`,
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p1',
      prompt:
        'You hold the Q and J of diamonds on a 10-8 flop with two diamonds: a **flush draw** plus a straight draw, but no **made hand** yet. No one has bet. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['QD', 'JD'],
        board: ['10D', '8D', '3C'],
        street: 'flop',
        pot: 60,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.5, 0.75, 1],
        seed: 71,
        task: 'choose-action',
        helperText: 'No bet faces you, so your choices are check or bet.',
      },
      answer: { action: 'bet' },
      feedback: {
        correct: 'Yes. **Bet** as a **semibluff**. You can win now if they fold, and you still have your big draw if they call.',
        incorrect:
          'A strong draw with no bet yet is the classic **semibluff**: betting wins two ways (a fold now, or your draw landing later). Bet.',
        hints: [
          'No bet faces you, so your choices are check or bet.',
          'A strong draw can win two ways: opponents folding now, or the draw completing later.',
          'Betting a draw like this is called a semibluff.',
        ],
        why: 'A **semibluff** bet has **fold equity** (opponents may fold now) **plus** the equity of a big flush-and-straight draw if called: two ways to win. That combination makes betting the draw profitable, where betting pure air would not.',
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Bluffs need fold equity',
      content: `A **bluff** bets a weak hand to push a **better** hand into folding. It only works when your opponent *can* fold.

Two sides of the same coin:

- A missed draw on the river can become a profitable **bluff** when your opponent will often fold. Betting is then the only way that hand can win.
- Against an opponent who **never folds**, there is no **fold equity**, so betting a weak hand just burns chips. Check instead and try to win at showdown.`,
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p2',
      prompt:
        'River. Your flush draw missed, so you have Jack-high and cannot win at showdown. This opponent has shown weakness and will usually fold to a bet. There is no bet yet. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['JS', '10S'],
        board: ['AD', 'KH', '7C', '4D', '2C'],
        street: 'river',
        pot: 80,
        heroStack: 300,
        villainStack: 300,
        sizingOptions: [0.5, 0.75, 1],
        villainAction: 'fold',
        seed: 72,
        task: 'choose-action',
        helperText: 'No bet faces you, so your choices are check or bet.',
      },
      answer: { action: 'bet' },
      feedback: {
        correct: 'Right. **Bet** as a **bluff**. Jack-high cannot win at showdown, so a fold is the only way this hand wins, and the **fold equity** is there.',
        incorrect:
          'Checking gives up: Jack-high never wins at showdown here. Because the opponent folds often, a **bluff** has the **fold equity** to win the pot. Bet.',
        hints: [
          'Can Jack-high ever win this pot at showdown?',
          'If you cannot win at showdown, the only way to win is to make them fold.',
          'This opponent folds often, so a bluff has fold equity here.',
        ],
        why: 'When your hand has no showdown value, checking can never win. A **bluff** turns it into a winner whenever the opponent folds. The bet is profitable precisely because this opponent has enough **fold equity** (they fold often).',
      },
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p3',
      prompt:
        'River, a different opponent. You hold Ace-high with no pair, and you know this player **never folds**. There is no bet yet. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['AS', 'QC'],
        board: ['KD', '9H', '4C', '2S', '7D'],
        street: 'river',
        pot: 80,
        heroStack: 300,
        villainStack: 300,
        sizingOptions: [0.5, 0.75, 1],
        seed: 79,
        task: 'choose-action',
        helperText: 'No bet faces you, so your choices are check or bet.',
      },
      answer: { action: 'check' },
      feedback: {
        correct: 'Right. **Check**. Against someone who never folds there is no **fold equity**, so a **bluff** cannot work, and your hand is too weak to bet for value.',
        incorrect:
          'A bluff needs **fold equity**. If the opponent never folds, betting Ace-high only loses chips, so **check** and try to win at showdown.',
        hints: [
          'A bluff only works if the opponent can fold.',
          'This opponent never folds, so betting has no fold equity.',
          'Ace-high is too weak to bet for value, and a bluff cannot work either.',
        ],
        why: 'Betting wins two ways only when **fold equity** exists. Against a player who **never folds**, the "they fold" path is gone, and Ace-high is too weak to value bet. So a bet has no way to profit. **Check** and keep your showdown chance.',
      },
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p4',
      prompt:
        'You hold the A and K of clubs on a Q-J flop with two clubs: a **monster** draw (a flush draw plus a Broadway straight draw). A small bet comes to you. To win the pot now AND keep your draw if called, what is the most aggressive action?',
      interaction: 'betting-round',
      config: {
        hole: ['AC', 'KC'],
        board: ['QC', 'JD', '3C'],
        street: 'flop',
        pot: 80,
        heroStack: 400,
        villainStack: 400,
        facing: { action: 'bet', amount: 20 },
        sizingOptions: [0.5, 0.75, 1],
        villainAction: 'fold',
        seed: 74,
        task: 'choose-action',
        helperText: 'The Opponent bets 20 into a pot of 60. You can call, raise, or fold.',
      },
      answer: { action: 'raise' },
      feedback: {
        correct: 'Yes. **Raise** as a **semibluff**. Raising adds **fold equity** (they may fold now), and if called you still hold a huge draw.',
        incorrect:
          'Calling is fine, but it passes up **fold equity**. A monster draw is the perfect hand to **raise** as a semibluff: win now if they fold, or hit your draw if they call.',
        hints: [
          'A bet faces you, so you can call, raise, or fold.',
          'A flush draw plus a Broadway straight draw is a monster draw, often a favorite even if called.',
          'Raising adds a second way to win (they fold now) on top of your draw.',
        ],
        why: 'A **semibluff** raise stacks two edges: the **fold equity** of an aggressive raise, plus the huge equity of a combined flush-and-straight draw if called. With a draw this big, raising is more profitable than just calling.',
      },
    },
  ],
}
