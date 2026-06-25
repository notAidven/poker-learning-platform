import type { LessonDefinition } from '../../types/lesson'

/**
 * Lesson 3: "Flow of a Hand" (design doc §6, Lesson 3; research file
 * `docs/poker-research/02-hand-flow-and-betting.md`).
 *
 * Teaches blinds + the button, the four streets, position & action order
 * (incl. the heads-up exception), and showdown (best hand wins, reveal order,
 * fold-to-one, all-in). The `board-dealer` widget carries the street walkthrough,
 * the "what's your best hand now?" beats, and the showdown "who won?" decision
 * (hero vs a revealed villain, graded by the hand evaluator); `compare-events`
 * handles the discrete who-acts-when decisions. 9 problems / 12 steps (75%).
 */
export const lesson3: LessonDefinition = {
  id: '3',
  title: 'Flow of a Hand',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Blinds, the button, and the deal',
      content: `Every hand starts with two forced bets called **blinds**. A marker, the **button**, shows who is "the dealer".

The player just left of the button posts the **small blind (SB)**. The next player posts the **big blind (BB)**, usually twice the small blind ($\\text{SB} = \\tfrac{1}{2}\\,\\text{BB}$). The blinds go in **before any cards**. They seed the **pot** and start the action. Then each player gets their two **hole cards**.`,
    },
    {
      type: 'problem',
      id: 'p1',
      prompt: `Deal a hand one street at a time and watch the order: **hole cards → flop (3) → turn (1) → river (1)**.`,
      interaction: 'board-dealer',
      config: {
        hole: ['AH', 'KS'],
        board: ['QD', 'JC', '9H', '4S', '2C'],
        streets: ['preflop', 'flop', 'turn', 'river'],
        annotateStreets: true,
        helperText: 'Tap “Deal” to reveal each street in turn.',
      },
      answer: { minStreetsRevealed: 4 },
      feedback: {
        correct: `That's the shape of every hand: your 2 hole cards, then 3 community cards on the **flop**, 1 on the **turn**, and 1 on the **river**. Five shared cards in all.`,
        incorrect: `Keep dealing until all five community cards are out: flop (3) + turn (1) + river (1).`,
        hints: [
          'Use the Deal button to reveal the next street.',
          'The flop is 3 cards at once; the turn and river are 1 card each.',
          'You need all four streets dealt before you can continue.',
        ],
        why: `A hand plays out over four betting rounds, called **streets**: pre-flop (right after the hole cards), the **flop** (3 community cards), the **turn** (a 4th), and the **river** (a 5th). After the river, if two or more players are still in, the hand goes to **showdown**.`,
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt: `You hold **A♥ A♦**. Deal each street and pick your **best made hand** as it changes.`,
      interaction: 'board-dealer',
      config: {
        hole: ['AH', 'AD'],
        board: ['KS', '7H', '2C', 'KD', 'AC'],
        streets: ['preflop', 'flop', 'turn', 'river'],
        askBestHandAt: ['flop', 'turn', 'river'],
        annotateStreets: true,
        helperText: 'Deal the flop, turn, and river, naming your best hand at each.',
      },
      answer: {
        minStreetsRevealed: 4,
        bestHandByStreet: { flop: 'pair', turn: 'two-pair', river: 'full-house' },
      },
      feedback: {
        correct: `Your hand climbed every street: a **pair** of Aces on the flop, **two pair** once the board paired Kings on the turn, and a **full house** (Aces full of Kings) when the third Ace hit the river.`,
        incorrect: `Re-read the best 5-card hand at each street, since the same hole cards can make a stronger hand as new community cards arrive.`,
        hints: [
          'Combine your 2 hole cards with the community cards and find the best 5.',
          'The turn pairs the Kings on the board, on top of your pair of Aces.',
          'A third Ace on the river gives you three Aces alongside the paired Kings.',
        ],
        why: `Your hand is always the strongest 5-card combination of your 2 hole cards and the community cards **right now**. As cards are added you re-evaluate: pair → two pair → full house here. Your hole cards never changed, the board did.`,
      },
    },
    {
      type: 'problem',
      id: 'p3',
      prompt: `You hold **K♥ Q♥**. Four hearts is a *flush draw*, not yet a flush. Deal it out and name your best **made** hand each street.`,
      interaction: 'board-dealer',
      config: {
        hole: ['KH', 'QH'],
        board: ['7H', '2H', 'KS', '4C', '9H'],
        streets: ['preflop', 'flop', 'turn', 'river'],
        askBestHandAt: ['flop', 'turn', 'river'],
        annotateStreets: true,
        helperText: 'A draw only becomes a made hand if the card you need arrives.',
      },
      answer: {
        minStreetsRevealed: 4,
        bestHandByStreet: { flop: 'pair', turn: 'pair', river: 'flush' },
      },
      feedback: {
        correct: `Until the river you only held a **pair of Kings**. Four hearts is a *draw*, not a made flush. The fifth heart on the river completed your **flush**.`,
        incorrect: `A flush needs **five** cards of one suit. Four hearts is only a draw; your made hand stays the pair until a fifth heart lands.`,
        hints: [
          'Count the hearts: four is a draw, five is a flush.',
          'On the flop and turn, four hearts is only a draw, so your best made hand is what you hold apart from it.',
          'The river is a heart, so now you have five of them.',
        ],
        why: `A **draw** is an unfinished hand. With four hearts you have a *flush draw*, but your best **made** hand is still the pair. Only when the fifth heart arrives do you actually hold a flush. Never count a draw as a made hand.`,
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Position: who acts when',
      content: `Players act in turn, clockwise. **Pre-flop**, the big blind is a live bet, so action starts to its **left**, at the player **under the gun (UTG)**. The **big blind acts last** (it may *check* if no one raised).

**Post-flop** (flop, turn, river), action starts with the first active player left of the button, and the **button acts last** on every street. Acting later is an edge: you see everyone's move before you decide. That is why the **button is the best seat**.

**Heads-up (2 players):** the button posts the small blind and acts **first** pre-flop, **last** post-flop.`,
    },
    {
      type: 'problem',
      id: 'p4',
      prompt: `Pre-flop, which player must act first?`,
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Pre-flop, who acts first?',
        helperText: 'The blinds are already in, so everyone else must answer the big blind.',
        eventA: { label: 'Under the gun', detail: 'The seat just left of the big blind' },
        eventB: { label: 'The big blind', detail: 'Posted the big forced bet' },
      },
      answer: { more: 'a' },
      feedback: {
        correct: `Right. Pre-flop, action begins to the **left of the big blind**, at **under the gun (UTG)**. The big blind already posted a live bet, so it acts **last** and may check if no one raised.`,
        incorrect: `The big blind's forced bet already "opened" the round, so it acts **last**. Action starts to its left, under the gun.`,
        hints: [
          'The blinds are posted before the cards; the big blind is a live bet.',
          'Action moves clockwise, starting to the left of the big blind.',
          'That first seat left of the big blind is called "under the gun".',
        ],
        why: `Because the big blind is a live bet, the first player to act pre-flop (UTG) is already facing a bet and must call, raise, or fold, since they cannot check. The big blind gets the last word and can simply check if no one raised; that is the BB's "option".`,
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt: `On the flop, turn, and river, which player acts **last**?`,
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Post-flop, who acts last?',
        helperText: 'After the flop, action starts left of the button and moves clockwise.',
        eventA: { label: 'The small blind', detail: 'First to act after the flop' },
        eventB: { label: 'The button', detail: 'The dealer position' },
      },
      answer: { more: 'b' },
      feedback: {
        correct: `Yes. Post-flop, the **button acts last** on every street. Acting last means you have already seen everyone else's decision, which is why the button is the most powerful seat.`,
        incorrect: `Post-flop, action starts with the first active player left of the button (often the small blind); the **button acts last**.`,
        hints: [
          'Post-flop order is different from pre-flop.',
          'Action begins to the left of the button and moves clockwise around the table.',
          'The button is the dealer position; acting later means seeing more before you decide.',
        ],
        why: `Acting later is an information advantage: you watch what opponents do before you decide, so you can value-bet, bluff, or take a free card more effectively. The button acts last on the flop, turn, and river: the best seat at the table.`,
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt: `**Heads-up** (just two players): who posts the small blind and acts first pre-flop?`,
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Heads-up, who acts first pre-flop?',
        helperText: 'With only two players, the blind and action rules flip for the button.',
        eventA: { label: 'The other player', detail: 'Posts the big blind' },
        eventB: { label: 'The button', detail: 'The dealer position' },
      },
      answer: { more: 'b' },
      feedback: {
        correct: `Correct. Heads-up, the **button posts the small blind, acts first pre-flop, and acts last post-flop**. (At a full table the small blind is instead the seat just left of the button.)`,
        incorrect: `Heads-up is the exception: the **button** posts the small blind and acts **first** pre-flop (then last post-flop).`,
        hints: [
          'Heads-up means exactly two players.',
          'The usual "small blind = left of the button" rule changes when only two play.',
          'Apply the heads-up flip to work out which seat posts the small blind and leads pre-flop.',
        ],
        why: `With two players there is no room for the normal seat order, so the button posts the small blind, acts first pre-flop, and still acts last on every later street. This matters because one-on-one (heads-up) play shows up in later lessons.`,
      },
    },
    {
      type: 'concept',
      id: 'c3',
      title: 'Showdown, and when there isn’t one',
      content: `After the river's betting, if **two or more** players remain, it's **showdown**: the **best 5-card hand wins the pot**. The last player to **bet or raise** on the river shows first. If the river was checked around, the first active player left of the button shows first. Identical hands **split** the pot.

If instead **all opponents fold, leaving one player**, the hand ends right away. That player wins **without a showdown** and need not show. A player can also go **all-in**.`,
    },
    {
      type: 'problem',
      id: 'p7',
      prompt: `Deal this hand to showdown against one opponent. You hold **A♠ 9♦**, and their cards stay hidden until the river. Deal every street, then call **who won** the pot.`,
      interaction: 'board-dealer',
      config: {
        hole: ['AS', '9D'],
        villain: ['AH', 'KC'],
        board: ['AC', '9S', '4D', 'JH', '2C'],
        opponents: 1,
        streets: ['preflop', 'flop', 'turn', 'river'],
        annotateStreets: true,
        helperText: 'Deal each street; at the river the opponent’s cards flip up and you call the winner.',
      },
      answer: { minStreetsRevealed: 4, winner: 'hero' },
      feedback: {
        correct: `You win. Your A♠ 9♦ pairs **both** the Ace and the Nine on the board → **two pair**, Aces and Nines. The opponent’s A♥ K♣ makes only **one pair** of Aces (the King never pairs). Two pair beats one pair.`,
        incorrect: `Build each player’s best 5-card hand: you make **two pair** (Aces and Nines); the opponent makes **one pair** of Aces. Two pair is the stronger category, so you take the pot.`,
        hints: [
          'Make each player’s best 5-card hand from their two hole cards plus the shared board.',
          'Your 9♦ pairs the 9♠ on the board, so that’s a second pair on top of your Aces.',
          'The opponent’s King never pairs, so they hold just one pair of Aces.',
        ],
        why: `At showdown the best 5-card hand wins. You: A♠ A♣ 9♦ 9♠ + J = **two pair**. Opponent: A♥ A♣ + K, J, 9 = **one pair** of Aces. Two pair outranks one pair, so you take the pot, and suits never break the tie.`,
      },
    },
    {
      type: 'problem',
      id: 'p8',
      prompt: `There was a bet on the river. At showdown, who turns their cards face-up first?`,
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Who shows first?',
        helperText: 'Showdown has a reveal order when the river was bet.',
        eventA: { label: 'The player who called', detail: 'Matched the last bet' },
        eventB: { label: 'The last to bet or raise', detail: 'The “aggressor” on the river' },
      },
      answer: { more: 'b' },
      feedback: {
        correct: `Right. The **last player to bet or raise** on the river shows first. If the river is **checked around** (no bet), the first active player left of the button shows first instead.`,
        incorrect: `When there's a river bet, the **last aggressor** (last to bet or raise) shows first; the caller can then show or muck.`,
        hints: [
          'Think about who put in the last aggressive action.',
          'The player who forced the action is the one expected to prove their hand.',
          'If nobody bet the river, the first player left of the button shows first.',
        ],
        why: `Showing the last aggressor's hand first keeps things orderly: the player who forced the action proves their hand, and the caller can reveal a winner or muck a loser. A checked-around river uses position instead: the first active player left of the button shows.`,
      },
    },
    {
      type: 'problem',
      id: 'p9',
      prompt: `Everyone else folds, leaving just one player. Does the hand go to showdown?`,
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Is there a showdown?',
        helperText: 'A showdown compares hands, but only if there are hands to compare.',
        eventA: { label: 'Yes, a showdown happens', detail: 'Cards are revealed and compared' },
        eventB: { label: 'No showdown', detail: 'The last player wins the pot, no cards shown' },
      },
      answer: { more: 'b' },
      feedback: {
        correct: `Correct. Once **all but one player fold**, the hand ends right there: the last player wins the pot **with no showdown** and need not show. (Pre-flop, the blinds still get to act, so folding "to the button" doesn't end it until only one player remains.)`,
        incorrect: `A showdown needs **two or more** players after the river. If everyone else folds, the lone remaining player simply wins the pot, with no cards shown.`,
        hints: [
          'A showdown compares the hands of the remaining players.',
          'If only one player is left, there is nothing to compare.',
          'A showdown needs at least two players left to compare hands.',
        ],
        why: `You can win two ways: hold the best hand at showdown, **or** be the last player left when everyone else folds. In the second case there is no showdown and you keep your cards hidden. (Folding "to the button" pre-flop does not auto-win, since the blinds still act.)`,
      },
    },
  ],
}
