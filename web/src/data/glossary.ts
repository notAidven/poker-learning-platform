/**
 * Glossary of poker terms for the "Suited" course.
 *
 * Each key is a *normalized* canonical term (see `normalizeTerm`) mapped to a
 * concise, beginner-friendly definition. Definitions are grounded in the
 * verified research notes in `docs/poker-research/*` (rules/hand rankings,
 * hand flow & betting, and poker math).
 *
 * `MathContent` looks up the **bolded** words it renders against this map: a
 * match becomes a clickable `GlossaryTerm` popover; everything else stays plain
 * bold. Lookups are case-insensitive and tolerate simple plurals, a leading
 * article ("the flop"), and trailing parentheticals ("small blind (SB)").
 */

export type GlossaryEntry = {
  /** The term exactly as it appeared in the prose (preserves the author's casing). */
  term: string
  definition: string
}

/**
 * Canonical term → definition. Keys MUST already be normalized (lowercase, no
 * parentheticals/punctuation). Aliases (trips/set, quads, EV, …) get their own
 * entries that point at the same idea so they trigger too.
 */
const GLOSSARY: Record<string, string> = {
  // --- the deck ---
  deck: 'The 52 cards used in poker: 13 ranks in each of the four suits.',
  suit: 'One of the four card families: spades ♠, hearts ♥, diamonds ♦, and clubs ♣. Suits never outrank one another.',
  rank: "A card's value, from 2 (low) up through 10, J, Q, K, and A (high).",

  // --- Texas Hold'em structure ---
  'hole cards': 'Your two private cards, dealt face down. Only you can use them.',
  'community cards':
    'The shared, face-up cards in the middle that everyone can use. Also called the board.',
  board: 'The shared, face-up cards in the middle that every player can use. Also called the community cards.',
  flop: 'The first three community cards, dealt at the same time.',
  turn: 'The fourth community card, dealt by itself after the flop.',
  river: 'The fifth and final community card.',
  showdown:
    'The end of a hand, when the players still in show their cards and the best five-card hand wins the pot.',
  pot: 'All the chips bet in a hand. It is what you are playing to win.',

  // --- the table: button, blinds, position ---
  button:
    "A marker showing who is 'the dealer' for the hand. It acts last after the flop and moves one seat to the left each hand.",
  blinds:
    'Two forced bets put in before the cards are dealt, so there is always something to play for.',
  blind: 'A forced bet put in before the cards are dealt, so there is always something to play for.',
  'small blind':
    'The forced bet put in by the player just left of the button. It is usually half the big blind.',
  'big blind':
    'The forced bet put in just left of the small blind. It is usually twice the small blind, and equals the smallest bet.',
  position:
    'Where you sit relative to the button, which decides when you act. Acting later is a big advantage.',
  'under the gun': 'The first seat to act before the flop, just left of the big blind.',
  utg: 'Under the gun: the first seat to act before the flop, just left of the big blind.',

  // --- hand rankings (strongest to weakest) ---
  'royal flush': 'The best possible hand: A-K-Q-J-10, all of one suit.',
  'straight flush': 'Five cards in a row by rank, all of the same suit.',
  'four of a kind': 'Four cards of the same rank. Also called quads.',
  quads: 'Four of a kind: four cards of the same rank.',
  'full house': 'Three of a kind plus a pair (for example, three Kings and two Sevens).',
  flush: 'Five cards of the same suit, not in a row.',
  straight: 'Five cards in a row by rank, in any mix of suits (for example, 6-7-8-9-10).',
  'three of a kind': 'Three cards of the same rank. Also called trips or a set.',
  trips: 'Three of a kind: three cards of the same rank.',
  set: 'Three of a kind made with a pocket pair plus a matching card on the board.',
  'two pair': 'Two separate pairs, plus a fifth side card.',
  'one pair': 'A single pair (two cards of the same rank) plus three side cards.',
  pair: 'Two cards of the same rank.',
  'high card': 'A hand that makes none of the categories above. Its highest card plays, and it is the weakest hand.',
  kicker:
    'A side card that breaks a tie when two hands are otherwise equal. For example, A-A-K beats A-A-Q.',

  // --- betting actions ---
  check: 'Pass without betting and stay in for free. Only allowed when no one has bet yet.',
  bet: 'Put the first chips into the pot on a betting round.',
  call: 'Match the current bet to stay in the hand.',
  raise: 'Raise the current bet, so others must put in more to keep playing.',
  're-raise': 'A raise of a raise: the second (or later) raise in the same betting round.',
  fold: 'Give up your cards and any claim to the pot. If you can check for free, never fold.',
  'all-in': 'Betting every chip you have left.',
  'all in': 'Betting every chip you have left.',

  // --- preflop & starting hands ---
  suited:
    'Two hole cards of the same suit, like A and K of spades. A suited hand can make a flush, so it is a little stronger than the offsuit version.',
  offsuit: 'Two hole cards of different suits. Written with an "o", as in AKo.',
  'pocket pair': 'Two hole cards of the same rank, like two Nines.',
  'premium hand':
    'One of the strongest starting hands: a big pocket pair (AA, KK, QQ) or A-K. Worth raising from any seat.',
  premium:
    'The strongest starting hands, like a big pocket pair (AA, KK, QQ) or A-K. Worth raising from any seat.',
  broadway: 'A card from Ten up to Ace (T, J, Q, K, A). Two broadway cards make a strong starting hand.',
  'broadway cards': 'The high cards from Ten to Ace. Two of them, like K-Q, make a strong starting hand.',
  'suited connector':
    'Two cards of the same suit that sit next to each other in rank, like 8-7 suited. It can flop straights and flushes.',
  open: 'To be the first player to put in a raise before the flop.',
  'open-raise': 'To be the first player to raise before the flop, rather than just calling.',
  limp: 'To enter the pot before the flop by just calling the big blind instead of raising.',
  'starting hand': 'The two hole cards you are dealt before the flop.',

  // --- the math (outs, odds, equity, EV) ---
  out: 'An unseen card that turns your hand into a likely winner.',
  draw: 'An unfinished hand that needs one more card to become strong (such as a flush draw).',
  'flush draw': 'Four cards toward a flush. You need one more card of that suit (9 outs).',
  'straight draw': 'Four cards toward a straight, needing one more card to complete it.',
  'open-ended straight draw':
    'Four cards in a row that are open at both ends, so a card at either end completes the straight (8 outs).',
  gutshot: 'A straight draw missing one middle card, completed by just one rank (4 outs).',
  'pot odds':
    'The price of a call compared with the pot. It is the break-even win rate you need, found as call ÷ (pot + call).',
  equity:
    'Your share of the pot right now: how often your hand would win if all the remaining cards were dealt out.',
  'expected value':
    'EV: what a choice is worth on average over the long run. Positive EV makes money, negative EV loses it.',
  ev: 'Expected value: what a choice is worth on average over the long run. Positive EV makes money, negative EV loses it.',
  'value bet': 'A bet with a strong hand, hoping a worse hand calls and pays you off.',
  'betting for value': 'Betting a strong hand so that worse hands call and pay you off.',

  // --- hand strength relative to the board ---
  'made hand':
    'A complete hand right now, like a pair or better, as opposed to a draw that still needs another card.',
  'top pair':
    'A pair made by matching one of your two hole cards with the highest card on the board.',
  'top set':
    'The strongest three of a kind: a pocket pair that matches the highest card on the board (for example, pocket Kings on a King-high board).',
  overpair:
    'A pocket pair higher than every card on the board (for example, pocket Queens on a 9-6-2 board).',
  monster: 'A huge hand that is almost certain to win, such as top set or better.',
  nuts: 'The best possible hand on the current board. It cannot be beaten.',
  'the nuts': 'The best possible hand on the current board. It cannot be beaten.',
  'nut flush': 'The best possible flush, the one made with the Ace of the flush suit.',

  // --- board texture ---
  'dry board':
    'A board with few straight or flush possibilities, so it is unlikely to have helped anyone (for example, K-7-2 of mixed suits).',
  'wet board':
    'A board with many straight and flush possibilities, so draws and strong hands are likely (for example, 9-8-7 with two of one suit).',
  rainbow: 'A flop of three different suits, so no flush draw is possible yet.',
  blank: 'A card that changes nothing and helps no one.',

  // --- bluffing & bet purpose ---
  bluff: 'A bet or raise with a weak hand, made to push a better hand into folding.',
  semibluff:
    'A bet or raise with a draw rather than a made hand. It can win now if everyone folds, or later if the draw completes.',
  'semi-bluff':
    'A bet or raise with a draw rather than a made hand. It can win now if everyone folds, or later if the draw completes.',
  'fold equity':
    'The value a bet gains from the chance your opponent folds. Without it, a bluff cannot work.',
  'thin value':
    'A value bet with a hand only a little ahead, made because just enough worse hands will still call.',

  // --- combinations & blockers (advanced play) ---
  combination:
    'One specific two-card holding. A hand class like A-K is made of several combinations, one for each way its suits can pair up.',
  blocker:
    'A card in your hand that removes some of the hands your opponent could have. Holding an Ace, for example, means they can have fewer pairs of Aces.',

  // --- preflop ranges & position (advanced play) ---
  range: 'The whole set of hands a player could have in a spot, instead of one exact hand.',
  rfi: 'Raise-first-in: being the first player to enter the pot with a raise before the flop.',
  'raise-first-in':
    'Being the first player to enter the pot with a raise before the flop. Also called an RFI.',
  'tight-aggressive':
    'A solid style: play relatively few hands (tight), but bet and raise with the ones you do play (aggressive).',
  dominated:
    'A hand that shares a card with a stronger one and usually loses to it, like A-9 against A-K.',

  // --- board texture & c-betting (advanced play) ---
  'board texture': 'How coordinated the flop is: how many straights and flushes it makes possible.',
  texture: 'How coordinated the board is: how many straights and flushes it makes possible.',
  'continuation bet':
    'A bet on the flop by the player who raised before the flop, keeping the pressure on.',
  'c-bet': 'Short for continuation bet: a flop bet by the player who raised before the flop.',
  'preflop raiser':
    'The player who made the last raise before the flop. They often keep betting on the flop.',
  'pure air': 'A hand with no pair and no draw, so nothing of value yet.',

  // --- implied odds & SPR (advanced play) ---
  'implied odds':
    'The extra chips you expect to win on later streets when your draw hits. They can make a call worth it even when the current pot odds say fold.',
  'reverse implied odds':
    'The chips you risk losing when you complete your draw but still finish second best, like making a small flush against a bigger one.',
  spr: 'Stack-to-pot ratio: the effective stack divided by the pot. A low SPR means you are close to all-in; a high SPR leaves room to bet later.',
  'stack-to-pot ratio':
    'The effective stack divided by the pot (SPR). It shows how much room is left to bet on later streets.',
  'effective stack':
    'The smaller of the two stacks in a pot, since that is the most either player can win or lose.',
  committed:
    'So invested in the pot that folding no longer makes sense, because the price to call is small next to what is already there.',
  'set-mine':
    'Calling before the flop with a small pocket pair, hoping to flop a set and win a big pot.',

  // --- tournaments & ICM (advanced play) ---
  icm: 'Independent Chip Model: in a tournament you are paid by finishing place, so the chips you can lose are worth more than the chips you can win.',
  'independent chip model':
    'The idea that tournament chips are not cash: because busting pays nothing, the chips you can lose are worth more than the chips you can win.',
  'pay jump': 'A point in a tournament where finishing one place higher pays more, like moving into the money.',
  'push or fold': 'Short-stack strategy: move all-in or fold, with no small raises in between.',
  'push fold': 'Short-stack strategy: move all-in or fold, with no small raises in between.',

  // --- other useful terms that appear in the lessons ---
  'playing the board':
    "When the five community cards are your best hand and your hole cards don't help. You can only tie.",
}

/**
 * Normalize a term for lookup: lowercase, drop trailing parentheticals like
 * "(SB)" / "(EV)", strip surrounding punctuation, and collapse whitespace.
 * Hyphens are kept ("all-in", "open-ended").
 */
export function normalizeTerm(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ') // drop parentheticals: "small blind (sb)" → "small blind"
    .replace(/[^a-z0-9\s-]/g, ' ') // drop quotes, commas, periods, em-dashes, …
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Resolve a (possibly inflected) bold phrase to a glossary entry, or null.
 * Tries the exact normalized form, the form without a leading article, and
 * simple singular/plural variants, but only ever returns a *real* key, so the
 * extra candidates can't produce false matches.
 */
export function lookupGlossaryTerm(raw: string): GlossaryEntry | null {
  const normalized = normalizeTerm(raw)
  if (!normalized) return null

  const candidates = new Set<string>()
  const bases = [normalized, normalized.replace(/^(the|a|an)\s+/, '')]
  for (const base of bases) {
    if (!base) continue
    candidates.add(base)
    if (base.endsWith('es')) candidates.add(base.slice(0, -2)) // flushes → flush
    if (base.endsWith('s')) candidates.add(base.slice(0, -1)) // outs → out, blinds → blind
    candidates.add(`${base}s`)
    candidates.add(`${base}es`)
  }

  for (const candidate of candidates) {
    const definition = GLOSSARY[candidate]
    if (definition) return { term: raw.trim(), definition }
  }
  return null
}

/**
 * Every glossary entry, sorted alphabetically by its canonical term. Derived
 * directly from the GLOSSARY map above, so any term added there shows up here
 * automatically (e.g. on the Glossary page) with no extra wiring. The keys are
 * already the normalized canonical term; presentation (acronym casing, etc.) is
 * left to the consumer.
 */
export const glossaryEntries: GlossaryEntry[] = Object.entries(GLOSSARY)
  .map(([term, definition]) => ({ term, definition }))
  .sort((a, b) => a.term.localeCompare(b.term))
