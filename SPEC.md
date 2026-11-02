# SPEC.md — AI Mystery Room

> **Document type:** Product + Technical Specification  
> **Project:** AI Mystery Room  
> **Status:** MVP specification  
> **Primary stack:** MERN (MongoDB, Express, React, Node.js)  
> **AI:** Gemini API for structured mystery generation, with server-side AI media-generation adapters for images and audio

---

## 1. Project Overview

### 1.1 Product summary

**AI Mystery Room** is an AI-powered interactive detective game. A player provides a short fictional scenario, incident, or story premise. The backend uses AI to turn that premise into a complete mystery with a fixed culprit, a cast of suspects, a coherent timeline, and a collection of AI-generated evidence.

The player investigates the case by examining evidence such as:

- **Chat evidence:** fictional messenger-style conversations, including message timestamps and participants.
- **Image evidence:** AI-generated photographs, scene images, objects, documents, or other visual clues.
- **Audio evidence:** AI-generated call recordings or voice notes, with an accessible transcript.

The player compares the evidence with suspect statements, requests limited hints, and finally accuses one suspect. The backend checks the accusation and reveals the culprit, the explanation, and the player's score.

The AI is the **case creator and hidden culprit/solution engine**. The culprit is selected during case generation and remains fixed for the entire game. The AI must not change the culprit later to fit the player's actions.

### 1.2 Problem statement

Traditional mystery games often provide fixed stories and clues. AI Mystery Room lets players turn their own story ideas into new, replayable detective challenges. It combines narrative generation with multiple evidence formats so that solving a case feels like an investigation rather than a simple multiple-choice quiz.

### 1.3 Product goal

Deliver a deployed web application in which a user can:

1. Submit a short mystery premise.
2. Select a difficulty level.
3. Receive a complete AI-generated case with suspects and multimedia evidence.
4. Investigate evidence and request hints.
5. Submit one final accusation.
6. See the verdict, true culprit, explanation, and score.

### 1.4 Target users

- People who enjoy detective stories, escape rooms, puzzles, and mystery games.
- Students and casual players looking for short, replayable challenges.
- Users who want to turn their own fictional story idea into a mystery.

### 1.5 Core experience principles

- **Fair mystery:** the culprit must be inferable from evidence, not chosen arbitrarily after the accusation.
- **Evidence-first gameplay:** every major conclusion must be supported by evidence the player can inspect.
- **Multimedia investigation:** each case includes generated chat, image, and audio evidence according to its difficulty.
- **No premature spoilers:** the culprit, solution, and private reasoning stay on the server until the accusation is submitted.
- **Fast and understandable:** the player should always know what to do next and what progress has been made.
- **Fictional content only:** generated conversations, images, and recordings are fictional game assets, not genuine records or proof of real events.

---

## 2. Scope

### 2.1 MVP features — required

1. Landing page with a clear explanation and a **Create Mystery** action.
2. Mystery creation form with premise input and difficulty selection.
3. AI-generated case title, introduction, suspects, timeline, evidence, and hints.
4. Generated chat evidence displayed in a conversation-style viewer.
5. Generated image evidence displayed in an image viewer.
6. Generated audio evidence playable in an audio player, with a transcript for accessibility.
7. Investigation room with evidence categories, discovered-state indicators, and progress.
8. Hint request system with a difficulty-based limit.
9. Accusation screen where the player selects one suspect.
10. Backend-validated verdict and score.
11. Results screen with the correct culprit and explanation after accusation.
12. Ability to start a new case.
13. Responsive layout and useful loading, empty, and error states.

### 2.2 Optional enhancements — only after the MVP works

- Player accounts and saved case history.
- Leaderboard and player statistics.
- Timed investigation mode.
- Case sharing through a shareable link.
- Additional evidence types, such as emails, CCTV-style clips, receipts, maps, or documents.
- Follow-up questions to a suspect, provided answers are constrained by the generated case facts and cannot change the solution.
- Sound design, animations, achievements, and daily mystery challenges.

### 2.3 Out of scope for the MVP

- Real police, forensic, or legal use.
- Uploading or investigating real people's private messages, photographs, or recordings.
- Live phone calls or real WhatsApp integration.
- User-generated voice cloning or impersonation of real people.
- Multiplayer or real-time co-op investigation.
- An AI that invents new case facts during the investigation.

---

## 3. Users and User Stories

### 3.1 Primary user story

> As a player, I want to enter a short story premise and receive a complete mystery with suspects and AI-generated evidence, so that I can investigate the case and identify the culprit.

### 3.2 Supporting user stories

- As a player, I want to choose Easy, Medium, or Hard so that the case matches my experience.
- As a player, I want to inspect chat messages, images, and audio recordings so that I can compare evidence from different sources.
- As a player, I want to mark evidence as discovered and track my progress.
- As a player, I want to request a limited hint when I am stuck.
- As a player, I want to accuse a suspect and receive a clear explanation of whether I was correct.
- As a player, I want to start another mystery without refreshing or breaking the application.

---

## 4. Game Rules and Difficulty

### 4.1 Difficulty configuration

The following counts are mandatory for every successfully generated case.

| Difficulty | Suspects | Evidence items (clues) | Chat items | Image items | Audio items | Hints |
|---|---:|---:|---:|---:|---:|---:|
| Easy | 3 | 5 | 2 | 2 | 1 | 2 |
| Medium | 4 | 7 | 3 | 2 | 2 | 3 |
| Hard | 5 | 9 | 3 | 3 | 3 | 3 |

**Evidence-count rule:** every evidence item counts as one clue for discovery and scoring. The three evidence formats are all required; a case is not ready if any required media item is missing.

### 4.2 Mystery-generation rules

The generated case must contain:

- A unique case ID and title.
- A short case introduction explaining what happened and why it needs investigation.
- The exact number of suspects required by the selected difficulty.
- A public profile for each suspect: name, role/relationship to the incident, short description, and initial statement or alibi.
- A coherent event timeline.
- The exact number and distribution of evidence items from the difficulty table.
- The configured number of hints, ordered from subtle to more direct.
- One fixed culprit selected from the suspect list.
- A solution explanation that connects the culprit, motive, opportunity, and evidence.

The case must be solvable. At least two independent evidence items must materially support the true culprit. Evidence should also challenge at least one misleading suspect theory or apparent alibi. Red herrings are allowed, but they must be explainable and must not contradict the actual solution.

### 4.3 Evidence-format requirements

**Chat evidence**
- Display as a clearly fictional messenger-style conversation.
- Include participant display names, message text, and plausible timestamps.
- Preserve message order and any clue-bearing edits, deletions, or gaps.
- Do not imply that the conversation came from a real person's account.

**Image evidence**
- Must be produced by an AI image-generation provider through the backend.
- Include a title and a short player-facing description.
- The image must visibly contain the visual detail referenced by the case logic.
- Store the generated asset in configured media storage and save its URL/reference in MongoDB.

**Audio evidence**
- Must be produced by an AI audio/speech-generation provider through the backend.
- Include a playable audio asset and a text transcript.
- Use fictional, generic synthetic voices. Do not clone or imitate a real person.
- The audio and transcript must agree on all clue-bearing details.

All player-facing media must be marked **AI-generated fictional evidence** in the interface. Use a messenger-inspired interface, not a claim that the application is connected to WhatsApp or another real messaging service.

### 4.4 Discovery rules

- The investigation room lists all evidence items by category.
- Before discovery, the player sees only the evidence title, type, and a short teaser if one exists.
- When the player opens an item and selects **Add to Evidence Board** (or the equivalent discovery action), the backend marks it as discovered and returns its player-facing content.
- A discovery is counted only once. Re-opening an already discovered item must not add points again.
- The frontend must not decide whether an item is discovered; it must use the backend response.

### 4.5 Hint rules

- Hints are provided in order, one at a time.
- Each hint should guide the player toward a useful comparison or observation without directly naming the culprit.
- The backend controls the hint count and hint content.
- The same hint request must not deduct points more than once. Use a server-side counter and make requests safe against duplicate submissions.
- A player cannot request more hints than allowed for the selected difficulty.

### 4.6 Accusation rules

- The player can submit one final accusation per case.
- The accused suspect ID must belong to the case.
- After submission, the case becomes completed and further accusations are rejected.
- The result reveals the true culprit and the complete explanation, whether the accusation was correct or incorrect.
- The player cannot change the accusation after seeing the result.

### 4.7 Scoring rules

| Difficulty | Correct accusation base points |
|---|---:|
| Easy | 100 |
| Medium | 150 |
| Hard | 200 |

Additional scoring:

- Each uniquely discovered evidence item: **+5 points**.
- Each hint used: **−10 points**.
- Incorrect accusation: **0 base points**.
- Final score cannot be below **0**.

**Formula:**

`score = max(0, (isCorrect ? difficultyBasePoints : 0) + (uniqueDiscoveredEvidenceCount * 5) - (hintsUsed * 10))`

The backend calculates and stores the final score. The frontend may display a live estimate, but the result returned by the server is authoritative.

---

## 5. End-to-End User Flow

1. **Landing:** the user opens the website and sees what AI Mystery Room does.
2. **Create:** the user selects **Create Mystery**.
3. **Enter premise:** the user enters a short scenario/story and selects Easy, Medium, or Hard.
4. **Generate:** the frontend sends the request to the Express API. The backend validates the input, asks Gemini for a structured case, validates the result, generates the required images and audio, and stores the case and media references.
5. **Ready state:** once all required case content and media are available, the player is taken to the investigation room.
6. **Investigate:** the player reviews the story, timeline, suspect profiles, and evidence list. The player opens evidence and discovers it.
7. **Request hint:** the player may request a hint, subject to the case limit.
8. **Accuse:** the player selects one suspect and confirms the accusation.
9. **Evaluate:** the backend checks the suspect ID, determines correctness, calculates the score, and completes the case.
10. **Results:** the frontend displays the verdict, true culprit, explanation, score breakdown, and evidence that supports the solution.
11. **Replay:** the player can create a new mystery.

### 5.1 Case state machine

`GENERATING → READY → COMPLETED`

A generation failure results in `FAILED`. A failed case cannot be investigated or accused. A completed case cannot be modified or accused again.

---

## 6. UI and Page Specifications

### 6.1 Shared visual direction

Use a polished detective-investigation aesthetic: dark charcoal/navy surfaces, restrained accent colors, readable typography, evidence-card layouts, subtle animations, and clear hierarchy. The interface should feel atmospheric without sacrificing readability or accessibility.

The visual theme must not reduce contrast or make the evidence difficult to inspect. Use consistent status labels for **New**, **Discovered**, **Locked/Unavailable**, **Generating**, and **Completed**.

### 6.2 Page: Home / Landing

**Purpose:** Explain the game and get the player started.

**Required elements:**
- Product name and short tagline.
- One-paragraph explanation of the experience.
- Primary **Create Mystery** button.
- Short feature highlights: AI-generated cases, multimedia evidence, suspect investigation.
- Brief note that all cases and evidence are fictional and AI-generated.

**Actions:**
- Create Mystery → `/create`.

### 6.3 Page: Create Mystery

**Purpose:** Collect the premise and difficulty.

**Required elements:**
- Text area labelled **Describe your mystery**.
- Helpful example premise.
- Character counter and validation message.
- Difficulty selector: Easy, Medium, Hard.
- Difficulty details showing suspect/evidence/hint counts.
- **Generate Mystery** button.

**Validation:**
- Premise is required.
- Minimum length: 20 characters.
- Maximum length: 1,200 characters.
- Trim leading/trailing whitespace.
- Reject empty or whitespace-only input.

**Loading behavior:**
- Disable duplicate submission while generating.
- Show a progress state such as “Building the case”, “Creating evidence”, and “Preparing the investigation room”. Do not claim a step is complete until the backend reports it.
- Provide a clear error and retry action if generation fails.

### 6.4 Page: Investigation Room

**Purpose:** Main gameplay screen.

**Layout areas:**

1. **Case header:** case title, difficulty, status, and short incident summary.
2. **Story/timeline:** incident details and known events.
3. **Suspect panel:** suspect cards with names, roles, descriptions, and public alibis/statements.
4. **Evidence board:** categories for Chats, Images, and Audio; each item shows its title, type, and discovery state.
5. **Evidence viewer:** displays the selected evidence in the correct format.
6. **Hint panel:** remaining hint count, request button, and revealed hints.
7. **Progress area:** discovered evidence count and progress indicator.
8. **Accuse action:** visible once the player is ready; opens the accusation flow.

**Evidence viewer behavior:**
- Chat: show the conversation in chronological order with clear sender labels and timestamps.
- Image: show the AI-generated asset with zoom or a larger preview where practical.
- Audio: provide play/pause, duration, progress, and a transcript toggle or transcript panel.
- Display the fictional/AI-generated evidence label.
- Provide useful fallback text if an asset cannot load; do not silently pretend a missing image/audio asset exists.

### 6.5 Component: Suspect Card

Must show:
- Suspect name.
- Relationship/role.
- Short public description.
- Public statement/alibi.
- A clear action or selection state where relevant.

Must not show:
- Whether the suspect is the culprit.
- Private motive or hidden reasoning unless the player-facing story explicitly reveals it after completion.

### 6.6 Component: Evidence Card

Must show:
- Evidence title.
- Evidence type icon/label.
- Discovery status.
- Short teaser where appropriate.
- Open/inspect action.

Must not show undiscovered evidence content or private evidence-to-culprit mappings.

### 6.7 Page/Modal: Accusation

**Purpose:** Confirm the player's final suspect choice.

**Required elements:**
- List of suspects with selectable cards/radio controls.
- Selected suspect clearly highlighted.
- Warning that this is the final accusation and cannot be changed.
- **Submit Accusation** button.
- Confirmation step before final submission.

Disable submission until one suspect is selected. Prevent repeated submissions while the request is in progress.

### 6.8 Page: Results

**Purpose:** Reveal and explain the outcome.

**Required elements:**
- Correct/incorrect verdict for the player's accusation.
- Player's selected suspect.
- True culprit.
- Explanation of motive, opportunity, and how the evidence fits together.
- Evidence references supporting the solution.
- Score total and breakdown: base points, discovered evidence points, hint deductions.
- **Create Another Mystery** button.

Only the completed result endpoint may return the true culprit and private solution explanation.

### 6.9 Responsive and accessibility requirements

- Work on desktop, tablet, and mobile screen sizes.
- Use keyboard-accessible controls and visible focus states.
- Provide accessible labels for form fields and media controls.
- Audio evidence must have a readable transcript.
- Images must have meaningful alt text that does not spoil hidden evidence before discovery.
- Do not rely on color alone to communicate status.
- Respect reduced-motion preferences.

---

## 7. Technology Stack and Architecture

### 7.1 Required stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React + Vite | Pages, components, routing, game state, media viewers |
| Styling | Tailwind CSS | Responsive UI and design system |
| Routing | React Router | Navigation between game pages |
| HTTP client | Axios or Fetch | Frontend-to-backend communication |
| Backend | Node.js + Express | API, sessions, game rules, AI orchestration |
| Database | MongoDB + Mongoose | Cases, evidence, progress, results |
| Text AI | Gemini API (`@google/genai`) | Structured case, suspect, evidence-script, hint, and solution generation |
| Validation | Zod | Validate API inputs and AI-generated structured output |

### 7.2 AI media generation

Gemini is the primary text/reasoning model for generating the structured mystery. Images and audio must also be AI-generated, so the backend must use server-side **image-generation** and **audio/speech-generation** adapters.

The adapters should expose simple internal functions such as:

- `generateEvidenceImage(prompt, metadata)`
- `generateEvidenceAudio(script, voiceConfig)`
- `storeGeneratedAsset(file, metadata)`

Keep provider-specific code behind these adapters. This allows the project to change media providers without rewriting the case-generation or frontend code. Confirm the chosen providers' current API access, pricing, and usage limits before implementation.

**Important:** API keys for Gemini and media providers must exist only on the backend. Never call paid AI-generation APIs directly from React.

### 7.3 High-level architecture

`React UI → Express REST API → Case Service → Gemini / Media Adapters → MongoDB + Media Storage`

- The frontend renders only public case data.
- The backend owns case generation, validation, evidence discovery, hint usage, accusation checking, and scoring.
- MongoDB stores structured case data and media references.
- Generated image/audio files live in media storage; MongoDB stores their URLs or storage keys, not large binary files.
- A private solution record is kept separate from the public case record.

### 7.4 Suggested source structure

```text
ai-mystery-room/
├── client/
│   ├── src/
│   │   ├── app/                 # App setup and route configuration
│   │   ├── pages/               # Home, Create, Investigation, Results
│   │   ├── components/          # Shared UI components
│   │   ├── features/
│   │   │   ├── case/            # Case creation and case state
│   │   │   ├── evidence/         # Evidence board and viewers
│   │   │   ├── suspects/        # Suspect cards and selection
│   │   │   └── scoring/         # Score display
│   │   ├── services/            # API client and API functions
│   │   ├── hooks/               # Reusable React hooks
│   │   └── utils/               # Formatting and helpers
│   └── .env.example
│
├── server/
│   ├── src/
│   │   ├── config/              # Environment and database config
│   │   ├── models/              # Mongoose models
│   │   ├── routes/              # Express route definitions
│   │   ├── controllers/         # Request/response handlers
│   │   ├── services/            # Game rules and business logic
│   │   ├── ai/
│   │   │   ├── gemini.service.js
│   │   │   ├── image.adapter.js
│   │   │   └── audio.adapter.js
│   │   ├── validators/          # Zod request and AI-output schemas
│   │   ├── middleware/           # Auth/session, validation, errors, rate limits
│   │   ├── utils/                # Sanitization and response serializers
│   │   └── app.js
│   ├── .env.example
│   └── package.json
│
├── SPEC.md
└── README.md
```

---

## 8. Backend Data Model

### 8.1 Design rule: separate public case from secret solution

The public case and private solution must be stored separately. Do not include `culpritId`, private reasoning, answer mappings, or unrevealed hints in a document returned by a normal case API.

Recommended collections:

1. `MysteryCases` — player-visible case information and public evidence.
2. `CaseSolutions` — private culprit, private explanation, evidence reasoning, and unrevealed hints.
3. Optional `CaseSessions` — access/session metadata if anonymous sessions are used.

### 8.2 MysteryCase document — public data

```js
{
  _id: ObjectId,
  title: String,
  premise: String,
  difficulty: "easy" | "medium" | "hard",
  status: "generating" | "ready" | "failed" | "completed",
  story: String,
  timeline: [
    {
      time: String,
      event: String
    }
  ],
  suspects: [
    {
      suspectId: String,
      name: String,
      role: String,
      description: String,
      publicStatement: String
    }
  ],
  evidence: [
    {
      evidenceId: String,
      type: "chat" | "image" | "audio",
      title: String,
      teaser: String,
      publicContent: Object,
      mediaUrl: String,
      transcript: String,
      discoveredAt: Date | null
    }
  ],
  progress: {
    discoveredEvidenceIds: [String],
    hintsUsed: Number
  },
  accusation: {
    suspectId: String | null,
    submittedAt: Date | null,
    isCorrect: Boolean | null
  },
  score: {
    total: Number | null,
    basePoints: Number | null,
    evidencePoints: Number | null,
    hintPenalty: Number | null
  },
  createdAt: Date,
  updatedAt: Date,
  completedAt: Date | null
}
```

Implementation note: `publicContent`, `mediaUrl`, and `transcript` should be returned only after that evidence item is discovered. Store the content in MongoDB if desired, but construct a restricted response DTO so undiscovered content is not serialized accidentally.

### 8.3 CaseSolution document — private data

```js
{
  _id: ObjectId,
  caseId: ObjectId,
  culpritId: String,
  culpritMotive: String,
  privateSolutionExplanation: String,
  evidenceReasoning: [
    {
      evidenceId: String,
      significance: String,
      supportsCulprit: Boolean
    }
  ],
  hints: [String],
  createdAt: Date
}
```

This collection must never be returned by ordinary case endpoints. Only the accusation/result service may read it internally. The result API may expose a curated solution payload after the case is completed.

### 8.4 Data integrity rules

- `culpritId` must match exactly one suspect in the case.
- Every `evidenceId` must be unique within its case.
- Every evidence item must have a valid type and the correct type-specific content.
- Evidence counts and hint counts must match the difficulty configuration.
- `discoveredEvidenceIds` must contain only IDs belonging to the case, without duplicates.
- `hintsUsed` cannot be negative or exceed the allowed hint count.
- A case can have only one final accusation.
- Completed cases are immutable except for administrative maintenance.

---

## 9. AI Generation Specification

### 9.1 Generation pipeline

1. Validate and normalize the user's premise and difficulty.
2. Load the difficulty configuration.
3. Send Gemini a structured generation request with the exact counts and mystery rules.
4. Parse the model response as JSON; do not accept free-form prose as the canonical case object.
5. Validate the response with Zod.
6. Run application-level consistency checks.
7. Store public case data in `MysteryCases` and secret answer data in `CaseSolutions`.
8. Generate each image from its image prompt and each audio recording from its audio script.
9. Store media assets and update their references.
10. Mark the case `ready` only after all required content and media have succeeded.
11. Return a public case response to the frontend.

If AI output fails validation, retry generation once with the validation errors. If it still fails, mark generation as failed and show a retry option. Do not save an invalid or partially solvable case as `ready`.

### 9.2 Required AI output shape

The AI generation service should produce a structured object similar to the following. The actual Zod schema must enforce all required fields and exact counts.

```json
{
  "title": "The Last Train Home",
  "story": "A fictional incident summary...",
  "timeline": [
    { "time": "8:10 PM", "event": "..." }
  ],
  "suspects": [
    {
      "suspectId": "suspect_1",
      "name": "A fictional name",
      "role": "Colleague",
      "description": "Public description...",
      "publicStatement": "I left before the incident..."
    }
  ],
  "evidence": [
    {
      "evidenceId": "evidence_1",
      "type": "chat",
      "title": "A Late-Night Conversation",
      "teaser": "A conversation from the evening of the incident.",
      "chat": {
        "participants": ["Person A", "Person B"],
        "messages": [
          { "sender": "Person A", "timestamp": "8:14 PM", "text": "..." }
        ]
      },
      "imagePrompt": null,
      "audioScript": null
    },
    {
      "evidenceId": "evidence_2",
      "type": "image",
      "title": "The Office Desk",
      "teaser": "A photograph taken after closing time.",
      "chat": null,
      "imagePrompt": "A detailed prompt for a fictional visual clue...",
      "audioScript": null
    },
    {
      "evidenceId": "evidence_3",
      "type": "audio",
      "title": "Recorded Voice Note",
      "teaser": "A short voice note recorded on the night.",
      "chat": null,
      "imagePrompt": null,
      "audioScript": {
        "spokenText": "The exact fictional dialogue to synthesize...",
        "voiceDescription": "A generic adult voice, calm and natural.",
        "durationTargetSeconds": 20
      }
    }
  ],
  "hints": [
    "Subtle hint...",
    "More direct hint..."
  ],
  "privateSolution": {
    "culpritId": "suspect_2",
    "motive": "Private motive...",
    "explanation": "Full solution explanation...",
    "evidenceReasoning": [
      {
        "evidenceId": "evidence_1",
        "significance": "Private explanation of what this clue proves.",
        "supportsCulprit": true
      }
    ]
  }
}
```

The example is illustrative. The backend must reject missing fields, duplicate IDs, unsupported evidence types, incorrect counts, invalid suspect references, and evidence whose required media prompt/script is absent.

### 9.3 Prompt rules for Gemini

The server-side generation prompt must instruct Gemini to:

- Treat the user premise as fictional story inspiration, not as a claim about a real person or event.
- Generate exactly the suspect, evidence, media-type, and hint counts required by the chosen difficulty.
- Choose exactly one culprit from the suspect list before the game begins.
- Keep all names, places, conversations, and recordings fictional.
- Create a logically consistent timeline and avoid contradictory timestamps.
- Ensure at least two independent evidence items support the culprit.
- Make red herrings plausible but ultimately explainable.
- Ensure the correct answer can be deduced from the public evidence.
- Write audio scripts that match their transcripts and clue logic.
- Write image prompts that include a visible, unambiguous clue relevant to the case.
- Return valid JSON matching the requested schema, without markdown fences or extra commentary.
- Never change the culprit based on later player actions.

### 9.4 Application-level consistency checks

Do not rely only on the model's claim that the mystery is coherent. The backend should verify:

- Exact difficulty counts.
- Unique suspect and evidence IDs.
- The culprit belongs to the suspect list.
- Every private evidence reasoning reference points to an existing evidence item.
- Every image evidence item has a non-empty image prompt and generated image asset.
- Every audio evidence item has a non-empty audio script, generated audio asset, and transcript.
- Every chat evidence item has at least two participants and one or more messages.
- At least two evidence items support the culprit.
- Every hint is non-empty and the hint count is exact.
- Timeline entries and evidence timestamps do not create impossible chronology.

If a generated image does not visibly match the intended clue, regenerate it or fail that media item. Do not silently substitute unrelated stock imagery.

---

## 10. API Specification

Base path: `/api`

All endpoints return JSON. Use a consistent response envelope and appropriate HTTP status codes. Protect case routes with the case's server-issued session/access credential. The examples below omit that credential for readability.

### 10.1 `POST /api/cases` — Create a mystery

**Request**

```json
{
  "premise": "A museum curator is found locked inside the gallery after a rare watch disappears.",
  "difficulty": "medium"
}
```

**Validation**
- `premise`: string, 20–1,200 characters after trimming.
- `difficulty`: `easy`, `medium`, or `hard`.

**Success response** — `202 Accepted` if generation is asynchronous:

```json
{
  "success": true,
  "data": {
    "caseId": "case_object_id",
    "status": "generating"
  }
}
```

The backend may instead return `201 Created` with a ready public case if generation is completed synchronously. The frontend must support a generating state either way.

### 10.2 `GET /api/cases/:caseId` — Get case and player progress

Returns the public case summary, suspects, timeline, difficulty, generation status, progress, and evidence metadata. For each evidence item, return its title, type, teaser, and discovery status. Return full evidence content only for already discovered items.

**Must never return:** culprit ID, solution explanation, private evidence reasoning, unrevealed hints, or raw `CaseSolution` data.

### 10.3 `POST /api/cases/:caseId/evidence/:evidenceId/discover` — Discover evidence

**Request:** empty JSON body.

**Behavior:** validate ownership/session and IDs; mark the evidence discovered if it is not already discovered; return the evidence's player-facing content. The operation must be idempotent.

**Success response**

```json
{
  "success": true,
  "data": {
    "evidenceId": "evidence_1",
    "discovered": true,
    "newlyDiscovered": true,
    "evidence": {
      "type": "chat",
      "title": "A Late-Night Conversation",
      "content": {}
    },
    "progress": {
      "discoveredCount": 1,
      "totalEvidence": 7
    }
  }
}
```

If already discovered, return `newlyDiscovered: false` and do not add another five points.

### 10.4 `POST /api/cases/:caseId/hints` — Request next hint

**Request:** empty JSON body.

**Behavior:** return the next permitted hint and increment `hintsUsed` once. Reject if all hints have been used or the case is not ready.

**Success response**

```json
{
  "success": true,
  "data": {
    "hintNumber": 1,
    "totalHints": 3,
    "hint": "Compare the time in the voice note with the timeline."
  }
}
```

Never return all hints in the normal case response.

### 10.5 `POST /api/cases/:caseId/accuse` — Submit final accusation

**Request**

```json
{
  "suspectId": "suspect_2"
}
```

**Behavior:**
- Verify the case is ready and not already completed.
- Verify the suspect belongs to the case.
- Compare the selected suspect with the private culprit ID.
- Calculate the score on the backend.
- Store the accusation and mark the case completed.
- Return the result payload only after completing the case.

**Success response**

```json
{
  "success": true,
  "data": {
    "isCorrect": true,
    "accusedSuspectId": "suspect_2",
    "culprit": {
      "suspectId": "suspect_2",
      "name": "Fictional Suspect"
    },
    "explanation": "The full solution explanation...",
    "supportingEvidence": [
      {
        "evidenceId": "evidence_1",
        "title": "A Late-Night Conversation",
        "significance": "This establishes the critical timeline detail."
      }
    ],
    "score": {
      "total": 175,
      "basePoints": 150,
      "evidencePoints": 35,
      "hintPenalty": 10
    }
  }
}
```

### 10.6 `GET /api/cases/:caseId/result` — Get completed result

- Return `409 CASE_NOT_COMPLETED` before accusation.
- Return the stored result after completion.
- Re-fetching the result must not recalculate or change the score.

### 10.7 `GET /api/health` — Health check

Return service status and database connectivity status. Do not expose environment variables, credentials, or internal stack traces.

### 10.8 Standard error response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please enter a mystery premise between 20 and 1,200 characters."
  }
}
```

Suggested error codes:

| HTTP status | Code | Meaning |
|---:|---|---|
| 400 | `VALIDATION_ERROR` | Invalid input or malformed request |
| 401 | `UNAUTHORIZED_CASE_ACCESS` | Missing/invalid case credential |
| 404 | `CASE_NOT_FOUND` | Case or evidence does not exist |
| 409 | `CASE_NOT_READY` | Case generation is still running or failed |
| 409 | `CASE_ALREADY_COMPLETED` | Accusation already submitted |
| 409 | `HINT_LIMIT_REACHED` | No hints remaining |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
| 502 | `AI_PROVIDER_ERROR` | AI provider failed or returned unusable output |

---

## 11. Security, Privacy, and Abuse Prevention

This section is mandatory. The game is not complete if the solution can be read from the browser before an accusation.

### 11.1 Protect the solution

- Keep `CaseSolutions` separate from `MysteryCases`.
- Never include the culprit, private hints, private reasoning, or solution in `GET /api/cases/:caseId`.
- Never send the complete raw Gemini response to the frontend.
- Use explicit response serializers/DTOs that whitelist public fields.
- Do not place the culprit in HTML, React state, hidden inputs, script variables, source maps, or client-side constants.
- Do not log full AI responses or private solution data in production logs.
- Reveal the solution only after the backend has accepted the final accusation.

### 11.2 Protect API credentials

- Store provider keys in backend environment variables.
- Do not commit `.env` files.
- Add `.env` to `.gitignore`.
- Provide `.env.example` with placeholder values only.
- Never put Gemini or media provider keys in variables prefixed with `VITE_`.

### 11.3 Case access

For the MVP, user registration is optional. Use a server-issued per-case credential (preferably an HTTP-only secure cookie) so that knowing a MongoDB case ID alone is not enough to modify or read a private game session. Configure CORS and cookie settings correctly for the deployed frontend/backend domains.

### 11.4 Input and request protection

- Validate every request with Zod or equivalent server-side validation.
- Trim and length-limit the premise.
- Rate-limit case creation, hint requests, and accusation requests.
- Validate MongoDB IDs and all case-scoped suspect/evidence IDs.
- Avoid constructing database queries from untrusted objects.
- Use generic error responses; do not expose stack traces or provider secrets.
- Make discovery and accusation operations safe against duplicate requests.

### 11.5 Media and fictional content

- Treat all generated evidence as fictional and label it accordingly.
- Use synthetic voices that do not impersonate identifiable real people.
- Do not generate or accept non-consensual private recordings or real private-message exports.
- Do not use generated content to accuse real people of crimes.
- Restrict media upload/storage formats and file sizes if user uploads are introduced in a later version.

---

## 12. Frontend State and Navigation

### 12.1 Suggested routes

| Route | Page |
|---|---|
| `/` | Home |
| `/create` | Create Mystery |
| `/case/:caseId` | Investigation Room |
| `/case/:caseId/accuse` | Accusation |
| `/case/:caseId/result` | Results |

### 12.2 State ownership

- Server owns case status, suspects, evidence availability, discovered IDs, hints used, accusation, culprit, and score.
- React owns temporary UI state such as selected evidence tab, open modal, selected suspect before confirmation, and current media playback state.
- Refreshing the investigation route must reload the case from the backend and restore progress.
- Do not trust local storage or client state for scoring or game rules.

### 12.3 Navigation rules

- Do not allow the result page to reveal information if the backend says the case is not completed.
- If a case is generating, show the generation state rather than the investigation room.
- If a case ID is invalid or access is unauthorized, show a friendly recovery page.
- Preserve the current case during a page refresh.
- Starting another mystery creates a new case; it must not overwrite an existing case accidentally.

---

## 13. Non-Functional Requirements

### 13.1 Performance

- Normal page navigation and non-AI API calls should feel responsive.
- AI generation may take longer; show progress and prevent duplicate generation submissions.
- Load image/audio evidence only when needed rather than downloading every asset on initial page load.
- Use media compression and appropriately sized assets.

### 13.2 Reliability

- Handle Gemini timeouts, invalid JSON, image/audio generation failures, MongoDB outages, and media-storage failures.
- Do not mark a case ready until all required evidence is available.
- A failed generation must be identifiable and recoverable through a retry or a clear restart action.
- Use server-side state as the source of truth.

### 13.3 Maintainability

- Keep routes/controllers thin; put game and AI logic in services.
- Keep provider integrations behind adapters.
- Keep request and AI response schemas in a validation layer.
- Use reusable frontend components for evidence cards, suspect cards, hints, and media viewers.

### 13.4 Compatibility

- Support current versions of major desktop and mobile browsers.
- Ensure audio playback works with standard HTML audio controls or a tested custom player.
- Do not rely on autoplay for audio evidence.

---

## 14. Environment Configuration

Example backend `.env.example`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_selected_gemini_model
IMAGE_PROVIDER_API_KEY=your_image_provider_key
AUDIO_PROVIDER_API_KEY=your_audio_provider_key
MEDIA_STORAGE_URL=your_media_storage_configuration
SESSION_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

Example frontend `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Only the API base URL belongs in the frontend environment. All secrets belong in the backend environment.

---

## 15. Testing Strategy

### 15.1 Unit tests

Test at minimum:

- Premise validation and difficulty selection.
- Difficulty count configuration.
- AI-output Zod validation.
- Culprit/suspect reference validation.
- Evidence discovery idempotency.
- Hint limit enforcement.
- Accusation validation.
- Score calculation for correct and incorrect accusations.
- Public-case serializer does not expose secret fields.

### 15.2 API integration tests

Test:

- Create a case with each difficulty.
- Retrieve a generating and ready case.
- Retrieve a case without exposing the culprit.
- Discover an evidence item twice; points are awarded only once.
- Request hints until the limit; the next request is rejected.
- Submit an invalid suspect ID; request is rejected.
- Submit a valid accusation; result is correct and score is stored.
- Submit a second accusation; request is rejected.
- Request results before completion; solution is not returned.
- Request results after completion; the same stored result is returned.

### 15.3 End-to-end test

Complete one full game in the browser:

1. Open the home page.
2. Create a mystery using a premise.
3. Select each difficulty in separate test runs.
4. Confirm the exact suspect, evidence, and hint counts.
5. Open and discover chat, image, and audio evidence.
6. Play audio and read its transcript.
7. Request a hint.
8. Submit an accusation.
9. Confirm the verdict, culprit explanation, and score.
10. Start a new mystery.
11. Refresh during an active case and confirm progress is retained.

### 15.4 Security test

Before submission, inspect browser DevTools Network responses and page source while a case is active. Confirm that no response, HTML, React state, or frontend bundle contains the culprit ID or solution explanation before accusation.

---

## 16. Acceptance Criteria / Definition of Done

The MVP is accepted only when all required criteria below pass.

### Product and gameplay

- [ ] A user can create a mystery from a premise between 20 and 1,200 characters.
- [ ] Easy, Medium, and Hard cases can be generated.
- [ ] Each case has the exact suspect, evidence, media-type, and hint counts specified in Section 4.
- [ ] Every case includes AI-generated chat, image, and audio evidence.
- [ ] Audio evidence has a working player and matching transcript.
- [ ] The player can inspect and discover evidence.
- [ ] Reopening evidence does not award duplicate points.
- [ ] The player can request hints up to the allowed limit.
- [ ] The player can submit one final accusation.
- [ ] The results page shows the verdict, correct culprit, explanation, and score breakdown.
- [ ] The player can start a new case.

### AI quality

- [ ] AI output is structured and validated before it is saved as a ready case.
- [ ] The mystery has exactly one fixed culprit.
- [ ] The solution is logically supported by at least two independent evidence items.
- [ ] Chat, image, audio, transcript, timeline, and solution details do not contradict one another.
- [ ] Failed or invalid AI generation is handled gracefully.

### Security and backend

- [ ] Gemini and media provider keys are not exposed in the frontend.
- [ ] The culprit and private solution are not exposed before accusation.
- [ ] Discovery, hint usage, accusation validation, and scoring happen on the backend.
- [ ] A case cannot be accused more than once.
- [ ] Unauthorized users cannot access or modify another player's case.

### UI and deployment

- [ ] The application is responsive on desktop and mobile.
- [ ] Loading, error, empty, and completed states are implemented.
- [ ] The deployed frontend can communicate with the deployed backend.
- [ ] Production environment variables are configured securely.
- [ ] MongoDB is connected in production.
- [ ] The full game has been tested on the live website.

---

## 17. Build Order

Build incrementally. Do not generate the entire application in one step.

### Milestone 1 — Project foundation

- Create Vite React client and Express server.
- Configure Tailwind, React Router, Axios/Fetch, environment variables, and MongoDB.
- Add health-check endpoint and verify frontend/backend connectivity.

### Milestone 2 — Core case model and API

- Create `MysteryCase` and `CaseSolution` models.
- Implement request validation and public response serializers.
- Implement case retrieval and session access protection.
- Write tests proving the solution is hidden.

### Milestone 3 — Text mystery generation

- Integrate Gemini on the backend.
- Implement the strict JSON schema and Zod validation.
- Generate suspects, timeline, chat scripts, hints, and private solution.
- Validate exact difficulty counts and logical references.

### Milestone 4 — AI-generated media

- Implement image and audio provider adapters.
- Generate image assets and audio recordings from the case scripts.
- Store assets and references.
- Mark cases ready only when all required media is available.

### Milestone 5 — Frontend investigation experience

- Build Home and Create Mystery pages.
- Build Investigation Room, suspect cards, evidence board, and media viewers.
- Connect discovery and hint actions to backend APIs.
- Restore case state after refresh.

### Milestone 6 — Accusation, results, and scoring

- Build the final accusation confirmation flow.
- Implement backend accusation checking and score calculation.
- Build Results page and new-case action.

### Milestone 7 — Test, secure, and deploy

- Run unit, integration, end-to-end, and solution-leak tests.
- Configure production environment variables and media storage.
- Deploy backend and frontend; connect MongoDB Atlas.
- Test a complete case on the live website.

---

## 18. Deployment Plan

Suggested deployment arrangement:

- **Frontend:** Vercel.
- **Backend:** Render, Railway, or another Node.js-compatible host.
- **Database:** MongoDB Atlas.
- **Media storage:** a production object-storage/media service for generated image and audio files.

Deployment requirements:

- Configure the production frontend URL in backend CORS settings.
- Configure all backend environment variables in the hosting dashboard.
- Use HTTPS in production.
- Configure secure case-session cookies for the deployed domains.
- Verify media URLs are accessible to the intended player and do not expose private provider credentials.
- Run the full acceptance checklist against the production website.

---

## 19. Final Deliverables

1. `SPEC.md` — this product and technical specification.
2. Complete GitHub repository containing client and server source code.
3. Deployed live website URL.
4. Working AI-generated mystery experience with chat, image, and audio evidence.
5. Verified end-to-end demo showing case creation, investigation, accusation, verdict, and score.
6. `README.md` with setup instructions, environment variables, architecture summary, and deployment details.

**Project submission form:** https://bit.ly/ai-mystery-room-sub-form  
**Submission deadline provided in the project brief:** 2 November, 11:59 PM.

---

## 20. Key Implementation Decisions (Do Not Break These)

1. **The culprit is fixed at generation time.** Never select or change the culprit after the player accuses someone.
2. **The solution stays on the backend.** Keep private solution data separate and never serialize it in active-case responses.
3. **All three evidence types are required.** Chat, image, and audio evidence must be AI-generated for every ready case.
4. **The backend is authoritative.** It controls discovery, hints, accusation, completion state, and score.
5. **Generated assets must match the story.** A file existing is not enough; its content must support the intended clue and agree with the transcript/timeline.
6. **Do not sacrifice core functionality for visual effects.** Build and test the complete game flow before adding elaborate animations or optional features.
7. **A case is not ready until it is playable.** Invalid logic, missing media, or inconsistent evidence must result in a generation failure/retry—not a broken investigation room.

**End of specification.**
