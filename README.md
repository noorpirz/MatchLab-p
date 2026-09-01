# MatchLab

A student-focused matchmaking platform that suggests portfolio projects and step‑by‑step learning pathways. MatchLab combines a weighted scoring approach and AI-driven prompt templates to generate project ideas, learning pathways, and focused guidance.

Demo: (insert live demo URL)  
GIF: ![demo](path/to/demo.gif)

---

## Table of contents
- [What it is](#what-it-is)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture & key files](#architecture--key-files)
- [Run it locally](#run-it-locally)
- [Environment variables](#environment-variables)
- [Tests](#tests)
- [How I built it](#how-i-built-it)
- [Contributing & license](#contributing--license)
- [Contact](#contact)

## What it is
MatchLab helps CS students find practical project ideas and stepwise learning pathways tailored to their skills and interests, using an AI agent to generate project suggestions, learning steps, and contextual guidance.

## Features
- Generate ranked project ideas from a user profile (`POST /generate`)
- Generate a step‑by‑step learning pathway for a chosen project (`POST /pathway`)
- Contextual, step‑level guidance (`POST /guidance`)
- Health and basic sanity endpoints (`GET /` and `GET /health`)
- Deterministic mock fallbacks so the demo works without an AI key

## Tech stack
- Languages: JavaScript (Node, React)
- Backend: Express (backend/server.js)
- Frontend: Create React App (frontend/)
- AI integration: Google Gemini SDK (`@google/generative-ai`) with mock fallbacks
- Dev tooling: dotenv, cors

## Architecture & key files
```
backend/
  server.js                 # Express server, registers routes, listens on 5055
  routes/generateRoutes.js  # Mounts endpoints: /, /health, /generate, /pathway, /guidance
  ai/ai_agent.js            # AI agent: generateProjects, generatePathway, generateGuidance + mock fallbacks
  ai/generateProjects.js    # Mock project generator used in some flows
  ai/scoring.js             # scoring utilities for matching/ranking
  ai/scoring.test.js        # scoring tests / integration checks
frontend/
  package.json              # Create React App frontend (dev server on :3000)
package.json                 # repo-level metadata (may contain upstream/legacy scripts)
```

How it fits together (runtime shape): the frontend calls the backend endpoints. The backend is a small REST service implemented in `backend/server.js` which mounts `backend/routes/generateRoutes.js` and calls functions in `backend/ai/ai_agent.js` (or the mock `backend/ai/generateProjects.js`). The AI agent calls Google Gemini when `GEMINI_API_KEY` is set and uses deterministic mock output otherwise so the project is demo‑able locally without credentials.

## Run it locally
1. Clone
```bash
git clone https://github.com/noorpirz/MatchLab-p.git
cd MatchLab-p
```

2. Backend
```bash
cd backend
npm install
# start server (listens on 5055)
node server.js
# or (if you prefer) use nodemon: npx nodemon server.js
```

3. Frontend (separate terminal)
```bash
cd frontend
npm install
npm start   # opens http://localhost:3000
```

Notes:
- The backend server listens on port `5055` by default (see `backend/server.js`).
- If you run the backend from the repo root, call: `node backend/server.js`.
- The server exposes endpoints: `GET /`, `GET /health`, `POST /generate`, `POST /pathway`, `POST /guidance`.
- `backend/ai/generateProjects.js` contains a mock generator (returns 1–2 example projects). The primary agent is `backend/ai/ai_agent.js`, which prefers Gemini (if `GEMINI_API_KEY` is set) and falls back to deterministic mocks when the key is missing or model output cannot be parsed.

## Environment variables
- `GEMINI_API_KEY` — Google Gemini API key (optional; if missing the server returns mock, deterministic suggestions)
- `PORT` — optional override for backend (server.js currently hardcodes `5055` unless you change it)
- Additional envs (if you add a DB later): `DATABASE_URL`, `JWT_SECRET`, etc.

Example `.env` (backend)
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5055
```

## Tests
- The repo includes `backend/ai/scoring.test.js` and `backend/ai/scoring.js` for scoring-related checks.
Run the test script directly:
```bash
node backend/ai/scoring.test.js
```

Note: the root `package.json` contains some upstream/legacy scripts (for example `test:scoring` references `ai/scoring.test.js` at the repo root). For clarity and reproducibility, prefer running the test file via the explicit path shown above.

## How it was built
- Implemented a small Express API with three AI-driven endpoints: `POST /generate` (project ideas), `POST /pathway` (structured learning plan), and `POST /guidance` (contextual help).
- Built a resilient AI wrapper (`backend/ai/ai_agent.js`) that:
  - Sends structured system prompts to Google Gemini when a key is present.
  - Safely parses JSON from model output and falls back to deterministic mock data if parsing or the key is missing.
- Included a small mock generator (`backend/ai/generateProjects.js`) so some routes can be demoed even without the model key.
- Wrote scoring utilities and tests under `backend/ai/` to keep ranking logic isolated and testable.

Design choices / tradeoffs:
- Deterministic fallback improves demoability (no secrets required) but is less creative than a live model — the README highlights both modes.
- The API returns structured JSON only, simplifying client parsing and UI rendering.
