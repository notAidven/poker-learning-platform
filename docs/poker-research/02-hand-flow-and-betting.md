# Research Notes — Lessons 3 & 5: The Flow of a Hand & Betting Mechanics

**Course:** "Suited" — beginner Texas Hold'em (play-money only)
**Scope of this file:** Authoritative, cross-checked facts for **Lesson 3 (Flow of a Hand)** and **Lesson 5 (Betting)**, plus discrepancies/gaps found in `docs/poker-course-design.md`.
**Researched:** 2026-06-24. Web research only — no code changed, no git run.
**Method:** Every non-obvious fact below was cross-checked against **≥ 2 reputable sources**. Summaries are in our own words; no copyrighted text copied. Source URLs are listed at the bottom and referenced inline by short name (e.g. *Wikipedia: Texas hold 'em*).

> **Important framing for content authors:** Hold'em has three betting structures — **no-limit (NLHE)**, **pot-limit (PLO-style)**, and **fixed-limit**. Our course teaches **No-Limit Hold'em**, the standard modern game (the WSOP Main Event game). All "min-raise / bet-any-amount / all-in" rules below are the **no-limit** rules. (*Wikipedia: Texas hold 'em*, *Wikipedia: Betting in poker*.)

---

## 0. TL;DR verification verdict

The design doc's poker content for L3/L5 (§3.7 Betting actions, §3.8 Flow of a hand) is **substantially correct** — blinds, streets, action order preflop vs postflop, round open/close, and the five core actions are all accurately described. **No factual errors in the core rules.** The items to fix are mostly **gaps and one imprecise example**:

1. **Heads-up (2-player) exception is missing** — the button posts the small blind and acts *first* preflop / *last* postflop. Relevant because L5 and L6 use heads-up play.
2. **Showdown reveal order ("who shows first") is missing** — the user asked for it; standard rule is *last aggressor shows first; if checked around, first active player left of the button shows first.*
3. **All-in and re-raise are under-specified** — the user asked for both; the `BettingAction` type omits `'all-in'`.
4. **Lesson 3 p5 wording ("Everyone folds to the button → button wins") is imprecise** — preflop, the blinds still get to act, so the button does not automatically win.
5. **Beginner bet-sizing intuition is thin** — add the "size to board texture & purpose, not to your hand strength" idea and the small/medium/large defaults.

Details and exact wording fixes are in **§9 (Discrepancies & gaps)**.

---

## 1. Table setup: button, blinds, and the deal

### The button (dealer position)
- A **dealer button** is a marker that shows who is "the dealer" for that hand. In a casino a house dealer deals, but the button still defines positions and acts as if that seat dealt. (*Wikipedia: Texas hold 'em*; *PokerStars School*.)
- The button **moves one seat clockwise after every hand**, so over a full orbit each player rotates through every position — including paying the blinds. (*PokerStars Learn: Position*; *PokerNews: Positions*.)

### The blinds (forced bets)
- Hold'em uses two **forced bets** posted *before* any cards are dealt: the **small blind (SB)** by the player immediately left of the button, and the **big blind (BB)** by the next player left. (*Wikipedia: Texas hold 'em*; *Pokerfuse*; *The Lodge*.)
- The **small blind is usually half the big blind**, and the **big blind equals the minimum bet** for the first round. (*Wikipedia: Texas hold 'em*; *PokerStars School*.)
- **Why blinds exist (beginner framing):** they seed the pot and force action — without them every player could fold for free forever and nothing would happen. Blinds guarantee there is always something to play for. (*PokerStars School*; *Pokerfuse*.)
- Blinds are **"live"**: the SB and BB count toward what those players owe. Preflop, if no one raises, the BB has already "paid" the bet and can simply **check** (the BB's "option"). (*Wikipedia: Texas hold 'em*; *Wikipedia: Betting in poker* line on the "option".)

### The deal
- Each player is dealt **2 private "hole" cards** face down (dealt one at a time, SB gets the first card, button gets the last). (*Wikipedia: Texas hold 'em*.)
- Before the flop, turn, and river, the dealer **"burns" the top card** (discards it face down) so no one can read a marked back. Beginner-optional detail, but it's why you may see a card set aside. (*Wikipedia: Texas hold 'em*.)

---

## 2. The four streets + showdown (and how each betting round opens/closes)

Texas Hold'em has **four betting rounds** ("streets"), then a showdown if needed. Every reputable source agrees on this sequence: **preflop → flop → turn → river → showdown.** (*Wikipedia*; *PokerNews*; *Pokerfuse*; *PokerStars School*; *nlh.poker*.)

| Street | Community cards shown | Cards on board after | First to act | Last to act |
| --- | --- | --- | --- | --- |
| **Preflop** | none (hole cards only) | 0 | **UTG** = player left of the BB | the **big blind** |
| **Flop** | 3 cards at once | 3 | first active player **left of the button** (the SB if still in) | the **button** |
| **Turn** | 1 card | 4 | same as flop | the **button** |
| **River** | 1 card | 5 | same as flop | the **button** |
| **Showdown** | — | 5 | (reveal order, see §5) | — |

Sources for the action order: *Wikipedia: Texas hold 'em* ("This and all subsequent betting rounds begin with the player to the dealer's left"); *Pokerfuse* table; *The Lodge* ("UTG always acts first preflop"; "postflop action begins with the SB if still in"); *PokerNews*.

### How a betting round OPENS
- A round **opens** when the first voluntary bet is made ("opening the round"). (*Wikipedia: Betting in poker*.)
- **Preflop is special:** the **big blind is a live bet that already opens the round**, so the first player to act (UTG) is already "facing a bet" and cannot check — they must **call, raise, or fold**. (*Wikipedia: Betting in poker*; *PokerStars School*: "You can only check pre-flop if you are in the big blind and no one else has raised.")
- **Postflop**, no one has bet yet, so the first player may **check or bet**. (*Pokerfuse*; *PokerNews*.)

### How a betting round CLOSES
- A round **closes when every still-active player has either matched the largest wager ("the bet is good") or folded** — i.e., everyone has had a turn and all remaining players have put in equal money. (*Wikipedia: Texas hold 'em*: "A round of betting continues until every player has folded, put in all of their chips, or matched the amount put in by all other active players"; *PokerStars School*; *Wikipedia: Betting in poker*.)
- If **everyone checks**, the round also closes (a "free" card; no money added). (*Wikipedia: Betting in poker*.)
- **Preflop BB option:** if action returns to the BB with no raise, the BB may **check (close the round) or raise (reopen it)**. This "option" happens only once. (*Wikipedia: Betting in poker*; *PokerStars School*.)
- After a round closes, if **two or more players remain**, the next street's card(s) are dealt; if **only one player remains** (all others folded), the hand **ends immediately** and that player wins the pot **without a showdown** and **without showing cards**. (*PokerNews*; *Wikipedia: Texas hold 'em*.)

---

## 3. Betting actions (what each means + when it's legal)

The five core actions (plus re-raise and all-in, which the user asked about):

| Action | Plain meaning | When it's legal |
| --- | --- | --- |
| **Check** | Decline to bet but stay in; pass the action along | Only when **no bet faces you** this round (e.g., postflop if no one has bet, or BB preflop with no raise). (*Wikipedia: Betting in poker*.) |
| **Bet** | Put the first chips into the pot this round | Only when **no one has bet yet** this round ("opening"). (*Wikipedia: Betting in poker*.) |
| **Call** | Match the current highest bet to stay in | When a **bet faces you**. (*Wikipedia*; *Pokerfuse*.) |
| **Raise** | Increase the current bet (must meet the min-raise, see below) | When a **bet faces you**. (*Wikipedia: Betting in poker*.) |
| **Re-raise** | A raise of a raise — the 2nd (or later) raise in the same round | When a **raise faces you**. (*Wikipedia: Betting in poker*: "A player making the second…or subsequent raise of a betting round is said to re-raise.") |
| **Fold** | Surrender your cards and any claim to the pot | Any time it's your turn (you almost always only do this when **facing a bet**; folding when you could check free is a mistake). (*Wikipedia*; design-doc note is correct.) |
| **All-in** | Bet **all your remaining chips** | Any time you'd otherwise bet/call/raise but lack the chips, or by choice in no-limit. (*Wikipedia: Betting in poker*; *PokerStars rules*.) |

**Bonus term (optional for our course): check-raise** = checking, then raising after an opponent bets in the same round. Legal and common; can confuse beginners, so introduce only if useful. (*Wikipedia: Betting in poker*.)

### Minimum raise (no-limit) — and a key beginner misconception
- **Rule:** a raise must be **at least the size of the previous bet or raise** (the *increment*), and you can go as high as all your chips. (*Wikipedia: Texas hold 'em*; *Wikipedia: Betting in poker*; *PokerStars rules*; *poker.stackexchange/TDA*.)
- **Re-raise:** must increase by **at least the size of the last raise increment**. *Wikipedia worked example:* BB = $2; someone raises to $8 (a $6 increment); a re-raise must be **at least $6 more, to $14**. (*Wikipedia: Texas hold 'em*.)
- **Misconception to correct:** "a raise must double the bet." Not true. The *to* amount equals double **only when you raise the opening bet** (because the increment equals that first bet). Facing a $10 bet, the min raise is **to $20** (increment $10); but facing a raise *to* $8 over a $2 bet, the next min raise is **to $14**, not $16. Teach "min raise = current bet + last increment." (*Wikipedia: Betting in poker* example.)
- **Min opening bet** postflop is normally the size of the big blind. (*Wikipedia: Betting in poker*.)

### All-in basics (beginner level)
- Going **all-in** = betting every chip you have left. You can't be forced out of a hand for lack of chips — "table stakes" means you only risk what's in front of you. (*Wikipedia: Betting in poker*; *PokerStars rules*.)
- **Heads-up (you + one opponent):** if you're all-in and called, the hand simply runs out the remaining cards to showdown — no more betting. (*Wikipedia: Betting in poker*.)
- **Side pots (multiway):** if you're all-in for *less* than others, your chips (and a matching amount from each opponent) form the **main pot** that you can win; extra chips the others keep betting go into a **side pot** that **you cannot win**. (*Wikipedia: Betting in poker*; *PokerStars rules*; *PokerTube: All-in*.) → *Side pots are likely too deep for a first beginner pass; mention only as "if you're all-in for less, you can only win the part you matched."*
- **Short all-in & reopening:** an all-in **smaller than a full raise does not reopen the betting** for players who already acted — they can only call or fold (the betting reopens only if someone makes a full legal raise). This is a real no-limit rule but **out of scope for beginners**; note it for the AI/engine, not the lessons. (*Wikipedia: Betting in poker*; *PokerStars rules*; *Card Player / WSOP Rule 96*.)

---

## 4. Pot mechanics & bet sizing intuition

### Pot mechanics
- The **pot** is all the chips wagered in the hand: blinds + every bet/call/raise across all four streets. (*Wikipedia: Texas hold 'em*.)
- Each street, players' wagers are gathered into the pot once the round closes. The **winner takes the whole pot** (or it's split on a tie — see §5). (*Wikipedia*; *PokerStars School*.)
- You can only win chips you could be matched on (table stakes); this is why side pots exist when stacks differ and someone is all-in. (*Wikipedia: Betting in poker*.)

### Bet sizing in fractions of the pot (the standard mental model)
Modern players size bets as a **fraction of the pot**. Cross-checked "default" ladder (*Upswing*; *PokerCoaching*; *Deucescracked*; *Deepfold*):

| Size | % of pot | Typical use (beginner gloss) |
| --- | --- | --- |
| Small / "block" | ~25–33% | Dry, unconnected boards; cheap, bets your whole range |
| Medium ("workhorse") | ~50–66% | The everyday default; good for value + charging draws |
| Large | ~75–100% | Wet, draw-heavy boards; charge draws, build big pots with strong hands |
| Overbet | >100% | Advanced; only with a big "nut" advantage |

Beginner-friendly intuition (verified, in our words):
1. **Half-pot is the safe default** — when unsure, bet about half the pot. (*GTO Gecko*; *Upswing*.)
2. **Size to the board and your purpose, not to your hand's strength.** Betting big with strong hands and small with weak ones *tells opponents what you have*. Use the same size for value bets and bluffs in a given spot. (*Upswing*; *PokerLog*; *nlh.poker*.)
3. **Smaller on "dry" boards, bigger on "wet" boards.** Dry = few draws possible (e.g., K‑7‑2 rainbow) → ~1/3 pot. Wet = many draws (e.g., T‑9‑8 two‑tone) → ~2/3 to pot. (*Upswing*; *PokerCoaching*; *Deepfold*.)
4. **Don't make pointless tiny bets** like 1 chip into a big pot — too small to make anyone fold, too small to build value. (*PokerOffer*; *nlh.poker*.)
5. **Preflop opens** are usually about **2.5–3× the big blind**. (*nlh.poker*; *RiverOdds*.)

### Sizing ↔ price you lay (ties bet sizing to pot odds — useful for L5/L4 bridge)
A bet of fraction **b** of the pot gives the *caller* these break-even numbers:

- **Caller's required equity** = `b / (1 + 2b)` → quarter-pot **16.7%**, half-pot **25%**, two-thirds **28.6%**, pot **33.3%**. (*PokerNews: pot odds*; *RiverOdds*; matches design-doc §3.5 table — verified correct.)
- **Bettor's bluff break-even** (how often a bluff must work) = `b / (b + 1)` → half-pot **33%**, pot **50%**, 1.5× pot **60%**. (*GTO Gecko*.)

> The two formulas are different perspectives: `b/(1+2b)` is what the **caller** needs; `b/(b+1)` is what a **bluff** needs to succeed. Don't conflate them.

---

## 5. Showdown rules (reveal order, best hand, split pots)

### When a showdown happens
- If **all but one player fold**, no showdown — last player standing wins and need not show. (*Wikipedia*; *PokerNews*.)
- If **two or more players remain after the river betting closes**, there's a **showdown**: players reveal hole cards and the **best 5-card hand (from each player's 2 hole + 5 community) wins the pot.** (*Wikipedia*; *Pokerfuse*; *PokerStars School*.)

### Who shows first (the part the design doc is missing)
The standard procedural rule, confirmed by two sources:
- **If there was betting on the river:** the **last player to bet or raise** (the "aggressor") shows first; others reveal in clockwise order (and may muck if they can't win). (*PokerNews*; *nlh.poker*.)
- **If the river was checked around (no bet):** the **first active player to the left of the button** shows first. (*PokerNews*: "the player closest to the dealer's left reveals first.")

> *House rules vary slightly on the checked-down case (some cardrooms vary the seat), but "last aggressor shows first; otherwise first player left of the button" is the most widely used convention. For our app we can simply enforce one consistent rule. (*PokerNews*; *nlh.poker*.)*

### Ties, split pots, and odd chips
- If the best hands are **identical in rank** (suits never matter), the pot is **split equally** ("chop"). (*Wikipedia: Texas hold 'em*; *PokerStars School*: "only the best hand always wins"; ties split.)
- Any **odd, indivisible chip** goes to the **first player clockwise from the button**. (*Wikipedia: Texas hold 'em*: "any extra chips going to the first players after the button in clockwise order.")
- **"Playing the board":** if the 5 community cards are your best hand and you can't beat them with your hole cards, the best you can do is split (everyone shares the same board). (*Wikipedia: Texas hold 'em*.)

---

## 6. Positions for beginners & why position matters

The button moves each hand, so seats are described **relative to the button**. Simplified beginner buckets (cross-checked across *PokerStars Learn*, *PokerStars School PDF*, *PokerNews*, *CardPlayer*, *PokerScout*):

| Bucket | Seats | One-line beginner takeaway |
| --- | --- | --- |
| **Early position (EP)** | the two blinds (SB, BB) + **UTG** (and UTG+1 at a full table) | Acts first / earliest; least information → play **tight** (premium hands). |
| **Middle position (MP)** | the seats between early and late | A bit more info → play **slightly wider**. |
| **Late position (LP)** | the **cutoff** (right of button) and the **button** (best seat) | Acts last postflop; most information → play **widest, most aggressively**; can steal blinds. |
| **The blinds** | SB & BB | Posted money + **out of position postflop** every street → tricky; defend selectively. |

> Note for authors: the blinds act *last preflop* but *first postflop*, which is why guides classify them as early/disadvantaged positions overall. (*PokerNews: Positions*.)

**Why position matters (the core idea, verified):** acting **later means you've already seen what opponents did**, so you make better-informed decisions, control the pot size, and can bluff or take free cards more effectively. The button is the single best seat because it acts **last on every postflop street**. (*PokerStars Learn*; *Wikipedia: Texas hold 'em* Strategy: "Players who act later have more information than players who act earlier"; *PokerScout*; *CardPlayer*.)

**Beginner heuristic:** play **more hands in late position, fewer in early position** — every source repeats this. (*PokerStars School*; *PokerNews*; *CardPlayer*.)

---

## 7. Anatomy of a hand — step-by-step walkthrough

A concrete 4-player, no-limit example, blinds **$1/$2**, each started with **$200**. (Structure mirrors the *Wikipedia: Texas hold 'em* "sample hand"; rewritten in our own words.) Seats clockwise: **Dora = button**, **Sam = small blind ($1)**, **Bea = big blind ($2)**, **Uri = UTG**.

1. **Post blinds.** Sam puts in $1 (SB), Bea puts in $2 (BB). **Pot = $3.** Nobody has cards yet.
2. **Deal hole cards.** Each player gets 2 face-down cards.
3. **Preflop betting** — opens left of the BB, with **Uri (UTG) first** because the $2 BB is a live bet he must answer:
   - Uri **folds** (can't check — he faces the $2).
   - Dora (button) **calls $2**.
   - Sam (SB) completes: he already has $1 in, adds **$1** to make $2 → **calls**.
   - Bea (BB) has the **option**; with no raise she **checks**. Round closes. **Pot = $6** ($2 × 3).
4. **Flop** — burn, then 3 community cards, e.g. **9♣ K♣ 3♥**. Postflop, action starts **left of the button** (Sam first), button (Dora) **last**:
   - Sam **checks**, Bea **bets $2**, Dora **raises to $4**, Sam **folds**, Bea **calls $2** more.
   - Round closes. **Pot = $6 + ($4 + $4) = $14.**
5. **Turn** — burn, then the 4th card, e.g. **5♠.** Bea **checks**, Dora **checks** → checked around (free card). **Pot stays $14.**
6. **River** — burn, then the 5th card, e.g. **9♦.** Final board **9♣ K♣ 3♥ 5♠ 9♦.** Bea **bets $6**, Dora **calls $6**. Round closes. **Pot = $26.**
7. **Showdown** — Bea was the **last aggressor** (bet the river), so **Bea shows first**. Best 5-card hands are compared; **highest hand wins the $26 pot** (ties would split, odd chip to first seat left of button).

**Key beats to emphasize when teaching:** (a) blinds force action before cards; (b) preflop starts left of the BB, postflop starts left of the button; (c) the button always acts last postflop = positional power; (d) a round ends only when everyone has matched or folded; (e) a checked-around street adds no chips; (f) at showdown the last bettor shows first and the best 5-card hand takes the pot.

---

## 8. Common beginner mistakes (betting & flow) + how to explain a round clearly

Cross-checked across *PokerLog*, *nlh.poker*, *RiverOdds*, *PokerOffer*, *Upswing*:

| Mistake | Why it's bad | Beginner fix |
| --- | --- | --- |
| **Folding when you could check for free** | You give up a hand you could keep for $0 and lose the chance to improve. | If no one has bet, **check, never fold**. (Design doc already flags this — keep it.) |
| **Open-limping** (just calling the BB to enter) | Only one way to win (showdown); invites cheap multiway pots. | When first to enter, **raise or fold** — not call. |
| **Being a "calling station"** (calling with no plan) | Bleeds chips calling without the right price. | Call **for a reason**; compare your equity to **pot odds** (ties to Lesson 4). |
| **Telegraphing with bet size** (big = strong, small = weak) | Observant opponents read you instantly. | Use the **same size for value and bluffs** in a spot; size to the **board**, not your hand. |
| **Pointless tiny bets** (e.g., 1 BB into 20) | Too small to fold anyone out or build value. | Bet a **meaningful fraction** (½‑pot default). |
| **"A raise must double it" / min-raise confusion** | Leads to illegal or oversized raises. | Min raise = **current bet + last raise increment**. |
| **Ignoring position** | Playing weak hands out of position is costly. | Play **tighter early, looser late**; respect the button. |
| **Acting out of turn / losing track of the action** | Slows the game; gives away information. | Always know **whose turn it is** and **how much is to call**. |

### How to explain a betting round clearly (script for the lesson UI)
A clean way to narrate any round to a beginner — four questions, in order:
1. **"Is there a bet to me?"** → No: you may **check or bet**. Yes: you may **call, raise, or fold**.
2. **"How much to call?"** → the difference between the largest bet and what you've already put in this round.
3. **"What's my plan?"** → value (get called by worse), bluff (fold out better), or pot control (keep it cheap).
4. **"Has everyone matched or folded?"** → if yes, the round is **closed**; deal the next street or go to showdown.

This 4-question loop maps cleanly onto the `betting-round` interaction's `facing` / `task` config.

---

## 9. Discrepancies & gaps vs `docs/poker-course-design.md` (Lessons 3 & 5)

**Overall:** the design doc's core rules are **accurate** — no factual corrections required for §3.7/§3.8 as written. The following are **gaps, additions, and one imprecise example** to address.

### A. Corrections (should fix)

1. **Lesson 3, step p5 wording is imprecise.** The doc says:
   > *p5 … "Everyone folds to the button — does a showdown happen?" → choice = "no, button wins"*

   Preflop, if everyone folds **to** the button, the **SB and BB still have to act**, so the button does **not** automatically win. The hand only ends when **all but one player have folded**. **Fix:** reword to "**All other players fold, leaving one player → that player wins the pot with no showdown**," or set it explicitly postflop/heads-up. (Source: *Wikipedia*, *PokerNews* — pot is awarded only when one player remains.)

2. **`BettingAction` type omits `'all-in'`** (§5.5). The user explicitly wants all-in covered, and a no-limit capstone (`full-hand`, §5.6) needs it. **Fix:** add `'all-in'` to `BettingAction` (or model all-in as a bet/raise sized to `stack`), and have the AI/engine handle it. At minimum, mention all-in in Lesson 5.

### B. Gaps to add (user explicitly asked for these)

3. **Heads-up (2-player) blind/action exception is missing** from §3.8 and the lessons. With exactly two players the **button posts the small blind, acts FIRST preflop, and acts LAST postflop**. This matters because **L5 uses heads-up AI** and **L6 capstone supports `opponents: 1`**. **Fix:** add a one-line note in §3.8 and in the L5/L6 content (or in the `betting-round`/`full-hand` author notes). (Source: *Wikipedia: Texas hold 'em*; *Wikipedia: Betting in poker*.)

4. **Showdown reveal order ("who shows first") is missing** from §3.8 step 7 and from Lesson 3. **Fix:** add — *last player to bet/raise on the river shows first; if the river was checked around, the first active player left of the button shows first.* Good candidate for a Lesson 3 problem or skill-check question. (Source: *PokerNews*; *nlh.poker*.)

5. **Re-raise not defined** in §3.7 (user asked). **Fix:** add a row/line — *re-raise = a raise of a raise (2nd+ raise in a round); min re-raise = at least the last raise increment.* (Source: *Wikipedia: Betting in poker*; *Wikipedia: Texas hold 'em* $2→$8→$14 example.)

6. **Min-raise "doubling" misconception not addressed.** The §3.7 rule ("min-raise = at least the size of the last bet/raise") is **correct**, but beginners commonly think a raise must *double* the bet. **Fix:** add the clarification + the $2→$8→$14 worked example. (Source: *Wikipedia: Betting in poker*.)

### C. Enhancements (nice-to-have, improve teaching quality)

7. **Beginner bet-sizing intuition is thin.** §3.5 nails the *caller's required-equity* table (verified correct), and L5 p3 asks for a "half-pot value bet," but there's no **"why size this way"** guidance. **Fix:** add the small/medium/large ladder (≈⅓ dry, ≈½–⅔ default, ≈¾–pot wet) and the rule **"size to board texture & purpose, not to hand strength."** (Source: *Upswing*; *PokerCoaching*; *Deepfold*.)

8. **Blinds detail:** §3.8 step 1 doesn't state **SB ≈ ½ BB** and **BB = minimum bet**. Small, helpful add for Lesson 3 c1. (Source: *Wikipedia*; *PokerStars School*.)

9. **Pot/side-pot + odd-chip rules** aren't mentioned. For a beginner course this is fine to keep light, but **split-pot odd-chip → first seat left of button** and **all-in main vs side pot** are worth a one-liner in §3.8 / L6. (Source: *Wikipedia: Texas hold 'em*; *Wikipedia: Betting in poker*.)

10. **Burn card** is unmentioned (cosmetic). Optional flavor for the `board-dealer` animation. (Source: *Wikipedia: Texas hold 'em*.)

### D. Confirmed correct (no change needed)

- §3.7 action definitions and legality (check/bet/call/raise/fold) — **correct**.
- §3.7 min-raise rule ("at least the size of the last bet/raise") — **correct**.
- §3.7 round-close rule ("every active player has matched the largest bet or folded, or everyone checked") — **correct**.
- §3.7 "folding when you could check free is a mistake" — **correct and good pedagogy**.
- §3.8 preflop order (UTG first, BB last, BB may check if unraised) — **correct**.
- §3.8 postflop order (first active player left of button = SB first; button last) — **correct** (the doc even correctly notes "SB first").
- §3.8 streets (preflop / flop 3 / turn 1 / river 1 / showdown) — **correct**.
- §3.8 "position matters: acting later is an advantage" — **correct**.
- §3.5 required-equity-by-bet-size table (¼→16.7%, ½→25%, ⅔→28.6%, pot→33.3%) — **correct**.
- Lesson 3 skill check (order streets / best hand by street / who acts last postflop) — **valid**.

---

## 10. Sources (all reputable, public; cross-checked ≥ 2 per fact)

**Encyclopedic / rules:**
- Wikipedia — *Texas hold 'em*: https://en.wikipedia.org/wiki/Texas_hold_%27em
- Wikipedia — *Betting in poker* (actions, min-raise, all-in, side pots, blinds, the "option"): https://en.wikipedia.org/wiki/Betting_in_poker

**Poker schools / how-to (rules, streets, action order, showdown):**
- PokerNews — *How to Play Texas Hold'em for Beginners*: https://www.pokernews.com/poker-rules/texas-holdem.htm
- PokerNews — *Ultimate Poker Cheat Sheet* (showdown reveal order): https://www.pokernews.com/poker-cheat-sheet.htm
- PokerStars School — *Beginner's Guide to Poker* (PDF): https://cmsstorage.rationalcdn.com/assets/ps/assets/pdf/pokerstars-school-beginners-guide-to-poker.pdf
- Pokerfuse — *How to Play Texas Hold'em* (streets + action-start table): https://pokerfuse.com/learn-poker/how-to-play/texas-holdem/
- nlh.poker — *Texas Hold'em Rules Step by Step* (streets, showdown order): https://nlh.poker/articles/texas-holdem-rules-en
- The Lodge Poker Club — *Who Bets First in Poker* (preflop vs postflop order): https://thelodgepokerclub.com/who-bets-first-in-poker/

**Positions:**
- PokerStars Learn — *Poker Positions Explained*: https://www.pokerstars.com/poker/learn/lesson/position/
- PokerNews — *The Importance of Position*: https://www.pokernews.com/strategy/10-hold-em-tips-08-25417.htm
- CardPlayer — *Poker Positions Guide*: https://www.cardplayer.com/rules-of-poker/how-to-play-poker/poker-positions
- PokerScout — *Poker Positions Explained*: https://www.pokerscout.com/guides/poker-positions/

**Bet sizing:**
- Upswing Poker — *Bet Sizing Strategy: 8 Rules*: https://upswingpoker.com/bet-size-strategy-tips-rules/
- PokerCoaching — *Poker Bet Sizing Strategy*: https://pokercoaching.com/blog/bet-sizing-tips/
- Deepfold — *Postflop Bet Sizing*: https://deepfold.co/en/blog/postflop-bet-sizing-guide
- GTO Gecko — *Poker Bet Sizing* (bluff break-even math): https://gtogecko.com/blog/poker-bet-sizing-strategy

**Pot odds / min-raise / all-in detail:**
- PokerNews — *How to Calculate Pot Odds*: https://www.pokernews.com/strategy/how-to-calculate-pot-odds-42847.htm
- PokerStars — *Poker rules for side pots and betting*: https://www.pokerstars.gr/en/help/articles/poker-rules-master/
- Card Player — *When Is a Raise Not a Raise?* (WSOP Rule 96 / short all-in reopening): https://www.cardplayer.com/cardplayer-poker-magazines/66494-alex-foxen-35-16/articles/24589-contracts-and-poker-when-is-a-raise-not-a-raise

**Common beginner mistakes:**
- PokerLog — *10 Beginner Poker Mistakes*: https://pokerlog.app/poker-guides/beginner-mistakes
- nlh.poker — *10 Texas Hold'em Beginner Mistakes*: https://nlh.poker/articles/beginner-mistakes-en
- RiverOdds — *10 Common Poker Mistakes*: https://riverodds.app/common-poker-mistakes/
- The Poker Offer — *15 Texas Hold'em Mistakes*: https://thepokeroffer.com/15-common-texas-holdem-mistakes/
