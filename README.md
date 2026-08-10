# Trailhead

**Focus on what matters.**

Trailhead is an AI-powered learning roadmap generator built to help people beat procrastination when starting something new. Tell it what you want to learn, and it breaks the goal down into phases and bite-sized, actionable milestones — each with a tiny first step, a "why now" motivational nudge, and curated learning resources.

Built as a final year major project.

---

## How it works

1. You enter a learning goal (e.g. *"learn Python"*), a target timeframe, your skill level, and how many hours per day you can commit.
2. Trailhead picks a structural template for your goal (coding, language learning, or a general fallback) and personalizes it phase by phase using Google's Gemini AI.
3. Each phase is broken into milestones — with a description, a **micro first step** (the smallest possible action to beat activation-energy procrastination), a **"why now"** motivational line, a time estimate, and relevant resources (videos, articles, courses).
4. You check milestones off as you complete them, track your overall progress, and build a daily streak.

---

## Tech stack

**Backend**
- Node.js / Express
- MongoDB + Mongoose
- JWT authentication, bcrypt password hashing
- Joi request validation
- Google Gemini API (`@google/genai`) for AI-generated milestones, using structured JSON schema output
- `helmet`, `cors`, `express-rate-limit` for security/abuse protection

**Frontend**
- React + Vite
- Zustand for state management
- React Router
- Axios (with JWT interceptor + automatic 401 handling)
- Tailwind CSS
- lucide-react icons

**Hosting**
- Backend: [Render](https://render.com)
- Frontend: [Vercel](https://vercel.com)
- Database: [MongoDB Atlas](https://www.mongodb.com/atlas)

---

## Project structure

```
trailhead/
├── backend/
│   └── src/
│       ├── server.js              # entry point
│       ├── app.js                 # Express app setup
│       ├── models/                # Mongoose schemas (User, Roadmap, Phase, Milestone)
│       ├── controllers/           # route handlers
│       ├── routes/                # route definitions
│       ├── services/              # business logic (AI generation, templates, progress/streaks)
│       ├── middlewares/           # auth, validation, error handling, rate limiting
│       ├── validators/            # Joi schemas
│       └── utils/                 # AppError, helpers
└── frontend/
    └── src/
        ├── pages/                 # IntakeForm, Dashboard, RoadmapDetail, Login, Register
        ├── components/            # Navbar, PhaseAccordion, MilestoneCard, NextTaskCard
        ├── store/                 # Zustand store
        └── api/                   # apiClient (axios instance)
```

---

## Data model

```
Roadmap (goal, targetTimeframe, skillLevel, hoursPerDay, status)
  └── Phase (title, order)
        └── Milestone (title, description, microFirstStep, whyNow,
                        suggestedTimeBox, resources[], isCompleted, order)
```

Skill level and hours-per-day are captured **per roadmap**, not fixed at signup — a user's context (time available, familiarity) reasonably differs across different goals.

---

## Getting started (local development)

### Prerequisites
- Node.js 18+
- A MongoDB connection string (local or [Atlas](https://www.mongodb.com/atlas))
- A [Gemini API key](https://ai.google.dev/)

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret_string
JWT_EXPIRES_IN=30d
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

Run it:

```bash
node src/server.js
# or, with auto-restart on changes:
nodemon src/server.js
```

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Run it:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## API overview

Base URL: `/api/v1`. All routes under `/roadmaps` and `/milestones` require a JWT bearer token (`Authorization: Bearer <token>`), obtained from `/auth/login` or `/auth/register`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Log in |
| POST | `/roadmaps` | Create a roadmap and kick off AI generation (async — returns immediately with `status: "generating"`) |
| GET | `/roadmaps` | List the current user's roadmaps |
| GET | `/roadmaps/:id` | Get a roadmap with its phases, milestones, and progress |
| GET | `/roadmaps/:id/next` | Get the next incomplete milestone |
| PATCH | `/roadmaps/:id/abandon` | Mark a roadmap as abandoned |
| DELETE | `/roadmaps/:id` | Delete a roadmap and its phases/milestones |
| PATCH | `/roadmaps/:id/phases/:phaseId/regenerate` | Regenerate a single phase's milestones |
| PATCH | `/milestones/:id` | Toggle a milestone's completion status |

Roadmap generation is asynchronous: the API responds immediately (`202`) with the roadmap in a `generating` state, and the frontend polls `GET /roadmaps/:id` until the status becomes `active` (or `abandoned`, if generation failed).

---

## Notable design decisions

- **Async roadmap generation.** Generating milestones for every phase via the AI takes 15–40 seconds. Rather than blocking the request, roadmap creation returns immediately and generation runs in the background; the frontend polls until it's ready.
- **Hybrid generation approach.** Phase structure comes from predefined templates (keyword-matched to the goal); milestone content within each phase is generated by AI, constrained to a strict JSON schema. This keeps output structurally reliable while still personalizing content.
- **Cleanup on generation failure.** If AI generation fails partway through, any partially-created phases/milestones for that roadmap are cleaned up and the roadmap is marked `abandoned`, rather than left in an inconsistent state.
- **Per-roadmap preferences.** Skill level and available hours are supplied at roadmap creation, not fixed at the account level, since they vary by goal.
- **Ownership checks on every mutation.** Milestone and roadmap updates verify the requesting user actually owns the resource (traversing `Milestone → Phase → Roadmap → User` where needed) before allowing changes.

---

## Deployment

- **Backend** deploys to Render from the `backend/` directory (`npm install` build command, `node src/server.js` start command). Environment variables are set directly in Render's dashboard.
- **Frontend** deploys to Vercel from the `frontend/` directory, with `VITE_API_BASE_URL` pointing at the deployed backend.
- CORS on the backend is restricted to the deployed frontend's origin.

---
