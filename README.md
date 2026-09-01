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
- [Resume bullets](#resume-bullets)
- [Contributing & license](#contributing--license)
- [Contact](#contact)

## What it is
MatchLab helps CS students find practical project ideas and stepwise learning pathways tailored to their skills and interests, using an AI agent to generate project suggestions, learning steps, and contextual guidance.

## Features
- Generate ranked project ideas from a user profile (/generate)
- Generate a step‑by‑step learning pathway for a chosen project (/pathway)
- Contextual, step‑level guidance (/guidance)
- Health and basic sanity endpoints (/ and /health)
- Deterministic mock fallbacks so the demo works without an AI key

## Tech stack
- Languages: JavaScript (Node, React)
- Backend: Express (backend/server.js)
- Frontend: Create React App (frontend/)
- AI integration: Google Gemini SDK (@google/generative-ai) with mock fallbacks
- Dev tooling: dotenv, cors

## Architecture & key files
```
backend/
  server.js               # Express server, registers routes, listens on 5055
  routes/generateRoutes.js# Mounts endpoints: /, /health, /generate, /pathway, /guidance
  ai/ai_agent.js          # AI agent: generateProjects, generatePathway, generateGuidance + mock fallbacks
  ai/scoring.js           # scoring utilities for matching/ranking
  ai/scoring.test.js      # scoring tests / integration checks
frontend/
  package.json            # Create React App frontend (dev server on :3000)
package.json               # repo-level metadata; some scripts reference root, see notes
```

How it fits together (runtime shape): the frontend calls the backend endpoints (the backend is a small REST service implemented in backend/server.js which mounts generateRoutes that call functions in backend/ai/ai_agent.js). The AI agent calls Google Gemini when GEMINI_API_KEY is set and uses deterministic mock output otherwise so the project is demo‑able locally without credentials.

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
- The backend server listens on port 5055 by default (see backend/server.js).
- If you run the backend from the repo root, call: node backend/server.js
- The server exposes endpoints: GET /, GET /health, POST /generate, POST /pathway, POST /guidance

## Environment variables
- GEMINI_API_KEY — Google Gemini API key (optional; if missing the server returns mock, deterministic suggestions)
- PORT — optional override for backend (server.js currently uses 5055 by default)
- Additional envs (if you add a DB later): DATABASE_URL, JWT_SECRET, etc.

Example .env (backend)
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5055
```

## Tests
- scoring / integration script: backend/ai/scoring.test.js
Run from repo root:
```bash
node backend/ai/scoring.test.js
```
(Adjust to run inside backend/ if you add a package test script.)

## How I built it
- Implemented a small Express API with three AI-driven endpoints: generate (project ideas), pathway (structured learning plan), guidance (contextual help).
- Built a resilient AI wrapper (backend/ai/ai_agent.js) that:
  - Sends structured system prompts to Google Gemini when a key is present.
  - Safely parses JSON from model output and falls back to deterministic mock data if parsing or the key is missing.
- Wrote scoring utilities (backend/ai/scoring.js) to rank project ideas and tests (scoring.test.js) to verify deterministic behavior.

Design choices / tradeoffs:
- Deterministic fallback improves demoability (no secrets required) but is less creative than a live model — the README highlights both modes.
- The API returns structured JSON only, simplifying client parsing and UI rendering.

## Resume bullets
- Built a full-stack web application (React frontend, Node/Express backend) to match CS students to portfolio projects; implemented an AI-driven workflow and a weighted scoring approach to rank tailored project suggestions.
- Developed AI-driven learning pathways and contextual mentoring using structured JSON prompting for Google Gemini, with deterministic mock fallbacks to ensure reliable demos without an API key.

## Contributing & license
Contributions welcome — open an issue describing the change and submit a PR. Add a LICENSE file (MIT recommended) if you want public reuse.

## Contact
Maintainer: Noor Pirz — (add email or preferred contact)
GitHub: https://github.com/noorpirz/MatchLab-p
