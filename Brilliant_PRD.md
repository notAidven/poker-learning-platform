## OVERVIEW

**Product name** Brilliant Alpha Clone — Probability & Random Variables

### What it is

An interactive learning app modeled on [Brilliant.org](https://brilliant.org), scoped to a single subject: **Probability and Random Variables**. Instead of passive lectures or video courses, learners build understanding by solving hands-on problems, manipulating simulations, and receiving instant feedback — the same learn-by-doing approach Brilliant uses across STEM.

### Curriculum source

All lesson content is derived from the **MIT 18.600** course (*Introduction to Probability and Random Variables*), aligned with the official lecture notes to be provided. The app does not try to cover all of Brilliant's subjects — it goes deep on this one course.

### Who it is for

College students — primarily freshmen — studying or preparing for MIT 18.600 (Spring 2026). Any college student working through probability and random variables can use it, but the scope and pacing follow 18.600.

### Core experience (Phase 1)

- **Interactive lessons** — short, step-by-step sequences that mix concept introductions with problems the learner must solve
- **Hands-on problems** — manipulable interactions (simulations, sliders, sampling exercises, distribution visuals) appropriate to probability, not just multiple choice
- **Instant feedback** — specific right/wrong responses with authored explanations and hints (pre-written, not AI-generated) so learners can recover from mistakes
- **Course path** — lessons organized into a structured path through 18.600 topics, with progress tracking and recommendations for what to do next
- **Gamification** — **streaks** and **XP** to encourage daily practice and a sense of progression
- **Responsive layout** — the web app adapts to screen size (phone, tablet, desktop); layout, touch targets, and visuals reflow appropriately

### Product vision

Deliver a Brilliant clone solely for probability: one subject, taught deeply through interaction. A learner should be able to open the app, work through a lesson on a real 18.600 concept, experiment with a visual simulation, get stuck, use authored hints and feedback to recover, and come back the next day with their streak and XP intact.

## WHAT IS THE MVP?

The MVP is a deployed, public web app that delivers everything described in the Overview — interactive lessons, hands-on problems, instant authored feedback, course path with progress tracking, streaks, and XP — with lesson content covering **Lecture 1** and **Lecture 2** from MIT 18.600 (Spring 2026, instructor: Jacopo Borga). 

**Source materials:**

- `[Lecture 1.pdf](Lecture%201.pdf)` — Basic concepts: experiments, outcomes, sample spaces, events, uniform probability
- `[Lecture 2.pdf](Lecture%202.pdf)` — Counting, permutations, combinations, binomial coefficients, classic problems, set operations

There is intentional overlap between the two lectures (counting principle, factorials, coin-tossing). The content below deduplicates that overlap into a single course path.

### MVP feature checklist

Everything from the Overview must ship in Phase 1:


| Feature              | MVP requirement                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Interactive lessons  | At least one fully built lesson per chapter below (6 chapters → minimum 6 lessons)                                   |
| Hands-on problems    | Each lesson includes at least one manipulable interaction (drag, tap, slider, simulation) — not just multiple choice |
| Visual simulations   | Probability visuals that respond to input (dice, coins, Venn diagrams, counting diagrams)                            |
| Instant feedback     | Authored right/wrong responses with explanations and hints — no AI                                                   |
| Course path          | Chapters in order with next-lesson recommendations                                                                   |
| Progress persistence | Resume mid-lesson; track completed lessons and mastery                                                               |
| Streaks              | Daily streak for completing problems or a full lesson                                                                |
| XP                   | Earn XP for completing lessons and solving problems                                                                  |
| Accounts             | Sign-up and login required to save progress                                                                          |
| Responsive design    | Layout adapts to screen size (phone, tablet, desktop) with touch-friendly input on smaller screens                   |
| Deployed             | Public URL, accessible without local setup                                                                           |


**Hard rule:** No AI in the MVP. No model calls, no generated content, no chatbot tutor.

### Course structure (from Lecture 1 + Lecture 2)

Content is organized into **6 chapters**. Each chapter contains **1+ interactive lessons** derived from the lecture notes.

---

#### Chapter 1: Experiments, Outcomes & Sample Spaces

*Source: Lecture 1 (pages 1–2)*


| Lesson | Topic                  | Key concepts                            | Suggested interaction                                        |
| ------ | ---------------------- | --------------------------------------- | ------------------------------------------------------------ |
| 1.1    | What is an experiment? | Experiment, outcome ω, sample space Ω   | Tap outcomes on a die or coin flip simulation                |
| 1.2    | Sample spaces          | Finite vs infinite Ω; |Ω| (cardinality) | Build a sample space by listing outcomes                     |
| 1.3    | Defining probability   | P(ω) ∈ [0,1]; Σ P(ω) = 1                | Drag probability weights on outcomes; validate they sum to 1 |
| 1.4    | Uniform distribution   | P(ω) = 1/|Ω|                            | 8-sided die example; adjust faces and see P(ω) update        |


---

#### Chapter 2: Events & Basic Probability

*Source: Lecture 1 (pages 2–3)*


| Lesson | Topic                   | Key concepts                               | Suggested interaction                              |
| ------ | ----------------------- | ------------------------------------------ | -------------------------------------------------- |
| 2.1    | Events as subsets       | Event A ⊆ Ω; examples (odd die roll)       | Highlight subsets of a sample space diagram        |
| 2.2    | Probability of an event | P(A) = Σ_{ω∈A} P(ω)                        | Compute P(odd) on a fair 6-sided die               |
| 2.3    | Two dice                | Ω = {(i,j): 1≤i,j≤6}; |Ω| = 36             | Grid simulation; tap cells to form event "sum = 5" |
| 2.4    | Coin tosses (3 flips)   | |Ω| = 8; uniform measure; "at most 1 head" | Flip 3 coins; count outcomes matching event        |


---

#### Chapter 3: Counting & Factorials

*Source: Lecture 1 (page 4) + Lecture 2 (page 1) — merged*


| Lesson | Topic                             | Key concepts                           | Suggested interaction                          |
| ------ | --------------------------------- | -------------------------------------- | ---------------------------------------------- |
| 3.1    | Fundamental principle of counting | k tasks, n_i ways each → Π n_i         | Multi-step counting widget (independent tasks) |
| 3.2    | Factorials & permutations         | n!; reordering n distinct objects; S_n | Arrange objects; see permutation count grow    |
| 3.3    | Seating guests                    | k guests on n chairs: n!/(n−k)!        | Drag guests to chairs; count arrangements      |


---

#### Chapter 4: Combinations & the Binomial Theorem

*Source: Lecture 2 (pages 2–3)*


| Lesson | Topic                       | Key concepts                                 | Suggested interaction                                 |
| ------ | --------------------------- | -------------------------------------------- | ----------------------------------------------------- |
| 4.1    | Selecting a set             | Choose k from n chairs; binomial coefficient | Select k items from n; see count update               |
| 4.2    | Binomial coefficient        | (n choose k) = n! / ((n−k)! k!)              | Formula builder; compute small examples               |
| 4.3    | Binomial theorem            | (a+b)^n = Σ (n choose k) a^k b^{n−k}         | Expand small cases interactively                      |
| 4.4    | Exactly k heads in n tosses | P(k heads) = (n choose k) · 2^{−n}           | Coin-flip simulation; predict then verify probability |


---

#### Chapter 5: Classic Probability Problems

*Source: Lecture 2 (pages 3–4, 6)*


| Lesson | Topic             | Key concepts                            | Suggested interaction                                       |
| ------ | ----------------- | --------------------------------------- | ----------------------------------------------------------- |
| 5.1    | Birthday problem  | P(at least 2 same birthday); complement | Simulate class birthdays; compare to formula                |
| 5.2    | Secretary problem | n letters, n envelopes; all wrong       | Drag letters to envelopes; estimate derangement probability |


---

#### Chapter 6: Operations on Events

*Source: Lecture 2 (pages 4–6)*


| Lesson | Topic                           | Key concepts                   | Suggested interaction                            |
| ------ | ------------------------------- | ------------------------------ | ------------------------------------------------ |
| 6.1    | Complement                      | A^c = Ω \ A; P(A^c) = 1 − P(A) | Toggle complement on a Venn diagram              |
| 6.2    | Union & intersection            | A ∪ B, A ∩ B; Venn diagrams    | Shade regions on interactive Venn diagram        |
| 6.3    | Inclusion–exclusion (2 events)  | P(A∪B) = P(A) + P(B) − P(A∩B)  | Build formula from Venn areas                    |
| 6.4    | Inclusion–exclusion (3+ events) | General formula; union bound   | Step through 3-event formula; apply to a problem |


---

### MVP architecture (minimum)

1. **Content model** — lessons as JSON sequences of steps (concept → problem → feedback), not raw HTML
2. **Lesson renderer** — frontend that renders steps, captures interactions, shows instant feedback
3. **Progress layer** — records attempts, completion, current step, XP, streak
4. **Persistence** — auth + database so progress survives across sessions and devices

### MVP acceptance tests

1. A learner completes a lesson end-to-end, gets problems wrong, and recovers using authored feedback
2. A learner manipulates an interactive element and sees the visual update in real time
3. A learner leaves mid-lesson and returns to find progress and streak intact
4. A learner finishes a lesson and sees a sensible next-lesson recommendation on the course path
5. The app works across screen sizes — phone, tablet, and desktop

### What the MVP is not

- Not a full 18.600 course — only Lectures 1 and 2
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

| Field | Required | Notes |
|---|---|---|
| Email | Yes (email sign-up) or from Google | Used for account recovery; not used for login |
| Password hash | Yes (email sign-up only) | Google-only users authenticate via Google |
| Username | Yes | Unique; displayed in app; used for email/password login |
| Profile animal | Yes | Selected from preset avatar set at sign-up |
| Progress, streak, XP | — | Persisted per account |

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

This application is made for college freshmen specifically, but any college student can use it to study for MIT's probability class **18.600** (Spring 2026). The course is an introduction to **Probability and Random Variables**, taught by Jacopo Borga.

### Persona: Maya Chen

| | |
|---|---|
| **Name** | Maya Chen |
| **Age** | 19 |
| **Year** | College freshman |
| **Course** | MIT 18.600 — Probability and Random Variables (Spring 2026) |
| **Background** | Strong in algebra and calculus; new to formal probability. Comfortable with lectures but struggles to build intuition for sample spaces, counting, and why formulas work. |
| **Tech comfort** | Uses phone and laptop daily; prefers short, interactive sessions over long readings or video lectures. |

### Goals

- Understand 18.600 concepts deeply enough to follow lecture and do problem sets
- Build intuition for probability through hands-on practice, not memorizing formulas
- Review lecture material (Lectures 1–2 and beyond) in a way that sticks
- Stay on track during the semester with daily practice and visible progress

### Frustrations

- Lecture notes and textbooks explain *what* but not always *why*
- Passive studying (re-reading slides) does not help when exam problems require thinking, not recall
- Gets stuck on counting and set-operations problems and has no immediate feedback
- Hard to know what to study next or whether she actually understands a concept

### How Maya uses the app

- **Before lecture** — skims the matching chapter to preview concepts (e.g. sample spaces before Lecture 1)
- **After lecture** — works through the interactive lesson while the material is fresh
- **Before problem sets / exams** — revisits lessons where she got problems wrong, uses hints and feedback to fill gaps
- **On mobile** — short sessions between classes; checks streak and XP on the home screen

### What success looks like

- Can explain sample spaces, events, and basic counting in her own words
- Solves interactive problems without guessing; uses feedback to correct misunderstandings
- Finishes lessons feeling confident, not just having clicked through
- Returns daily — streak and XP reflect consistent study habits

### Secondary users

Any college student studying probability and random variables (not only MIT freshmen) can use the app. Content follows 18.600 lecture notes, so it is most useful for students in or preparing for that course.

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
- **US-09:** As a student, I want access to authored hints when I am stuck, so that I can get nudged toward the right approach without being given the answer.

#### Course path
- **US-10:** As a student, I want lessons organized into chapters that follow the 18.600 lecture note order, so that the app aligns with what I am learning in class.
- **US-11:** As a student, I want to see a recommended next lesson after I finish one, so that I always know what to study next.
- **US-12:** As a student, I want to browse all chapters and lessons on a course path screen, so that I can see how far I have come and what is ahead.

#### Progress persistence
- **US-13:** As a student, I want my lesson progress saved automatically, so that I can leave mid-lesson and pick up exactly where I left off later.
- **US-14:** As a student, I want completed lessons marked on the course path, so that I can see what I have already finished.
- **US-15:** As a student, I want my progress tied to my account, so that it persists across sessions and devices.

#### Streaks
- **US-16:** As a student, I want a daily streak that tracks consecutive days I practice, so that I am motivated to return every day.
- **US-17:** As a student, I want my streak to increase when I complete problems or a full lesson in a day, so that even a short session counts toward my habit.

#### XP
- **US-18:** As a student, I want to earn XP when I complete lessons and solve problems, so that I feel a sense of accomplishment and forward momentum.
- **US-19:** As a student, I want to see my total XP on the home screen, so that I can track my overall learning activity at a glance.

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
- **US-26:** As a student preparing for lecture, I want to preview the chapter that matches the upcoming lecture, so that I arrive to class with basic familiarity.
- **US-27:** As a student reviewing for a problem set, I want to revisit lessons where I previously got problems wrong, so that I can fill gaps before the deadline.
- **US-28:** As a student, I want to retry problems within a lesson after reading feedback, so that I can correct my understanding before moving on.

#### Home & dashboard
- **US-29:** As a student, I want a home screen showing my streak, XP, and recommended next lesson, so that I know what to do as soon as I open the app.
- **US-30:** As a student, I want to see my username and profile animal on my profile, so that the app feels like mine.

#### Mobile & accessibility
- **US-31:** As a student on my phone, I want the app to work on a small screen with touch input, so that I can study between classes without a laptop.
- **US-32:** As a student on my phone, I want interactive elements to respond smoothly to touch, so that simulations and drag problems feel natural on mobile.
- **US-36:** As a student on any device, I want the layout to adapt to my screen size (phone, tablet, or desktop), so that the app is usable and readable regardless of how I access it.

#### Session & account management
- **US-33:** As a returning user, I want to stay logged in across browser visits, so that I do not have to sign in every time I open the app.
- **US-34:** As a user, I want to sign out of my account, so that I can secure my session on a shared device.
- **US-35:** As a new user choosing a username, I want to be told immediately if my username is already taken, so that I can pick another without restarting sign-up.

## TECH STACK

Phase 1 stack, based on the recommendations in [`Phase 1`](Phase%201). Choices below are locked in for the MVP.

### Phase 1 (MVP)

| Layer | Choice | Purpose |
|---|---|---|
| **Frontend** | React | UI, lesson renderer, course path, dashboard |
| **Styling** | Responsive CSS (e.g. Tailwind or CSS modules) | Layout adapts to phone, tablet, and desktop breakpoints |
| **Interactive visuals** | D3.js + SVG | Dice, coins, Venn diagrams, grids, charts, and other probability simulations |
| **Backend** | Firebase | Auth, database, hosting |
| **Authentication** | Firebase Auth | Email/password sign-up; Google OAuth; session persistence |
| **Database** | Cloud Firestore | User profiles, lesson progress, streaks, XP, mastery state |
| **Hosting** | Firebase Hosting | Deployed public web app |
| **Content** | JSON lesson files | Structured lesson format — each lesson is a sequence of steps (concept → problem → feedback) |

### How each layer maps to the product

**React** renders the app shell, course path, home dashboard, auth flows, and the lesson step engine. Each step type (concept, problem, feedback) is a React component driven by the JSON content model. The UI is **responsive** — it reflows based on viewport width (mobile-first, scales up to tablet and desktop).

**D3.js + SVG** powers manipulable probability visuals — sample space grids, coin/die simulations, Venn diagrams, counting widgets. SVG keeps interactions sharp on mobile; D3 handles data binding and transitions for real-time visual updates.

**Firebase Auth** supports the account flows defined in Accounts & Profiles:
- Email + password sign-up
- Google sign-in
- Persistent sessions across browser visits

**Cloud Firestore** stores:
- User profile (username, profile animal, email)
- Per-lesson progress (current step, completed, attempts)
- Streak and XP totals
- Last-active date for streak calculation

**JSON lesson format** example structure:

```json
{
  "id": "1.1",
  "chapter": 1,
  "title": "What is an experiment?",
  "steps": [
    { "type": "concept", "content": "..." },
    { "type": "problem", "interaction": "dice-tap", "config": {}, "answer": {}, "feedback": { "correct": "...", "incorrect": "...", "hint": "..." } }
  ]
}
```

Lessons are authored by hand from the MIT 18.600 lecture notes. No AI generation in Phase 1.

**Firebase Hosting** serves the built React app at a public URL for MVP delivery and testing.

### Phase 2+ (out of scope for MVP)

Not built in Phase 1, but noted for later per the Phase 1 brief:

| Layer | Options |
|---|---|
| AI | OpenAI or Anthropic Claude for hints and problem generation |
| Math engine | SymPy or math.js for ground-truth answer checks |

## SUCCESS METRICS

The MVP is successful when learners can actually learn from the app — not just click through it. Metrics are grouped by category.

### Learning outcomes

- A student can **complete a full lesson** end-to-end without abandoning
- After completing a lesson, the student **understands the core concepts** well enough to explain them in their own words
- A student can **answer problems without using hints** on material covered in the lesson
- Wrong answers are part of learning — the student can **recover using feedback** and still finish the lesson successfully

### Feedback quality

- Feedback appears **immediately** after submitting an answer (no noticeable delay)
- Correct answers confirm **why** the reasoning is right, not just "Correct"
- Wrong answers include a **specific explanation** of the mistake
- Authored **hints are available** when stuck but are not required to complete the lesson
- Feedback helps the student **course-correct**, not just mark errors

### Interactivity quality

- Each lesson includes at least **one genuinely manipulable problem** (drag, tap, slider, simulation) — not only multiple choice
- Interactive elements **respond in real time** to user input (e.g. dice grid updates, Venn regions shade, coin flips animate)
- The interaction **teaches the concept** — manipulating the visual is part of understanding, not decoration
- The UI **adapts to screen size** — usable on phone, tablet, and desktop without horizontal scrolling or broken layouts
- Touch interactions work naturally on **smaller screens**; mouse/keyboard work on larger screens

### Content coverage

- **All 6 chapters** from Lectures 1 and 2 have at least **one complete interactive lesson**
- Each lesson is authored from the **MIT 18.600 lecture notes** (Lecture 1.pdf, Lecture 2.pdf)
- Lessons follow the **course path order** defined in the MVP section

### Engagement (streaks & XP)

- **XP is awarded** when a student completes a lesson or solves a problem
- **Streak increments** when a student completes qualifying daily activity (problems or a full lesson)
- Streak and XP totals are **visible on the home screen**
- Streak and XP **persist** after the student logs out and back in

### MVP acceptance tests

These are pass/fail checks for the MVP demo:

1. A learner completes a lesson end-to-end, gets problems wrong, and **recovers using authored feedback**
2. A learner **manipulates an interactive element** and sees the visual update in real time
3. A learner **leaves mid-lesson** and returns to find **progress and streak intact**
4. A learner finishes a lesson and sees a **sensible next-lesson recommendation** on the course path
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
- Lectures beyond **Lecture 1 and Lecture 2** (no Lecture 3+, no full 18.600 course)
- Subjects beyond **Probability and Random Variables**
- Video lectures or passive video-based lessons
- Completion certificates, course credits, or formal accreditation
- Problem sets, exams, or grading integration with MIT course systems

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