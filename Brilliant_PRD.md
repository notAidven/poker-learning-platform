## OVERVIEW

**Product name** Brilliant Alpha Clone — Probability & Random Variables

### What it is

An interactive learning app modeled on [Brilliant.org](https://brilliant.org), scoped to a single subject: **Probability and Random Variables**. Instead of passive lectures or video courses, learners build understanding by solving hands-on problems, manipulating simulations, and receiving instant feedback — the same learn-by-doing approach Brilliant uses across STEM.

### Curriculum scope

The course covers **introductory Probability and Random Variables** in **6 sequential lessons** — from experiments and sample spaces through counting, classic problems, and operations on events. Content is hand-authored for interactive learning; it is not tied to any single university syllabus.

**Reference materials used during authoring** (internal): [`Lecture 1.pdf`](Lecture%201.pdf) and [`Lecture 2.pdf`](Lecture%202.pdf) — basic concepts, counting, combinations, classic problems, set operations.

There is intentional overlap between foundational topics (counting principle, factorials, coin-tossing). The course path below deduplicates that overlap into a single sequence.

### Who it is for

College students and self-learners studying **probability and random variables** — anyone who wants intuition and practice, not just formulas. No prior institution or course enrollment required.

### Core experience (Phase 1)

- **Interactive lessons** — short, step-by-step sequences that mix concept introductions with problems the learner must solve
- **Hands-on problems** — manipulable interactions (simulations, sliders, sampling exercises, distribution visuals) appropriate to probability, not just multiple choice
- **Instant feedback** — specific right/wrong responses with authored explanations and **progressive hints** (each hint more helpful than the last, pre-written, not AI-generated)
- **Course path** — lessons organized into a structured path through core probability topics, with progress tracking and recommendations for what to do next
- **Gamification** — **streaks**, **XP**, and **levels** to encourage daily practice and a sense of progression
- **Responsive layout** — UI modeled on [Brilliant.org](https://brilliant.org), reflowing across phone, tablet, and desktop

### Product vision

Deliver a Brilliant clone solely for probability: one subject, taught deeply through interaction. A learner should be able to open the app, work through a lesson on a core probability concept, experiment with a visual simulation, get stuck, use authored hints and feedback to recover, and come back the next day with their streak and XP intact.

## WHAT IS THE MVP?

The MVP is a deployed, public web app that delivers everything described in the Overview — interactive lessons, hands-on problems, instant authored feedback, course path with progress tracking, streaks, and XP — with **6 lessons** covering introductory probability and random variables (Units 1–6 below).

**Topic coverage** (aligned with standard intro probability curricula):

- **Unit 1–2** — Experiments, sample spaces, events, basic probability
- **Unit 3–4** — Counting, factorials, combinations, binomial theorem
- **Unit 5–6** — Classic problems (birthday, derangements), operations on events

### MVP feature checklist

Everything from the Overview must ship in Phase 1:


| Feature              | MVP requirement                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Interactive lessons  | **Exactly 6 lessons** — one per topic below, covering Units 1–6                      |
| Hands-on problems    | Each lesson includes at least one manipulable interaction (drag, tap, slider, simulation) — not just multiple choice |
| Visual simulations   | Probability visuals that respond to input (dice, coins, Venn diagrams, counting diagrams)                            |
| Instant feedback     | Authored right/wrong responses with progressive hints — no AI                                                   |
| Course path          | 6 lessons in sequential order; next lesson unlocks on completion                                                       |
| Progress persistence | Resume mid-lesson; track completed lessons                                                                           |
| Streaks              | Daily streak grows when user logs in and completes 1 lesson that day                                                   |
| XP & levels          | XP earned on lesson completion; level up when XP threshold is met (threshold grows each level)                         |
| Accounts             | Sign-up and login required to save progress                                                                          |
| Responsive design    | Brilliant-style UI; layout adapts to phone, tablet, and desktop                                                |
| Deployed             | Public URL, accessible without local setup                                                                           |


**Hard rule:** No AI in the MVP. No model calls, no generated content, no chatbot tutor.

### Course structure (6 lessons)

The intro course is split into **exactly 6 interactive lessons** — one lesson per topic. Each lesson is a self-contained sequence of steps (concepts, problems, feedback) covering the key material for that unit.

| Lesson | Title | Unit | Key concepts covered | Primary interaction |
| ------ | ----- | ---- | -------------------- | ------------------- |
| **1** | Experiments, Outcomes & Sample Spaces | Unit 1 · Foundations | Experiments, outcomes ω, sample space Ω, P(ω), uniform distribution, 8-sided die | Tap outcomes on die/coin simulation; drag probability weights |
| **2** | Events & Basic Probability | Unit 2 · Events | Events as subsets, P(A), two dice (&#124;Ω&#124; = 36), 3 coin flips, "at most 1 head" | Grid simulation for two dice; flip coins to match events |
| **3** | Counting & Factorials | Unit 3 · Counting | Fundamental counting principle, n!, permutations, seating k guests on n chairs | Multi-step counting widget; drag guests to chairs |
| **4** | Combinations & the Binomial Theorem | Unit 4 · Combinations | Binomial coefficient, binomial theorem, P(k heads in n tosses) | Select k from n; coin-flip simulation to verify probability |
| **5** | Classic Probability Problems | Unit 5 · Classic problems | Birthday problem, secretary problem (derangements) | Simulate birthdays; drag letters to envelopes |
| **6** | Operations on Events | Unit 6 · Set operations | Complement, union, intersection, inclusion–exclusion, union bound | Interactive Venn diagrams; build formulas from shaded regions |

Lessons are completed **in order**. The next lesson unlocks only after the current lesson is fully complete (see [Lesson completion & unlock](#lesson-completion--unlock)). Revisiting a completed lesson is allowed (Brilliant-style redo) but does not award additional XP.

### Lesson structure (Brilliant-style)

Each lesson follows the [Brilliant.org](https://brilliant.org) **learn-by-doing** format — the learner **does first**, reads only what is needed to orient the next interaction.

| Portion | Purpose | Step type in JSON |
| ------- | ------- | ----------------- |
| **Micro-concept** | At most **2–4 short sentences** plus optional KaTeX — sets up the *next* interaction, not a textbook section | `concept` |
| **Interactive problems** | Manipulable simulations, grids, sliders, tap/drag widgets — learner must act to discover or verify the idea | `problem` |

**Composition rules (MVP):**

| Rule | Requirement |
| ---- | ----------- |
| Step ratio | **≥ 75%** of steps must be `problem` (interactive), not reading |
| Concept length | Each `concept` step: **≤ 120 words**; no concept-only chains longer than **1 step** before the next problem |
| Multiple choice | **At most 1** multiple-choice problem per lesson (prefer manipulables) |
| Interactions per lesson | **≥ 3 distinct interactive problems**, each using a simulation or manipulable widget |
| Animations | Visual state changes (flip, roll, select, fill bar) must use **motion/transitions** so feedback feels alive — not static forms |
| Learn-by-doing | New notation (e.g. $\\Omega$, $P(\\omega)$) is introduced **inside** problems or in a micro-concept immediately before one |

**Supported interaction types (Phase 1):**

| Type | Learner action | Example use |
| ---- | -------------- | ----------- |
| `coin-flip-lab` | Animated coin flips; observe outcomes | Discover sample space |
| `die-sample-space` | Roll die + tap faces | Build $\\Omega$ |
| `fairness-scale` | +/- probability bars | Equal $P(\\omega)$ on a fair die |
| `two-dice-grid` | Tap cells on 6×6 grid | Events, sums, ordered pairs |
| `coin-event-grid` | Tap H/T patterns | Event membership |
| `counting-product` | Pick options in stages | Multiplication principle |
| `seat-permutation` | Seat guests in chairs | Factorials / $n!$ |

A typical lesson flow:

```
concept → problem → problem → problem → problem → (complete)
```

Optional: `concept → problem → problem → concept → problem` — never more than one concept between problems.

This mirrors Brilliant's pattern: **short setup, then immediate hands-on practice** — not read-then-quiz.

### Lesson completion & unlock

A lesson is **complete** when the learner has:

1. **Finished the learning portion** — all `concept` steps viewed/advanced through
2. **Solved all interactive problems** — every `problem` step answered **correctly**

Rules (aligned with Brilliant's sequential, mastery-based flow):

- **Wrong answers** do not complete a problem — the learner reads authored feedback and **retries until correct** (hints available)
- The learner may **leave mid-lesson** and resume later; progress is saved at the current step
- When a lesson is complete, the **next lesson unlocks** on the course path
- **Lesson 1** is unlocked by default for new users; Lessons 2–6 require the previous lesson to be complete
- Completing a lesson for the first time awards **XP** and may count toward the **daily streak**
- Completed lessons show a **checkmark** on the course path; learners can **redo** them for review without earning additional XP

### Brilliant features (cloned vs. excluded)

This product clones Brilliant's core learning experience for one subject. Reference: [Brilliant Help Center](https://brilliant.org/help/).

| Brilliant feature | In this app? | Notes |
| ----------------- | ------------ | ----- |
| Step-by-step interactive lessons | Yes | Learning portion + interactive problems |
| Visual simulations & manipulables | Yes | D3.js + SVG (dice, coins, Venn diagrams, etc.) |
| Instant feedback on answers | Yes | Authored explanations; retry until correct |
| Authored hints when stuck | Yes | Progressive hints — each more helpful than the last (no AI tutor) |
| Sequential course path | Yes | 6 lessons in order; next unlocks on completion |
| Redo / review completed lessons | Yes | No additional XP on replay |
| Streaks | Yes | Login + complete 1 lesson per day |
| XP & levels | Yes | XP on first lesson completion; level-up thresholds |
| Home dashboard with progress | Yes | Streak, level, XP, recommended next lesson |
| Responsive web experience | Yes | Phone, tablet, desktop |
| Koji AI tutor | No | Phase 1 — hand-authored hints only |
| Leagues & leaderboards | No | Out of scope |
| Daily lesson keys / paywall | No | All 6 lessons free for logged-in users |
| Ads | No | Out of scope |
| Skip ahead (Premium) | No | Must complete lessons sequentially |
| Multi-subject catalog | No | Probability & random variables only |

---

#### Streaks

- The streak counts **consecutive calendar days** on which the user both **logs in** and **completes at least one full lesson**
- Completing a lesson increments the streak by **1** for that day (only once per day, regardless of how many lessons are finished)
- Logging in without completing a lesson does **not** extend the streak
- Missing a calendar day resets the streak to **0**
- Streak count is visible on the home screen
- **Timezone:** streak days reset at **midnight Central American Time (CAT, UTC−6)**. A qualifying day is measured in CAT regardless of the user's local timezone

#### XP & levels

- **XP is earned only when a lesson is completed for the first time** (100 XP per lesson)
- Replaying a completed lesson does not award additional XP
- Users have a **level** that increases when they accumulate enough XP
- XP needed to reach the **next level** grows slightly each level:

  | Level | XP required to reach next level |
  | ----- | ------------------------------- |
  | 1 → 2 | 100 XP |
  | 2 → 3 | 125 XP |
  | 3 → 4 | 150 XP |
  | 4 → 5 | 175 XP |
  | … | +25 XP per level |

  Formula: `xpToNextLevel(level) = 100 + (level - 1) × 25`

- The home screen shows **current level**, **total XP**, and a **progress bar** toward the next level
- Completing all 6 lessons awards 600 XP total (enough to reach approximately level 4–5)

### Progressive hints

Hints follow a **progressive disclosure** model (Brilliant-style guidance without giving the answer):

| Hint level | Purpose | Example |
| ---------- | ------- | ------- |
| **Hint 1** | Gentle nudge — points toward what to think about | "What is the sample space here?" |
| **Hint 2** | More specific — narrows the approach | "List all outcomes where the sum equals 5." |
| **Hint 3** | Strongest hint — nearly walks through the method, still requires the learner to answer | "The favorable outcomes are (1,4), (2,3), (3,2), (4,1). How many is that out of 36?" |

Rules:

- Each `problem` step includes an ordered **`hints` array** (typically 2–3 hints, authored per problem)
- Learner taps **"Get hint"** to reveal the next hint in sequence; hints cannot be skipped
- Hints get **progressively more helpful** — never jump straight to the answer
- Using hints does **not** block lesson completion; the learner must still answer correctly
- Hints are **hand-authored** in the JSON lesson file (no AI)

### UI & screens (Brilliant-style)

The app should **look and feel like Brilliant.org**, adapted for probability content. Layout **changes by screen size** while keeping the same visual language.

**Design reference:** [Brilliant.org](https://brilliant.org) — clean, modern, card-based, focused on the interactive lesson.

| Screen | Brilliant-like behavior | Responsive notes |
| ------ | ----------------------- | ---------------- |
| **Login / sign-up** | Minimal, centered auth forms | Single column on mobile; centered card on desktop |
| **Profile setup** | Username + animal avatar picker grid | Avatar grid wraps; larger tap targets on mobile |
| **Home dashboard** | Streak flame, level/XP bar, "Continue" / next lesson CTA | Stacked vertically on mobile; side-by-side stats on desktop |
| **Course path** | Vertical lesson path with nodes, checkmarks on completed, lock icons on locked | Full-width path on mobile; narrower centered column on desktop |
| **Lesson player** | One step at a time, progress bar at top, large interactive area, hint button bottom-right | Interactive area fills screen width on mobile; max-width container on desktop |
| **Profile** | Username, animal avatar, sign-out | Simple single-page layout |

**Visual principles (match Brilliant):**

- White/light background, bold headings, generous whitespace
- One primary action per screen (e.g. "Continue", "Check answer", "Get hint")
- Lesson progress bar across the top of the lesson player
- Immediate visual feedback on correct (green) / incorrect (red) answers
- Locked lessons grayed out with lock icon; completed lessons show checkmark
- Touch-friendly buttons on mobile; hover states on desktop

---

### MVP architecture (minimum)

1. **Content model** — lessons as JSON sequences of `concept` and `problem` steps, not raw HTML
2. **Lesson renderer** — frontend that renders learning steps and interactive problems, captures interactions, shows instant feedback, blocks advancement on problems until correct
3. **Progress layer** — records current step, lesson completion, attempts, XP, streak, level
4. **Persistence** — auth + database so progress survives across sessions and devices

### MVP acceptance tests

1. A learner completes a lesson end-to-end, gets problems wrong, and recovers using authored feedback
2. A learner manipulates an interactive element and sees the visual update in real time
3. A learner leaves mid-lesson and returns to find progress and streak intact
4. A learner finishes a lesson (learning portion + all problems correct) and the **next lesson unlocks** on the course path
5. The app works across screen sizes — phone, tablet, and desktop

### What the MVP is not

- Not a full graduate-level probability course — MVP covers **6 intro lessons** only
- Not multi-subject — probability only
- Not AI-powered — all content hand-authored
- Not Leagues, subscriptions, or native mobile apps (responsive web app is in scope)

## ACCOUNTS AND PROFILES

### Sign-up

Users can create an account using one of two methods:

1. **Email and password** — user provides an email address and password
2. **Google** — user signs in with their Google account (OAuth)

After account creation (either method), every new user must complete a one-time **profile setup** before accessing the app:

- Choose a **username** (required, unique, used for login)
- Select a **profile animal** from a preset collection of small animal avatars

Profile setup cannot be skipped. Progress, streaks, and XP are tied to the account.

### Login

Returning users can sign in using either:

1. **Username and password** — enter username (not email) and password
2. **Google** — sign in with the Google account linked at sign-up

### Profile data

Each account stores:


| Field                | Required                           | Notes                                                   |
| -------------------- | ---------------------------------- | ------------------------------------------------------- |
| Email                | Yes (email sign-up) or from Google | Used for account recovery; not used for login           |
| Password hash        | Yes (email sign-up only)           | Google-only users authenticate via Google               |
| Username             | Yes                                | Unique; displayed in app; used for email/password login |
| Profile animal       | Yes                                | Selected from preset avatar set at sign-up              |
| Progress, streak, XP, level | — | Persisted per account |


### Auth flows

```
New user (email)     →  email + password  →  profile setup (username + animal)  →  app
New user (Google)    →  Google OAuth      →  profile setup (username + animal)  →  app
Returning user       →  username + password  OR  Google  →  app
```

### Requirements

- Usernames must be **unique** across all accounts
- Profile animal is chosen from a **fixed set of preset animals** (no custom image upload in MVP)
- Google sign-in and email sign-up must both route through the same profile setup for new users
- A Google user who already completed profile setup goes straight to the app on return
- Session persists across browser visits so users stay logged in until they sign out

### Out of scope (accounts)

- Apple sign-in
- Sign in with email (login uses username, not email)
- Custom profile photo upload
- Family or group accounts
- Educator/classroom accounts

## USER PERSONA

### Primary audience

**Domain:** Probability and Statistics.

This application is for **college students and self-learners** studying **Probability and Random Variables** at an introductory level — building intuition through interaction, not memorizing formulas.

### Persona: Maya Chen


|                  |                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**         | Maya Chen                                                                                                                                                                 |
| **Age**          | 19                                                                                                                                                                        |
| **Year**         | College freshman                                                                                                                                                          |
| **Course**       | Introductory Probability and Random Variables                                                                                                                               |
| **Background**   | Strong in algebra and calculus; new to formal probability. Comfortable with lectures but struggles to build intuition for sample spaces, counting, and why formulas work. |
| **Tech comfort** | Uses phone and laptop daily; prefers short, interactive sessions over long readings or video lectures.                                                                    |


### Goals

- Understand core probability concepts deeply enough to solve problems and explain reasoning
- Build intuition for probability through hands-on practice, not memorizing formulas
- Review topics in a structured path that builds from foundations to classic problems
- Stay on track during the semester with daily practice and visible progress

### Frustrations

- Lecture notes and textbooks explain *what* but not always *why*
- Passive studying (re-reading slides) does not help when exam problems require thinking, not recall
- Gets stuck on counting and set-operations problems and has no immediate feedback
- Hard to know what to study next or whether she actually understands a concept

### How Maya uses the app

- **Before class or study** — previews the next unit on the course path (e.g. sample spaces before events)
- **After reading or class** — works through the interactive lesson while the material is fresh
- **Before problem sets / exams** — revisits lessons where she got problems wrong, uses hints and feedback to fill gaps
- **On mobile** — short sessions between classes; checks streak and XP on the home screen

### What success looks like

- Can explain sample spaces, events, and basic counting in her own words
- Solves interactive problems without guessing; uses feedback to correct misunderstandings
- Finishes lessons feeling confident, not just having clicked through
- Returns daily — streak and XP reflect consistent study habits

### Secondary users

Any learner studying introductory probability and random variables can use the app. The 6-lesson path follows a standard intro sequence from sample spaces through set operations.

## USER STORIES

Stories are written from the perspective of **Maya Chen** (primary persona). Each main MVP feature has at least one story; additional stories cover auth, profile, and edge cases.

### Main feature stories

#### Interactive lessons

- **US-01:** As a student, I want to work through lessons as a sequence of short interactive steps, so that I learn one concept at a time without being overwhelmed by a wall of text.
- **US-02:** As a student, I want each lesson to introduce a concept and then immediately ask me to apply it, so that I learn by doing rather than reading passively.

#### Hands-on problems

- **US-03:** As a student, I want to solve problems by manipulating elements directly (dragging, tapping, sliding), so that the interaction itself helps me understand the probability concept.
- **US-04:** As a student, I want problems that go beyond multiple choice, so that I have to think through the concept instead of guessing from options.

#### Visual simulations

- **US-05:** As a student, I want to see visuals (dice, coins, Venn diagrams, grids) update in real time as I interact, so that abstract probability ideas become concrete and intuitive.
- **US-06:** As a student, I want to experiment with simulations (e.g. flip coins, roll dice) and observe outcomes, so that I can build intuition before answering formal questions.

#### Instant feedback & hints

- **US-07:** As a student, I want immediate feedback when I submit an answer, so that I know right away whether my reasoning is correct.
- **US-08:** As a student, I want a specific explanation when I get an answer wrong, so that I understand my mistake and can try again.
- **US-09:** As a student, I want progressive hints that get more helpful each time I ask, so that I can get unstuck without being given the answer immediately.

#### Course path

- **US-10:** As a student, I want 6 lessons organized in a logical learning order, so that each topic builds on the previous one.
- **US-11:** As a student, I want the next lesson to unlock after I complete the learning portion and all interactive problems, so that I progress through the course in order like on Brilliant.
- **US-12:** As a student, I want to browse all 6 lessons on a course path screen, so that I can see how far I have come and what is ahead.

#### Progress persistence

- **US-13:** As a student, I want my lesson progress saved automatically, so that I can leave mid-lesson and pick up exactly where I left off later.
- **US-14:** As a student, I want completed lessons marked on the course path, so that I can see what I have already finished.
- **US-15:** As a student, I want my progress tied to my account, so that it persists across sessions and devices.

#### Streaks

- **US-16:** As a student, I want a daily streak that tracks consecutive days I log in and complete a lesson, so that I am motivated to return every day.
- **US-17:** As a student, I want my streak to grow by 1 when I log in and finish at least one lesson that day, so that daily practice becomes a habit.

#### XP & levels

- **US-18:** As a student, I want to earn XP when I complete a lesson for the first time, so that I feel a sense of accomplishment and forward momentum.
- **US-19:** As a student, I want to see my level, total XP, and progress toward the next level on the home screen, so that I can track my growth at a glance.

---

### Account & profile stories

#### Sign-up

- **US-20:** As a new user, I want to create an account with email and password, so that I can save my progress securely.
- **US-21:** As a new user, I want to create an account with Google, so that I can sign up quickly without remembering another password.

#### Profile setup

- **US-22:** As a new user, I want to choose a unique username after signing up, so that I have an identity in the app and can log in easily.
- **US-23:** As a new user, I want to select a profile animal avatar, so that my account feels personal and recognizable.

#### Login

- **US-24:** As a returning user, I want to log in with my username and password, so that I can access my saved progress.
- **US-25:** As a returning user, I want to log in with Google, so that I can get back into the app with one click.

---

### Additional stories

#### Learning workflow

- **US-26:** As a student, I want to preview the next unit on the course path, so that I can prepare before diving into harder topics.
- **US-27:** As a student reviewing for a problem set, I want to redo a completed lesson, so that I can fill gaps before the deadline.
- **US-28:** As a student, I want to retry problems after reading feedback until I get them right, so that I cannot skip past material I do not understand.

#### Home & dashboard

- **US-29:** As a student, I want a home screen showing my streak, level, XP progress, and recommended next lesson, so that I know what to do as soon as I open the app.
- **US-30:** As a student, I want to see my username and profile animal on my profile, so that the app feels like mine.

#### Mobile & accessibility

- **US-31:** As a student on my phone, I want the app to work on a small screen with touch input, so that I can study between classes without a laptop.
- **US-32:** As a student on my phone, I want interactive elements to respond smoothly to touch, so that simulations and drag problems feel natural on mobile.
- **US-36:** As a student on any device, I want the UI to look like Brilliant and adapt to my screen size, so that the experience feels familiar whether I'm on phone, tablet, or desktop.

#### Session & account management

- **US-33:** As a returning user, I want to stay logged in across browser visits, so that I do not have to sign in every time I open the app.
- **US-34:** As a user, I want to sign out of my account, so that I can secure my session on a shared device.
- **US-35:** As a new user choosing a username, I want to be told immediately if my username is already taken, so that I can pick another without restarting sign-up.

## TECH STACK

Phase 1 stack, based on the recommendations in `[Phase 1](Phase%201)`. Choices below are locked in for the MVP.

### Phase 1 (MVP)


| Layer                   | Choice                                        | Purpose                                                                                      |
| ----------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Frontend**            | React                                         | UI, lesson renderer, course path, dashboard                                                  |
| **Styling**             | Responsive CSS (e.g. Tailwind or CSS modules) | Layout adapts to phone, tablet, and desktop breakpoints                                      |
| **Interactive visuals** | D3.js + SVG                                   | Dice, coins, Venn diagrams, grids, charts, and other probability simulations                 |
| **Backend**             | Firebase                                      | Auth, database, hosting                                                                      |
| **Authentication**      | Firebase Auth                                 | Email/password sign-up; Google OAuth; session persistence                                    |
| **Database**            | Cloud Firestore                               | User profiles, lesson progress, streaks, XP, mastery state                                   |
| **Hosting**             | Firebase Hosting                              | Deployed public web app                                                                      |
| **Math rendering**      | KaTeX                                         | Render probability notation (Σ, fractions, binomial coefficients, set notation) in lesson content |
| **Content**             | JSON lesson files                             | Structured lesson format — each lesson is a sequence of steps (concept → problem → feedback) |


### How each layer maps to the product

**React** renders the app shell, course path, home dashboard, auth flows, and the lesson step engine. Each step type (concept, problem, feedback) is a React component driven by the JSON content model. The UI is **responsive** — it reflows based on viewport width (mobile-first, scales up to tablet and desktop).

**D3.js + SVG** powers manipulable probability visuals — sample space grids, coin/die simulations, Venn diagrams, counting widgets. SVG keeps interactions sharp on mobile; D3 handles data binding and transitions for real-time visual updates.

**KaTeX** renders mathematical notation inside lesson content — summations, fractions, binomial coefficients `\binom{n}{k}`, set notation, and probability formulas.

**Firebase Auth** supports the account flows defined in Accounts & Profiles:

- Email + password sign-up
- Google sign-in
- Persistent sessions across browser visits

**Cloud Firestore** stores:

- User profile (username, profile animal, email, level, total XP)
- Per-lesson progress (current step, learning portion complete, problems solved, lesson completed)
- Streak count and last qualifying activity date

**JSON lesson format** — each lesson is mostly **interactive problems** with optional micro-concepts:

```json
{
  "id": "2",
  "title": "Events & Basic Probability",
  "steps": [
    { "type": "concept", "content": "An **event** is a collection of outcomes..." },
    {
      "type": "problem",
      "interaction": "two-dice-grid",
      "config": { "matchSum": 7 },
      "answer": { "cells": ["1-6", "2-5", "3-4", "4-3", "5-2", "6-1"] },
      "feedback": { "correct": "...", "incorrect": "...", "hints": ["...", "...", "..."] }
    }
  ]
}
```

- `concept` steps: **brief** orientation only — learner advances after reading
- `problem` steps: **manipulable** widgets with animations; must answer correctly; progressive hints
- **No** lesson should rely primarily on multiple choice or long text blocks
- Lesson complete → next lesson unlocks

Lessons are hand-authored for interactive learning. No AI generation in Phase 1.

**Firebase Hosting** serves the built React app at a public URL for MVP delivery and testing.

### Phase 2+ (out of scope for MVP)

Not built in Phase 1, but noted for later per the Phase 1 brief:


| Layer       | Options                                                     |
| ----------- | ----------------------------------------------------------- |
| AI          | OpenAI or Anthropic Claude for hints and problem generation |
| Math engine | SymPy or math.js for ground-truth answer checks             |


## SUCCESS METRICS

The MVP is successful when learners can actually learn from the app — not just click through it. Metrics are grouped by category.

### Learning outcomes

- A student can **complete a full lesson** — learning portion finished and all interactive problems answered correctly
- After completing a lesson, the student **understands the core concepts** well enough to explain them in their own words
- A student can **answer problems without using hints** on material covered in the lesson
- Wrong answers are part of learning — the student can **recover using feedback** and still finish the lesson successfully

### Feedback quality

- Feedback appears **immediately** after submitting an answer (no noticeable delay)
- Correct answers confirm **why** the reasoning is right, not just "Correct"
- Wrong answers include a **specific explanation** of the mistake
- Authored **progressive hints** available when stuck — each hint more helpful than the last; not required to complete the lesson
- Feedback helps the student **course-correct**, not just mark errors

### Interactivity quality

- Each lesson includes at least **one genuinely manipulable problem** (flip, roll, grid tap, seat guests, adjust bars) — not only multiple choice
- Interactive elements **animate** on input (coin flip rotation, die roll tick, cell scale on select, bar width transitions)
- The interaction **teaches the concept** — manipulating the visual is part of understanding, not decoration
- The UI **looks like Brilliant** and adapts to screen size — usable on phone, tablet, and desktop
- Touch interactions work naturally on **smaller screens**; mouse/keyboard work on larger screens

### Content coverage

- **Exactly 6 complete interactive lessons** covering Units 1–6 (intro probability and random variables)
- Each lesson is **hand-authored** with authored feedback and progressive hints
- Lessons follow the **sequential course path** (Lesson 1 → 6)

### Engagement (streaks, XP & levels)

- **Streak grows by 1** when the user logs in and completes at least one full lesson that calendar day (**midnight CAT, UTC−6**)
- Logging in alone does not extend the streak; missing a day resets it to 0
- **100 XP awarded** on first completion of each lesson (no XP for replays)
- **Level increases** when the XP threshold for the current level is met; threshold grows by 25 XP each level
- Level, XP progress bar, and streak are **visible on the home screen**
- Streak, XP, and level **persist** after logout and login

### MVP acceptance tests

These are pass/fail checks for the MVP demo:

1. A learner completes a lesson end-to-end, gets problems wrong, and **recovers using authored feedback**
2. A learner **manipulates an interactive element** and sees the visual update in real time
3. A learner **leaves mid-lesson** and returns to find **progress and streak intact**
4. A learner **completes a lesson** (learning portion + all problems correct) and the **next lesson unlocks**
5. The full flow works across **phone, tablet, and desktop** screen sizes

### Qualitative user test

- Hand the app to someone **without a probability background**
- They can work through **one lesson** and come away understanding the concept — **without AI**
- If they get stuck, the **feedback and hints** are enough to help them recover

### Deployment

- The app is **deployed and publicly accessible** via Firebase Hosting
- Multiple learners can use the app concurrently without degradation

## OUT OF SCOPE

Explicitly excluded from Phase 1 (MVP). These may be considered in later phases.

### AI & generated content

- AI tutor (Brilliant's Koji or any chatbot)
- AI-generated lessons, problems, hints, or feedback
- Model API calls of any kind (OpenAI, Claude, Gemini, etc.)
- Automated problem generation or adaptive AI routing

All lesson content, feedback, and hints are **hand-authored**.

### Content & curriculum

- Additional lessons beyond the **6-lesson intro path** (no full advanced probability course in MVP)
- Subjects beyond **Probability and Random Variables**
- Video lectures or passive video-based lessons
- Completion certificates, course credits, or formal accreditation
- Integration with external LMS or university grading systems

### Brilliant features not being cloned

- **Leagues** and weekly XP leaderboards
- **Subscription billing** (free/premium tiers, payments)
- **Brilliant for Educators** (classrooms, teacher dashboards, Google Classroom)
- Daily lesson limits / paywall (MVP is fully accessible to logged-in users)
- Streak charges (protection for missed days)

### Platform & distribution

- Native **iOS** or **Android** apps (MVP is a **responsive web app** — not a native app, but must adapt to screen size)
- iOS home screen widgets
- Offline mode / download lessons for offline use

### Accounts & social

- Apple sign-in
- Login with **email** (login uses username + password or Google only)
- Custom profile photo upload (preset animals only)
- Family, group, or shared accounts
- Social features between users (friends, messaging, shared progress)

### Phase 2 & Phase 3 (deferred)

- Phase 2 AI features (generated hints, problem generation, math engine integration)
- Phase 3 learning science (spaced repetition, adaptive mastery routing, evidence-based retention techniques)

### Infrastructure & tooling

- Custom admin CMS for authoring lessons (lessons authored as JSON files in the repo)
- Analytics dashboard beyond basic progress stored in Firestore
- Email notifications or push reminders

