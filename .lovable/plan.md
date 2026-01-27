

## Palliative Care Gamified Learning Platform — Implementation Plan

### Project Overview
A web-based gamified learning application for healthcare professionals to develop palliative care clinical judgment through case-based scenarios. The platform uses a dual-scoring system (formative micro-feedback + summative macro-points) to assess reasoning patterns while maintaining learner engagement through badges, progression unlocking, and exploration incentives.

---

### 🎨 Design System

**Color Palette:**
- **Primary (Dark Purple):** #311460 — Headers, navigation, sidebar, primary buttons
- **Accent (Orange):** #E65825 — CTAs, highlights, gamification elements (points, badges, progress)
- **Light Purple (Background):** #FBFAFD — Main content backgrounds
- **Medium Purple:** #DBD2EB — Cards, secondary backgrounds, dividers
- **Light Orange:** #FBE9E6 — Subtle highlights, hover states, notifications

**Visual Style:** Warm & Approachable
- Friendly, rounded UI elements to reduce learner anxiety
- Encouraging micro-copy and supportive feedback language
- Generous white space for readability
- Soft shadows and gentle transitions

**Theme Support:** Light mode by default with user-toggleable dark mode

---

### 📱 Screen-by-Screen Breakdown

#### 1. Landing / Case Select Screen
- Welcome message with learner-friendly introduction
- Case 1 card with patient overview (Adam, 72, recurrent cancer)
- Prominent "Start Case" button in orange accent
- HUD preview showing points/badges placeholders
- Visual preview of the case journey ahead

#### 2. Case Flow Shell (Main Learning Interface)
**Layout:** Header + Sidebar + Main Content Area

**A. Sticky Patient Baseline Header**
- Always visible: Patient name, age, diagnosis, living situation, PPS
- Collapsible to show only name/age when minimized
- Dark purple background with white text

**B. Chart Notes Sidebar (Left)**
- Collapsible sidebar with medical chart aesthetic
- Progressive reveal — new entries appear as learner advances
- Timestamp-based entries with clinical formatting
- Scroll support for growing content

**C. Main Content Area**
- **Person in Context Section** — "About Adam" with image, caption, and narrative
- **Opening Scene** — Immersive narrative text with optional patient video/image
- **MCQ Component** — Decision stem + 5 options (A-E), select exactly 2
  - Selection counter: "Selected: 1/2"
  - Submit button (disabled until 2 selected)
  - Clear visual feedback on selection state

#### 3. Cluster Feedback / Debrief Panel
After MCQ submission, display an accordion with 5 sections:
- 💡 **Rationale** — Why this reasoning matters
- 🎯 **Known Outcomes** — What research shows
- 🧠 **Thinking Pattern** — Cognitive approach identified
- 🔍 **Reasoning Trace** — Step-by-step logic analysis
- 📚 **Evidence Anchors** — Links to supporting research

**Features:**
- Progress counter: "2/5 sections viewed"
- Checkmarks when section is read (5+ seconds dwell time)
- "Retry MCQ" and "Continue" buttons (disabled until all sections viewed)
- Exploratory token display: "●●●○○ (3/5)"

#### 4. IP Insights Modal (Mandatory)
Triggered by prominent "🔍 IP Insights" button in header

**4 Perspectives (Tabs/Cards):**
1. **Nurse** perspective
2. **Care Aide** perspective
3. **Wound Care Specialist** perspective
4. **MRP (Most Responsible Practitioner)** perspective

**Engagement Tracking:**
- Each perspective requires: Open → 5+ seconds dwell → "Mark as Reflected" button
- Progress indicator: "Viewed: 2/4 perspectives"
- "Complete Case" button disabled until all 4 viewed
- Awards 2 points when complete

#### 5. HUD (Heads-Up Display)
Persistent top bar showing:
- Current Level & Case indicator
- Points earned: "52/67 pts (78%)"
- Badge progress: ⭐⭐☆☆☆
- Correct tokens & exploratory tokens
- Click badges → opens Badge Gallery modal

**Gamification Elements:**
- Orange accent for active progress
- Subtle animations on point/token gains
- Celebratory effects when badges unlock

#### 6. Simulacrum Screen (Between Levels)
**Choice Screen:**
- 3 topic cards with title, focus, patient name, duration
- Radio selection (choose 1 of 3)
- "Continue" button when selected

**Quiz Flow:**
- 4 single-selection MCQs (A/B/C/D format)
- Immediate correct/incorrect feedback per question
- Score summary: Pass (3/4) = 10 pts, Perfect (4/4) = 15 pts
- Retry or switch topic option if failed

#### 7. Case Completion Summary
- Celebratory badge display with animations
- Points breakdown (Case + IP Insights + Simulacrum)
- Standard vs Premium badge status
- Exploratory tokens collected
- Attempt history visualization
- "Next Steps" guidance with Level 2 preview (stub for MVP)

#### 8. Badge Gallery Modal
- Grid layout of all badges (earned + locked)
- Locked badges shown grayed out with unlock conditions
- Full-screen celebration when new badge earned
- Categories: Case badges, Premium badges, Simulacrum badges

---

### 🔧 Technical Implementation

#### Content Pipeline (Schema v1.1)
- Zod-based schema validation for case JSON
- Content loader fetching from `/content/{caseId}.json`
- Runtime error messaging for invalid/missing content
- Stub data fallbacks so UI renders without JSON files
- Support for: openingScene media, chartEntry renderType, patientPerspective videoNote, personInContext imageAlt/caption

#### State Management
- React Context for global state (points, badges, unlocks)
- Local storage persistence with SCORM fallback ready
- MCQ attempt history tracking
- Token accumulation (correct + exploratory)
- Multi-tab conflict detection (warning message)

#### Scoring Engine
- MCQ: 2 selections from 5 options, scores of 0/1/2/5 per option
- Cluster mapping: Score 10=A, 7/4=B, ≤6=C
- Correct token: Only when score=10
- Exploratory tokens: 1 per unique option viewed
- Badge thresholds: 5Q case = 35 pts (standard), 50 pts (premium)

---

### 🚀 MVP Scope
- Level 1, Case 1 (5 MCQs)
- 3 Simulacra options (learner chooses 1)
- All core UI components functional with stub data
- Theme toggle (light/dark)
- Responsive design (desktop-first, tablet-friendly)

---

### 📋 Deliverables Summary
1. Design system with purple/orange palette implemented in Tailwind
2. Landing page with case selection
3. Full case flow UI (baseline header, chart sidebar, MCQ component)
4. Debrief accordion with tracking
5. IP Insights modal with 4 perspectives
6. HUD with gamification display
7. Simulacrum selection and quiz flow
8. Completion summary with badge gallery
9. Content schema validation (Zod)
10. State management foundation
11. Light/Dark theme toggle

