# Research Notes 04 — Pedagogy & Strategy (Beginner Texas Hold'em)

**Purpose:** Web-researched, cross-checked findings to sanity-check the "Suited" beginner course (see `docs/poker-course-design.md`), focused on Lesson 6 (capstone / starting-hand strategy) plus overall teaching clarity and a responsible-play note.

**Method:** Reputable sources only (PokerStars Learn/School, Upswing Poker, PokerNews, PokerCoaching, plus NCPG and GamCare for the safety note). Each major claim cross-checked against ≥2 sources. All wording is paraphrased in our own words; URLs listed in the Sources section. No copyrighted text copied.

**Audience reminder:** college students, zero prior poker knowledge. Play-money / learning only — no real wagering.

---

## 1. Recommended beginner teaching order — and how ours compares

### What reputable sources teach, and in what order

There is strong agreement across sources on the order a beginner should learn Texas Hold'em. Synthesizing them:

1. **The deck + the goal of the game** — 52 cards; you make the best five-card hand from your 2 hole cards + 5 shared community cards.
2. **Hand rankings** — what beats what (high card → royal flush), taught as a fixed rule, motivated by "rarer = stronger."
3. **Flow of a hand + the 5 betting actions** — blinds, the four streets (preflop/flop/turn/river), showdown, and the actions check / bet / call / raise / fold. Most sources treat the five actions as part of "the rules," introduced very early.
4. **Position** — acting later (closer to the button) is an advantage because you see opponents act first; play tighter early, looser late.
5. **Starting-hand selection (by position)** — which two cards to play from each seat. Repeatedly called the single most important early *strategy* skill for beginners.
6. **Basic math: outs, equity (rule of 2 & 4), pot odds** — deciding whether a call is profitable.

Representative orderings we cross-checked:

- **PokerStars "Basics" course / beginners guide PDF:** Rules & betting rounds → Hand Rankings → Starting Hands → Positions → Purposes of Betting → Bet Sizing → (then game selection, bankroll). Note hand rankings and starting hands come *before* deep betting/math.
- **PokerCoaching "How to Learn Poker" (step-by-step plan):** states the order explicitly — "hand rankings, position and the advantage of acting last, starting hand selection from each position, and pot odds," then preflop ranges, c-betting, bankroll. Calls these "the majority of decisions you will face in your first 100 hours."
- **SeekerStart 5-step roadmap:** (1) Rules — hand rankings, game flow, positions, actions; (2) Play basics — which hands to play, reading the flop, betting; (3) Probability; (4) Concepts (IP/OOP, board texture, c-bets); (5) Math (pot odds, outs, equity).
- **DeucesCracked beginner checklist:** memorize hand rankings → understand the blinds → learn the 5 actions → play tight in early position, with a dedicated starting-hand guide.

**Consensus takeaway:** rules + rankings first, then *flow/actions + position + starting hands* as the core strategy layer, then *math* (pot odds/outs). Starting-hand selection is universally treated as a **foundational, early, heavily-emphasized** skill — not an afterthought.

### How our 6-lesson sequence compares

Our sequence (from the design doc): **L1 deck/goal → L2 hand rankings → L3 flow (blinds, streets, position, showdown, action order) → L4 outs/odds/pot odds → L5 betting (actions, sizing, EV) → L6 full hand + starting hands.**

| Concept | Reputable order | Our course | Verdict |
| --- | --- | --- | --- |
| Deck + goal | 1st | L1 | Matches |
| Hand rankings | 2nd | L2 | Matches |
| Flow of a hand (blinds/streets/showdown) | early (part of rules) | L3 | Matches |
| Position | early (taught right after flow) | L3 | **Matches — good.** Position early is best practice. |
| The 5 betting actions (check/bet/call/raise/fold) | early (part of the rules) | L5 (formal), referenced earlier in L3/L4 | **Mild mismatch** — see §6. Most sources teach the actions as foundational rules *before* any math. |
| Outs / equity / pot odds (math) | after rankings, position, starting hands | L4 (before betting L5) | Defensible for our scope, but it lands the math *before* the formal actions lesson. |
| Starting-hand selection | foundational, early (≈3rd strategy topic) | L6 only (one concept + one problem) | **Biggest mismatch** — see §6. We defer the most-emphasized beginner skill to the final lesson, then immediately test it in the capstone. |

**Bottom line:** the spine of our sequence (deck → rankings → flow/position → math → betting → full hand) is well-aligned with how reputable schools teach beginners, and putting **position in L3 is a genuine strength**. The two things that diverge from best practice are (a) **starting-hand strategy being deferred to L6**, and (b) **formal betting actions (L5) coming after the pot-odds math (L4)** that already uses "call/fold." Both are addressed in §6.

---

## 2. Beginner starting-hand basics (simple, teachable level)

The goal for a first-timer is **not** to memorize charts. It is to internalize a few intuitions. Cross-checked across Upswing, PokerNews, PokerCoaching, and BlackRain79:

### 2.1 The one-sentence philosophy
**Play few hands, and play them aggressively (raise rather than just call).** Beginners should fold the large majority of hands they're dealt. A common rule of thumb: play only roughly the **top ~15–20% of starting hands** overall (folding ~80%+ preflop).

### 2.2 What a "strong" starting hand looks like (plain categories)
Teach four buckets of generally-playable hands, in rough order of how premium they are:

- **Big pocket pairs** — AA, KK, QQ (and JJ, TT). The strongest holdings; raise these from anywhere.
- **Big "Broadway" cards** — two high cards that can make the best top pairs/straights, e.g. AK, AQ, AJ, KQ. AK and AQ are premium.
- **Suited aces / suited Broadways** — e.g. AKs, AQs, KQs, KJs, QJs (the small "s" = same suit, giving flush potential).
- **Suited connectors** — consecutive same-suit cards like JTs, T9s, 98s; speculative hands that can flop straights/flushes, best played in late position.

Plain definitions to front-load for beginners: **"suited" = both cards the same suit; "offsuit" = different suits; "connectors" = ranks next to each other; "pocket pair" = your two hole cards are the same rank; "Broadway" = ten through ace.**

### 2.3 The "premium hands" a beginner should recognize instantly
Across sources, the universally-cited premium tier is **AA, KK, QQ, AK** (often AQ and JJ too). These are raise-first-in from any position and can stand up to re-raises.

### 2.4 Position changes everything (the key beginner adjustment)
The single most impactful beginner habit: **play tighter in early position, looser in late position.**
- **Early position** (first to act, "under the gun"): only premium/strong hands.
- **Middle position:** add strong but non-premium hands (e.g. TT, AQ, suited Broadways).
- **Late position (cutoff/button):** widen considerably — the button is the most profitable seat because you act last on every postflop street.
- **Blinds:** you'll be out of position after the flop, so be cautious.

Concrete percentages from solver-backed sources (for our reference, not to teach verbatim): UTG opens ≈ 13–15% of hands; button opens ≈ 40–50%. We do **not** need to teach numbers — just the directional rule "tighter early, looser late."

### 2.5 Why this matters (the reasons to give learners)
- **Most hands miss most flops** (you miss roughly two-thirds of flops), and you pay to see every flop — so weak hands bleed chips.
- **Domination / kickers:** weak aces like A6 are dominated by better aces (AK, AQ) and lose a big pot when an ace flops. Strong kickers keep you on the right side of these clashes.
- **Position = information:** acting last lets you see what others do, control the pot size, and bet/bluff more effectively.

### 2.6 Teachable scope for our course (what NOT to overwhelm them with)
Keep it to: (1) the four buckets above, (2) recognize the premium tier (AA/KK/QQ/AK), (3) "tighter early, looser late," (4) "raise don't limp," (5) fold the junk. **Avoid** full 13×13 range charts, 3-bet/4-bet ranges, exact percentages, and implied odds — these are post-beginner topics and would violate the "one idea per step / no overwhelm" design rule.

---

## 3. Simple, sound opponent-AI heuristics (realistic but teachable)

Our design (design doc §5.6) defines three AI tiers. Research strongly supports a **rule-based, explainable** approach and confirms the archetypes are realistic and pedagogically useful.

### 3.1 The TAG (tight-aggressive) reference model — what "good basic play" is
"Tight-aggressive" (TAG) is the style nearly every source recommends as the beginner default and the model for a competent-but-simple opponent. Its heuristics:
- **Tight:** plays few hands (~15–20%), folds ~80%+ preflop, focuses on strong starting hands.
- **Aggressive:** when it plays, it **bets and raises** rather than calls; it **value-bets strong hands** and **continuation-bets (c-bets)** most flops as the preflop raiser.
- **Positional:** plays more hands in late position; tightens up early.
- **Low-bluff vs weak fields:** against players who rarely fold, it minimizes bluffs and just value-bets relentlessly.
- **Avoids slowplaying:** builds the pot with strong hands instead of trapping.

This maps cleanly onto a teachable decision rule: *estimate hand strength → if strong, bet/raise for value (~½–⅔ pot); if drawing, use pot odds to call or fold; if weak, check/fold; bluff only occasionally and only when the opponent can fold.*

### 3.2 The "calling station" archetype — a great teaching foil
A **loose-passive "calling station"** (calls too much, rarely raises, hates folding, chases draws, gets attached to weak hands) is an extremely common real-world recreational type. As a Tier-1 opponent it is pedagogically ideal because it teaches the most important beginner lesson by example: **value-bet your strong hands and DON'T bluff a player who won't fold.** Our design's Tier-1 ("calling station: never bluffs, never folds a made pair, calls with any draw, only bets very strong hands") is realistic and well-chosen.

### 3.3 Mapping research → our three tiers
| Tier | Our design | Research check |
| --- | --- | --- |
| **Tier 1 — Calling station** | Transparent, never bluffs/folds, calls draws, bets only the nuts | **Sound.** Accurate model of a loose-passive rec; transparent and easy to read; rewards value-betting (the key beginner skill). |
| **Tier 2 — Pot-odds-aware TAG** | Estimates strength + draw equity, calls when equity ≥ required, value-bets ~⅔ pot, folds weak to big bets, ~10% seeded bluff | **Sound and well-aligned with the TAG model.** ~⅔-pot value bets and frequent c-betting match best-practice TAG. The small seeded bluff frequency is realistic and keeps it from being fully exploitable. |
| **Tier 3 — Multiway, position-aware** | Tier-2 logic + tighter ranges multiway, position-aware aggression, varied per-seat thresholds, occasional bluff | **Sound.** "Tighten ranges in multiway pots" and "use position" are exactly what sources advise; varied seat tendencies (one tighter, one looser) create realistic, teachable table dynamics. |

### 3.4 Notes / refinements for realism + teachability
- **Keep it deterministic & seeded** (as designed). Rule-based logic is explainable to the learner ("the AI folded because it didn't have the odds"), which a black-box/ML bot could not be. This matches the app's "no opaque AI" principle.
- **A simple, sound strength estimate** for the AI: made-hand category from the evaluator + draw equity via outs × (2 or 4). That's enough to drive believable value-bet / call / fold decisions without a solver.
- **Don't over-bluff the lower tiers.** Research is emphatic that good basic play *under*-bluffs weak opponents. Reserve meaningful bluffing for Tier 2/3 and keep it rare so beginners learn "mostly value" first.
- **Teachable transparency option:** for early lessons, consider letting the AI's reason surface in the "Why?" explanation (e.g., "Villain called: a flush draw had enough pot odds"). This turns the opponent into a teaching device.

---

## 4. Most common beginner misconceptions (and how good courses address them)

Cross-checked across Pokerology, PokerNews, Card Player, Harrington Casino, and BlackRain79.

| # | Misconception | Reality | How good courses address it |
| --- | --- | --- | --- |
| 1 | **"I should play most of my hands."** (Playing too many hands, especially weak/junky ones and out of position.) | Most hands are unprofitable; most miss the flop, and you pay to see every flop. | Teach starting-hand discipline early; normalize folding; frame folding as a skill, not weakness. |
| 2 | **"Poker is mostly luck."** | Luck dominates a single hand, but **skill dominates over the long run**; edges come from better decisions repeated over many hands. | Emphasize long-run thinking and decision quality over single-hand results ("you can play well and still lose a hand"). |
| 3 | **"Good cards (or bluffing a lot) is how you win."** | The bulk of winnings come from **value-betting strong hands**, not flashy bluffs. Over-bluffing — especially vs players who won't fold — loses money. | Teach value betting first; teach that bluffs only work against opponents who can fold. |
| 4 | **"Bigger starting cards always win"** / overvaluing top pair. | Top pair, weak aces (A6), and "any ace/face card" are often dominated or beaten in multiway pots. | Teach kickers and domination; teach board reading and that hand strength is *relative*. |
| 5 | **"I have to defend / I can't fold now that I've put money in."** (Chasing draws without odds; calling too many river bets; sunk-cost calling.) | Money already in the pot isn't yours; call only when **pot odds** justify it. | Teach pot odds and outs as the call/fold tool; "chips in the pot are not yours." |
| 6 | **"Position doesn't matter much."** | Position is one of the biggest edges; acting last is worth real money. | Teach position early and revisit it in every later topic. |
| 7 | **"Monsters under the bed" — any aggression means they have the nuts** (over-folding from fear). | Opponents are frequently weak or semi-bluffing; reflexively folding is exploitable. | Encourage reasoning from ranges/odds rather than fear. |
| 8 | **Missizing bets** (min-raising, or massively overbetting "to find out where I'm at"). | Bet sizing should have a purpose (value or fold equity), tied to the pot. | Teach pot-fraction sizing and the purpose of each bet. |
| 9 | **Letting emotions / tilt drive decisions.** | Emotional play causes irrational, costly moves. | Acknowledge tilt; encourage breaks; (in a learning app, this dovetails with the responsible-play note). |

**How this informs our course:** Our design already counters the biggest ones — discipline/folding (starting hands), pot odds (L4), value betting and bet purpose (L5), and position (L3). The two we should make sure to *explicitly* name as misconceptions (cheap wins for clarity): **"poker is all luck"** (frame the long-run/skill point, ties neatly to the responsible-play note) and **"bluffing is how you win"** (front-load value betting). A one-line myth-buster in the relevant concept step is enough.

---

## 5. Responsible-play note (proposed wording)

### 5.1 Research basis
- **NCPG (US, National Council on Problem Gambling):** operates the free, confidential, 24/7 **National Problem Gambling Helpline**, covering all 50 states. Reachable by call/text/chat. The long-standing number **1-800-GAMBLER** remains active; NCPG has also adopted **1-800-MY-RESET** as a newer, non-stigmatizing number (chat at 1800gamblerchat.org). NCPG is neutral on legalized gambling and focuses on harm reduction. Since our audience is US college students, NCPG/1-800-GAMBLER is the natural primary resource.
- **GamCare (UK):** runs the **National Gambling Helpline (0808 80 20 133)**, free and 24/7. Core consumer advice: set time and money limits, know the odds, don't gamble to make money or escape debt, and use self-exclusion/blocking tools if needed. Useful as a secondary/international reference.

### 5.2 Tone guidance (from the design doc + sources)
Matter-of-fact, **non-preachy**, brief (2–3 sentences), one neutral resource line. Frame poker as a skill/odds game; note that real-money gambling carries financial risk and that the house edge / rake means the player pool loses money over time; point to help without moralizing.

### 5.3 Proposed blurb (primary — US-oriented)
> **You just played real poker — for zero real money, which is exactly the point.** Poker is a game of skill and odds, but **real-money gambling carries genuine financial risk**: the house's rake (and stronger players) mean most people lose over time, and chasing losses can become a problem. Keep it fun and play-money here — and if gambling ever stops feeling like a game, free, confidential help is available 24/7 at **1-800-GAMBLER** (US).

### 5.4 Alternate blurbs
**(b) Shorter / lighter:**
> Everything in this course is **play-money — no real wagering, ever.** Real-money gambling isn't a way to make money: the house edge means the field loses over the long run, and it can become harmful. If it ever stops being fun, free 24/7 help is at **1-800-GAMBLER**.

**(c) Internationally-flexible:**
> The chips here are for learning only — **no real money is involved.** Poker rewards skill, but real-money gambling carries real financial risk and can become a problem for some people. If you or someone you know needs support, confidential help is available (US: **1-800-GAMBLER**; UK: **GamCare, 0808 80 20 133**).

**Recommendation:** use **(a)** at the end of Lesson 6's capstone (it ties the skill framing to the misconception "poker is all luck/easy money"), and keep a one-line resource link in the app footer/about for persistence.

---

## 6. Discrepancies & improvements vs. the design doc

### 6.1 What the design gets RIGHT (keep as-is)
- **Position taught early (L3).** Matches best practice exactly; many beginners learn this too late.
- **"Rarer = stronger" framing for rankings (L2)**, taught as a fixed rule with the 5-card frequency table for motivation — pedagogically sound and accurate. The §3.2 note that 7-card frequencies differ but the ranking *order* is a fixed rule is exactly right.
- **AI tiers (calling station → TAG → multiway).** Realistic, explainable, well-sequenced; the calling-station foil is a smart choice for teaching value betting.
- **Responsible-play intent** (brief, non-preachy, skill/odds framing, house-edge honesty). The §1 claim that "the house/rake means most players lose over time" is accurate.
- **Kickers/domination, outs, pot odds, EV** are all covered and numerically correct (spot-checked: flush draw = 9 outs, rule of 2 & 4, required equity = call/(pot+call), pot-sized bet → 33%).
- **L6 starting-hand example** (A♠K♠ vs 7♦2♣) is well-chosen: 72o is famously the worst hand, AKs is premium.

### 6.2 Improvement #1 (highest priority): introduce starting-hand strategy earlier
**Issue.** Every reputable source treats starting-hand selection as a **foundational, early, heavily-weighted** skill (≈3rd strategy topic, right after rankings and position). Our design introduces it for the first time in **L6** as a single concept step (`c1`) + one `compare-events` problem (`p1`), and then *immediately* asks the learner to apply preflop hand/position judgment in a heads-up full hand (`p2`) and a position-aware multiway capstone (`p3`). That is the most-emphasized beginner skill, taught last, and tested seconds later.

**Why it matters.** The capstone's AI is explicitly position- and range-aware ("tightens ranges multiway, uses position"). For the learner's preflop decisions to feel fair and learnable, the "play tight early / loose late, raise don't limp, fold junk" intuition needs to be grounded *before* L6.

**Recommendation (pick one, low-cost):**
- **Best:** add a short starting-hand segment to **L3** (where position is already introduced) — e.g., a concept "which two cards are worth playing, and how position changes that" + one `compare-events` problem ("from the button vs under the gun, is K♣9♣ a play?"). Position + starting hands are taught together in most curricula, so this is natural and removes a forward dependency.
- **Or:** add one starting-hand problem to **L5** (betting) so "what to play" and "how to bet it" sit together.
- **Then:** keep L6's `c1`/`p1` as a **recap**, freeing L6 to focus on playing the hand. This also lightens L6, which currently packs new starting-hand theory + heads-up hand + multiway capstone + responsible-play note into 4 problems.

### 6.3 Improvement #2: ground the 5 betting actions before the pot-odds math
**Issue.** The formal "5 actions" concept lives in **L5** (`c1`), but **L4** already asks for a **call/fold decision** (and L3 references folding). The design's forward-reference audit (§6) lists the chain as clean, but "call/fold" is used as a decision verb in L4 before its formal lesson in L5. Reputable sources teach check/bet/call/raise/fold as part of *the rules* (very early), not after the math.

**Why it matters.** A beginner deciding "call or fold" in L4 should already have a crisp definition of what calling and folding *are* and cost. Right now that relies on the informal mentions in L3.

**Recommendation (cheap):** add a brief plain-language definition of the 5 actions to **L3** (the flow lesson already covers blinds, betting rounds, action order, and folding — formalizing the five actions there is a natural fit and satisfies the design's own "define every term before first use" rule). L5 then *deepens* actions with sizing/EV rather than introducing them. Alternatively, at minimum, define "call" and "fold" in-prompt in L4. Update the §6 forward-reference audit to reflect whichever choice is made.

### 6.4 Improvement #3: explicitly name two misconceptions
Add a one-line myth-buster where each naturally fits (no new steps required):
- **"Poker is all luck"** → in L1 (goal of poker) or L6 responsible-play: skill dominates over the long run, luck dominates a single hand. (Also reinforces responsible play.)
- **"Bluffing is how you win"** → in L5 (betting): most profit comes from value-betting strong hands; bluffs only work when the opponent can fold (and the Tier-1 calling station demonstrates this).

### 6.5 Resolves design open question Q9 (responsible-play wording)
§5.3 above provides ready-to-use wording and a concrete, reputable resource (US: 1-800-GAMBLER / NCPG; UK: GamCare). Recommend blurb (a) on capstone completion + a persistent footer line.

### 6.6 Minor clarity notes
- **Don't teach preflop percentages or range charts** in L6 — keep starting hands at the "buckets + tighter-early/looser-late" level (§2.6). The design's instinct to keep it as "intuition" is correct; just spread it out.
- **Frame folding positively** somewhere early (it's a skill, not weakness) to pre-empt the #1 beginner leak (playing too many hands).
- **Consider surfacing AI reasoning** in "Why?" explanations for L5–L6 so the simulated opponents double as teaching devices (§3.4).

---

## 7. Sources (URLs)

**Curriculum structure / learning order**
- PokerStars Learn — Basics course outline: https://www.pokerstars.com/poker/learn/course/the-basics/
- PokerStars Learn — courses overview: https://www.pokerstars.com/poker/learn/ and https://www.pokerstars.com/poker/learn/courses/
- PokerStars School — Beginners Guide to Poker (PDF, table of contents shows Rules → Hand Rankings → Table Position → … → Bankroll): https://cmsstorage.rationalcdn.com/assets/ps/assets/pdf/pokerstars-school-beginners-guide-to-poker.pdf
- PokerCoaching — "How to Learn Poker" step-by-step plan (explicit order: rankings → position → starting hands → pot odds): https://pokercoaching.com/blog/how-to-learn-poker/
- SeekerStart — "How to Study Poker | 5 Steps" roadmap: https://www.seekerstart.com/en/poker-study
- DeucesCracked — "How to Play Poker — Beginner Guide" (positions + beginner checklist): https://www.deucescracked.com/learn/how-to-play-poker

**Starting hands & position (beginner level)**
- Upswing Poker — "Starting Hands in Texas Hold'em: The Ultimate Guide" (premium tiers, suited connectors, position): https://upswingpoker.com/texas-holdem-starting-hands-guide/
- Upswing Poker — Preflop charts / Preflop Prodigy: https://upswingpoker.com/charts/ and https://upswingpoker.com/preflop/
- PokerNews — "Best Starting Hands in Poker" (position-based ranges, beginner mistakes): https://www.pokernews.com/poker-hands/best-starting-hands.htm
- PokerNews — "How to Select Starting Hands in No-Limit Hold'em": https://www.pokernews.com/strategy/how-to-select-starting-hands-in-no-limit-holdem-24821.htm
- PokerNews — "How to Play in Position in No-Limit Hold'em": https://www.pokernews.com/strategy/how-to-play-in-position-no-limit-holdem-22771.htm
- BlackRain79 — "5 Poker Lessons ALL Beginners Need to Know" (TAG, ~20% of hands, position, value betting, c-bets): https://www.blackrain79.com/2023/12/beginner-poker-lessons.html
- RiverOdds — preflop opening-range percentages by position (reference figures): https://riverodds.app/poker-preflop-charts/ and https://riverodds.app/preflop-ranges/

**Tight-aggressive (TAG) / opponent-AI heuristics**
- PokerNews — TAG term definition (recommended for beginners): https://www.pokernews.com/pokerterms/tag.htm
- SplitSuit — "TAG Poker Strategy Explained": https://www.splitsuit.com/tag-poker-strategy-explained
- Kill Phil Poker — "How to Play Tight-Aggressive Poker — A Beginner's Guide": https://www.killphilpoker.com/poker/how-to-play-tight-aggressive-poker-a-beginners-guide/
- BlackRain79 (same as above) — value betting vs. calling stations, minimal bluffing vs. recreationals.

**Common beginner misconceptions / mistakes**
- Pokerology — "Typical Beginner Mistakes in Poker" (too many hands, fear/"monsters under the bed," bet sizing): https://www.pokerology.com/lessons/beginner-mistakes/
- Card Player — "Beginner's Guide: Common Mistakes And How To Avoid Them": https://www.cardplayer.com/cardplayer-poker-magazines/66556-venetian-deepstack-37-26/articles/25256-beginner-s-guide-common-mistakes-and-how-to-avoid-them
- Harrington Casino — "Common Poker Mistakes to Avoid" (overvaluing top pair, ignoring pot odds/table dynamics): https://casino.harringtonraceway.com/top-beginner-mistakes-poker-and-how-avoid-them
- Washington Beer Blog — "Common mistakes that beginners make" (playing too many hands, ignoring position, emotion): https://washingtonbeerblog.com/common-mistakes-that-beginners-make-when-playing-poker/

**Responsible play**
- NCPG — Helpline home (free, confidential, 24/7, all 50 states): https://www.ncpgambling.org/help-treatment/
- NCPG — 1-800-MY-RESET announcement (number context): https://www.ncpgambling.org/news/1-800-my-reset-announcement/
- NCPG — 1-800-GAMBLER fact sheet (PDF): https://www.ncpgambling.org/wp-content/uploads/2023/12/1-800-GAMBLER-Fact-Sheet.pdf
- GamCare — "Nine ways to keep yourself safe when gambling" (limits, self-exclusion, motivations): https://www.gamcare.org.uk/news-and-blog/blog/nine-ways-to-keep-yourself-safe-when-gambling/
- GamCare — National Gambling Helpline / get support: https://www.gamcare.org.uk/get-support/talk-to-us-now/

_Accessed June 2026. Helpline numbers and program names can change — verify NCPG (US) and GamCare (UK) details before shipping the responsible-play note._

