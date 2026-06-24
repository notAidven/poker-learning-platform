import type { LessonDefinition } from '../../types/lesson'

/**
 * Lesson 6 — "Play a Full Hand" (capstone). Design doc §6, Lesson 6.
 *
 * Objective: put every prior lesson together and play a complete hand vs. AI
 * opponents (blinds → preflop → flop/turn/river betting → showdown → award the
 * pot), grounded in plain starting-hand intuition. Centerpiece is the multiway
 * Tier-3 `full-hand` capstone, which closes with the responsible-play note.
 *
 * Ratio: 5 problems / 6 steps = 83% interactive. Keep `id: '6'` / export `lesson6`.
 */
export const lesson6: LessonDefinition = {
  id: '6',
  title: 'Play a Full Hand',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Starting hands: play few, play them strong',
      content: `You know the pieces — now string them together: post the blinds, get two hole cards, then bet across the flop, turn, and river until showdown, where the best five-card hand wins the pot.

One habit matters most before you sit down: **play few hands, and play them aggressively** — raise, don't limp. Learn to recognize the premium tier instantly: **AA, KK, QQ, AK**. Beyond those, four buckets are playable — big pairs, big "Broadway" cards, suited aces/Broadways, and suited connectors. Play **tighter in early position, looser in late**: the button (acting last) is the best seat. And since most hands miss most flops, folding the junk is a skill, not weakness.

Myth to drop: *"bluffing is how you win."* For a beginner, value-betting your strong hands wins far more.`,
    },
    {
      type: 'problem',
      id: 'p1',
      prompt: 'Same blinds, your turn to act — which hand would you rather be dealt?',
      interaction: 'compare-events',
      config: {
        helperText:
          'Two starting hands (your two hole cards). One is a premium holding; the other is the worst hand in poker.',
        chooseLabel: 'Which starting hand is stronger?',
        eventA: {
          label: 'A♠ K♠',
          detail: 'Ace-King suited — two big cards that make top pairs, straights, and the nut flush.',
        },
        eventB: {
          label: '7♦ 2♣',
          detail: 'Seven-deuce offsuit — unconnected, no flush potential, the weakest hand in Hold’em.',
        },
      },
      answer: { more: 'a' },
      feedback: {
        correct: 'Right — A♠K♠ is a premium suited-broadway hand; 7♦2♣ is famously the worst.',
        incorrect:
          'A♠K♠ is far stronger. 7♦2♣ has no straight or flush potential and two low cards — fold it.',
        hints: [
          'A♠K♠ is one of the four premium hands (AA, KK, QQ, AK).',
          'Both A♠K♠ cards are the same suit and both are high — they can make the nut flush, straights, and top pairs.',
          '7♦2♣ are far apart in rank and different suits, so it can rarely make anything strong.',
        ],
        why: 'A♠K♠ sits in the premium tier — two Broadway cards, suited for flush potential, that flop strong top pairs and the nut flush draw. 7♦2♣ is the textbook worst starting hand: the two ranks are too far apart to make a straight, the suits differ so there is no flush, and both cards are low. Premium hands get raised; junk like 7-2 gets folded.',
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt: 'Position is your seat relative to the dealer button — and it changes which hands are worth playing.',
      interaction: 'compare-events',
      config: {
        helperText: 'Acting later in the hand means you see what everyone else does before you decide.',
        chooseLabel: 'Which seat lets you profitably play more hands?',
        eventA: {
          label: 'On the button',
          detail: 'You act last on every street after the flop — the most information and the best seat.',
        },
        eventB: {
          label: 'Under the gun',
          detail: 'You act first before the flop with the whole table still to act behind you — the toughest seat.',
        },
      },
      answer: { more: 'a' },
      feedback: {
        correct:
          'Exactly — on the button you act last, so you can play more hands profitably. Play tighter under the gun.',
        incorrect:
          'The button is the best seat: acting last gives you the most information, so you can widen your range. Play tightest under the gun.',
        hints: [
          'Acting last means you have already seen everyone else’s action — that is extra information.',
          '"Tighter early, looser late" is the key positional rule.',
          'Under the gun acts first with the most players left behind, so it is the riskiest seat.',
        ],
        why: 'Position is information. On the button you act last on the flop, turn, and river, so you can control the pot size and respond to what others do — that lets you profitably play a wider range. Under the gun you act first with everyone still to come, so you should play only your strongest hands. The directional rule is all you need: tighter in early position, looser in late position.',
      },
    },
    {
      type: 'problem',
      id: 'p3',
      prompt:
        'Warm-up: play one complete hand heads-up against a single opponent. Post the blinds, then make a decision on each street to showdown.',
      interaction: 'full-hand',
      config: {
        opponents: 1,
        aiTier: 2,
        heroHole: ['QH', 'QD'],
        seed: 7,
        blinds: { sb: 1, bb: 2 },
        startingStack: 200,
        checkpoints: [
          {
            street: 'preflop',
            prompt: 'Heads-up with **Q♥ Q♦**, a big pocket pair. Open-raise or give it up?',
            acceptableActions: ['raise', 'bet'],
            why: 'Queens are a premium pair — raise. Play few hands, but play them aggressively rather than limping in.',
          },
          {
            street: 'flop',
            prompt: 'You have position (you act last). Keep control of the pot or shut it down?',
            acceptableActions: ['bet', 'raise', 'call', 'check'],
            why: 'An overpair with position is likely the best hand — keep betting for value. Folding here would surrender a hand that is ahead.',
          },
          {
            street: 'turn',
            prompt: 'The turn card is out. Stay with the hand or fold?',
            acceptableActions: ['bet', 'raise', 'call', 'check'],
            why: 'Don’t abandon a strong hand without a reason. Keep value-betting, or take a free card — just don’t fold the likely best hand.',
          },
          {
            street: 'river',
            prompt: 'Final card — make your last decision.',
            acceptableActions: ['bet', 'raise', 'call', 'check'],
            why: 'On the river you either bet (or raise) for value or check for a cheap showdown. Folding a strong hand to a small bet is the classic sunk-cost mistake.',
          },
        ],
        passThreshold: 2,
        showResponsiblePlayNote: false,
      },
      answer: { passThreshold: 2 },
      feedback: {
        correct: 'Well played — you took a premium hand, stayed aggressive, and saw it through to showdown.',
        incorrect:
          'Review the decisions below and run it back: with a big pair and position, raise preflop and keep betting rather than folding.',
        hints: [
          'Queens are premium — open with a raise, not a limp.',
          'With an overpair and position, betting for value usually beats checking.',
          'Don’t fold a strong hand on later streets unless the board gets clearly scary.',
        ],
        why: 'A full hand is the four streets stitched together: blinds, then betting preflop, flop, turn, and river to showdown. With a premium pair like QQ you take the lead by raising and keep applying pressure, especially in position. At showdown the best five-card hand wins the pot — here your job is simply to play the strong hand strongly.',
      },
    },
    {
      type: 'problem',
      id: 'p4',
      prompt:
        'The capstone: play a full hand against the whole table. Post the blinds, bet each street, reach showdown, and try to win the pot.',
      interaction: 'full-hand',
      config: {
        opponents: 2,
        aiTier: 3,
        heroHole: ['AS', 'KS'],
        seed: 42,
        blinds: { sb: 1, bb: 2 },
        startingStack: 200,
        checkpoints: [
          {
            street: 'preflop',
            prompt:
              'You’re on the button with **A♠ K♠** — a premium hand — and the action is on you first. Open-raise or fold?',
            acceptableActions: ['raise', 'bet'],
            why: 'A♠K♠ is a premium suited-broadway hand. Raise — play few hands, but play them aggressively. Limping lets the blinds see a cheap flop.',
          },
          {
            street: 'flop',
            prompt: 'The flop is out and you have position (you act last). Continue with the hand or give it up?',
            acceptableActions: ['bet', 'raise', 'call', 'check'],
            why: 'Most hands miss most flops, so two big cards plus position have real value. Bet to apply pressure or take a free card — but don’t simply fold a hand with this much potential.',
          },
          {
            street: 'turn',
            prompt: 'Turn card is out. Reassess and act.',
            acceptableActions: ['bet', 'raise', 'call', 'check'],
            why: 'Play the hand you actually have. If you’re ahead or drawing, keep building or controlling the pot; don’t fold a hand still worth continuing.',
          },
          {
            street: 'river',
            prompt: 'Final card — award-the-pot time. Make your last call.',
            acceptableActions: ['bet', 'raise', 'call', 'check'],
            why: 'Bet or raise your strong hands for value and check marginal ones to reach a cheap showdown. Don’t fold a real hand to a small river bet just because you feel behind.',
          },
        ],
        passThreshold: 3,
        showResponsiblePlayNote: true,
      },
      answer: { passThreshold: 3 },
      feedback: {
        correct:
          'That’s a full hand, start to finish — blinds, four streets of betting, and a showdown. Nicely done.',
        incorrect:
          'Take another run at it. Raise your premium hand preflop, use your position, and don’t fold hands that are still worth continuing.',
        hints: [
          'Premium hands (AA, KK, QQ, AK) raise — don’t limp or fold A♠K♠.',
          'You’re on the button, so you act last after the flop — use that information.',
          'Don’t fold a decent hand to a small bet; call or raise when you’re ahead, and bet good hands for value.',
        ],
        why: 'A full hand puts everything together: post the blinds, get your cards, then bet preflop, flop, turn, and river to a showdown where the best five-card hand wins. Premium hands like A♠K♠ want to raise and keep the lead, and position lets you act last with more information. Two myths to drop for good: poker is **not** all luck — skill and odds win out over many hands; and bluffing is **not** how beginners win — value-betting your good hands is.',
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt: 'Two players take a hand to showdown and turn over their best five cards. Award the pot.',
      interaction: 'compare-events',
      config: {
        helperText: 'The best five-card hand wins. Rarer hands rank higher.',
        chooseLabel: 'Which hand wins the pot?',
        eventA: {
          label: 'Two pair',
          detail: 'Aces and Kings, with a Queen kicker.',
        },
        eventB: {
          label: 'Three of a kind',
          detail: 'Three Fives.',
        },
      },
      answer: { more: 'b' },
      feedback: {
        correct: 'Right — three of a kind outranks two pair, so the trip Fives win the pot.',
        incorrect:
          'Three of a kind beats two pair. Even though the pairs are Aces and Kings, trips is the rarer (and higher) category.',
        hints: [
          'Compare the categories first, not the individual card ranks.',
          'Recall the ladder: three of a kind ranks above two pair.',
          'Rarer hands rank higher — three of a kind shows up less often than two pair.',
        ],
        why: 'Hand strength is decided by category first. Three of a kind sits above two pair on the ranking ladder because it is rarer, so the three Fives beat Aces-and-Kings two pair regardless of how high those pairs are. Only when two hands share the same category do you compare kickers.',
      },
    },
  ],
}
