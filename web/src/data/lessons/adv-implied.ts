import type { LessonDefinition } from '../../types/lesson'

/**
 * Lesson "Implied Odds & SPR" (Section 4 · Advanced Play), the third Advanced lesson.
 * It extends the Math section's pot-odds work with two ideas:
 *   1. Implied odds: the EXTRA chips you expect to win on later streets when your draw
 *      hits. They can justify a call that direct pot odds reject (the classic set-mine),
 *      but beware reverse implied odds and do not assume you always get paid (research
 *      04 §6.5 / poker-math §6.5).
 *   2. SPR (stack-to-pot ratio) = effective stack / pot. Deep stacks (high SPR) make
 *      implied odds matter; short stacks (low SPR) remove them.
 *
 * Reuses `outs-odds` (existing asks), `betting-round` ('choose-action' + 'ev-of-call'),
 * and `compare-events`. OutsOdds is NOT extended for an 'impliedOdds' ask: betting-round
 * + outs-odds + compare-events cover it with zero new grading code and stay fully
 * deterministic. 6 problems / 8 steps = 75% interactive; concepts never run back-to-back.
 * ASCII only. Keep `id: 'adv-implied'`.
 */
export const advImplied: LessonDefinition = {
  id: 'adv-implied',
  title: 'Implied Odds & SPR',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Implied odds',
      content: `**Pot odds** price a call using only the chips in the pot **right now**. But when you are on a draw, hitting it often wins you **more** chips on later streets. Those future chips are your **implied odds**.

So a draw that direct pot odds say to **fold** can still be a profitable **call** when you expect to win a lot more after you hit, especially with deep stacks behind.

Two cautions:

- You will not always get paid. Opponents can check behind or fold when the scary card comes.
- **Reverse implied odds**: sometimes you hit but still lose (your small flush runs into a bigger one).

You will not need exact math in this lesson. A rough sense of your chances and the chips at stake is enough to make the right call, and a scratchpad is there when you want it.`,
    },
    {
      type: 'problem',
      id: 'p1',
      showCalculator: true,
      prompt:
        'Turn. You hold the Ace and King of hearts on a Q-7-2-9 board with two hearts: a flush draw. The pot is 80 and it costs 40 to call. By DIRECT pot odds only, what equity do you need, and should you call or fold?',
      interaction: 'outs-odds',
      concepts: ['pot-odds', 'implied-odds'],
      config: {
        hole: ['AH', 'KH'],
        board: ['QH', '7H', '2C', '9S'],
        drawLabel: 'a flush',
        street: 'turn',
        ask: ['potOdds', 'decision'],
        pot: 80,
        betToCall: 40,
        allowFractionAnswer: true,
        empiricalTieIn: true,
        helperText:
          'Estimate your draw with the Rule of 2 (outs x 2 with one card to come), then compare it to the price. You can enter the price as a fraction, use the scratchpad, or deal it out below to check your estimate.',
      },
      answer: { potOddsPercent: 33, decision: 'fold' },
      feedback: {
        correct: 'Right. Direct odds need about 33% but a one-card flush draw is only about 18%, so on price alone you fold.',
        incorrect:
          'The price is 40 into 120, so you need about 33% equity. A flush draw with one card to come is only about 18%, so by DIRECT odds you fold.',
        hints: [
          'Required equity is call / (pot + call) = 40 / 120.',
          'A flush draw on the turn is 9 outs, about 18% by the Rule of 2.',
          'Compare 18% to the price. Are you getting enough on direct odds alone?',
        ],
        why: 'On **direct pot odds**, required equity is $40/(80+40) \\approx 33\\%$, but a one-card flush draw is only about **18%**. So the call loses money on price alone. This is exactly the spot where **implied odds**, the chips you win later when the flush hits, decide whether to continue.',
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt:
        'Preflop, stacks are very deep (1000 each). An early player raises to 30 and you hold pocket Fives. What is the best action?',
      interaction: 'betting-round',
      concepts: ['implied-odds'],
      config: {
        hole: ['5S', '5D'],
        board: [],
        street: 'preflop',
        pot: 45,
        heroStack: 1000,
        villainStack: 1000,
        facing: { action: 'bet', amount: 30 },
        sizingOptions: [0.5, 0.75, 1],
        seed: 431,
        task: 'choose-action',
        helperText: 'Stacks are deep (1000 each). A player has raised to 30. You can fold, call 30, or raise.',
      },
      answer: { action: 'call' },
      feedback: {
        correct: 'Yes. With deep stacks you **call** to set-mine: hit a Five for a set and you can win a huge pot.',
        incorrect:
          'A small pair deep is the classic **implied-odds call**: you call hoping to flop a set (about 1 in 8) and stack a strong hand. Call.',
        hints: [
          'You will flop a set with a pocket pair about one time in eight.',
          'Direct odds do not justify it, but stacks are very deep.',
          'How much could you win on later streets if you flop a hidden set?',
        ],
        why: 'Set-mining is the textbook **implied-odds** play. You rarely flop a set, so direct odds say fold, but when you do hit, the hand is hidden and you can win a **large** pot from the raiser. That future payoff, only available because stacks are **deep**, makes calling profitable.',
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Stack-to-pot ratio (SPR)',
      content: `**SPR** is the **effective stack** divided by the **pot**: $\\text{SPR} = \\text{stack} / \\text{pot}$.

It tells you how much room there is to maneuver.

- **Low SPR** (small stacks relative to the pot): you are close to **committed**. Hands play for stacks quickly, and there is little extra to win later, so **implied odds shrink**.
- **High SPR** (deep stacks relative to the pot): lots of betting still to come, so **implied odds grow**. Speculative hands like small pairs and suited connectors go up in value.

Match your plan to the SPR: chase implied odds when deep, and lean on made-hand value when short.

You do not need to calculate SPR exactly. Just notice whether the stacks are deep or short compared with the pot.`,
    },
    {
      type: 'problem',
      id: 'p3',
      prompt: 'You hold a drawing hand. In which situation do implied odds help you MORE?',
      interaction: 'compare-events',
      concepts: ['spr', 'implied-odds'],
      config: {
        chooseLabel: 'Where do implied odds help more?',
        helperText: 'Implied odds are the chips you can still win after you hit your draw.',
        eventA: {
          label: 'Deep stacks (high SPR)',
          detail: '200 behind into a 20 pot. Lots left to win on later streets.',
        },
        eventB: {
          label: 'Short stacks (low SPR)',
          detail: '20 behind into a 20 pot. Almost nothing left to win.',
        },
      },
      answer: { more: 'a' },
      feedback: {
        correct: 'Right. Deep stacks (high SPR) leave plenty to win later, so implied odds are largest.',
        incorrect:
          'Implied odds are future chips. With deep stacks (high SPR) there is far more left to win, so that is where implied odds help most.',
        hints: [
          'Implied odds are about chips you win AFTER you hit.',
          'Which situation has more money left behind to win?',
          'High SPR means deep stacks and lots of room to bet later.',
        ],
        why: 'Implied odds are only as big as the chips still behind. With a **high SPR** (deep stacks), a hit can win a large pot on later streets, so speculative draws are worth more. With a **low SPR**, there is little left to win, so implied odds nearly vanish.',
      },
    },
    {
      type: 'problem',
      id: 'p4',
      showCalculator: true,
      prompt:
        'A draw on the turn that is about 20% to hit, so you win about 1 in 5 times. The pot is 120 and it costs 20 to call. Using EV = (win chance) x (pot) - (lose chance) x (call), what is the EV of calling, in chips? Use the scratchpad if you like.',
      interaction: 'betting-round',
      concepts: ['ev', 'implied-odds'],
      config: {
        hole: ['AH', 'KH'],
        board: ['QH', '7H', '2C', '9S'],
        street: 'turn',
        pot: 120,
        heroStack: 400,
        villainStack: 400,
        facing: { action: 'bet', amount: 20 },
        seed: 432,
        task: 'ev-of-call',
        helperText: 'There is 120 in the pot and it costs 20 to call. Your draw is about 20% to hit.',
      },
      answer: { evChips: 8, evTolerance: 1 },
      feedback: {
        correct: 'Right. EV = 0.20 x 120 - 0.80 x 20 = 24 - 16 = +8 chips, so even the direct call is profitable here.',
        incorrect:
          'EV = (win chance) x (pot) - (lose chance) x (call) = 0.20 x 120 - 0.80 x 20 = 24 - 16 = +8 chips.',
        hints: [
          'Win chance is 0.20; lose chance is 0.80.',
          'You win the 120 pot and risk the 20 call.',
          'EV = 0.20 x 120 - 0.80 x 20.',
        ],
        why: 'A cheap call into a big pot needs very little equity: required equity is $20/(120+20) \\approx 14\\%$, and you have about 20%. So $\\text{EV} = 0.20 \\times 120 - 0.80 \\times 20 = +8$ chips. Implied odds only add to an already profitable call.',
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt:
        'Turn, same flush draw, but stacks are SHORT: only 40 behind. The pot is 80 and a bet of 40 puts you all-in. What is the best action?',
      interaction: 'betting-round',
      concepts: ['spr', 'implied-odds'],
      config: {
        hole: ['AH', 'KH'],
        board: ['QH', '7H', '2C', '9S'],
        street: 'turn',
        pot: 80,
        heroStack: 40,
        villainStack: 40,
        facing: { action: 'bet', amount: 40 },
        sizingOptions: [0.5, 0.75, 1],
        seed: 433,
        task: 'choose-action',
        helperText: 'Stacks are short: only 40 behind. Calling 40 is for the rest of your chips.',
      },
      answer: { action: 'fold' },
      feedback: {
        correct: 'Right. Short stacks mean no implied odds, and 18% does not beat the price, so fold.',
        incorrect:
          'With only 40 behind there are no future chips to win, so implied odds are gone. An 18% draw cannot call this price, so fold.',
        hints: [
          'Calling here is for your last chips, so there is nothing more to win later.',
          'With no implied odds, only the direct price matters.',
          'An 18% draw versus a price needing about 33% is a fold.',
        ],
        why: 'A **low SPR** removes **implied odds**: calling is for stacks, so there are no future bets to win. With only direct odds left, an 18% flush draw cannot call a price that needs about 33%. **Fold**. Deep, the same draw could call; short, it cannot.',
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt: 'Both are draws to a strong hand. Which one has WORSE implied odds (more reverse-implied-odds risk)?',
      interaction: 'compare-events',
      concepts: ['implied-odds'],
      config: {
        chooseLabel: 'Which draw has worse implied odds?',
        helperText: 'Reverse implied odds means you can hit your draw and still lose a big pot.',
        eventA: {
          label: 'A baby flush draw',
          detail: 'You make a low flush, but a higher flush can beat you and stack you.',
        },
        eventB: {
          label: 'A draw to the best straight',
          detail: 'When you hit, you almost always have the winning hand.',
        },
      },
      answer: { more: 'a' },
      feedback: {
        correct: 'Right. A small flush can hit and still lose to a bigger flush, the heart of reverse implied odds.',
        incorrect:
          'A baby flush draw can complete and still lose to a higher flush, costing you chips. That is reverse implied odds, so its implied odds are worse.',
        hints: [
          'Reverse implied odds is hitting your draw but still losing.',
          'Which draw can complete and still be second-best?',
          'A draw to the very best hand rarely loses when it hits.',
        ],
        why: 'A **baby flush draw** suffers **reverse implied odds**: when it hits, a bigger flush sometimes beats it and takes a large pot, so its true implied odds are poor. A draw to the **nut** (best) hand wins almost every time it completes, so its implied odds are clean.',
      },
    },
  ],
}
