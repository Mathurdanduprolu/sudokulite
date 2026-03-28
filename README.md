# SudokuLite 6

SudokuLite 6 is a production-ready, premium-styled 6-number Sudoku-inspired puzzle web app built with Next.js. It includes a deterministic daily challenge feel, difficulty levels, hints, mistakes tracking, timer, score, keyboard/touch controls, and polished visual effects.

## Features

- 6×6 board with numbers **1–6**.
- Rule constraints enforced via generated valid solution and unique-solution puzzle carving.
- Difficulty levels: **Easy / Medium / Hard**.
- Daily challenge endpoint (`/api/daily`) with deterministic seed.
- Mistake detection (wrong placements highlighted and tracked).
- Hint system.
- Reset and New Game controls.
- Pause/resume gameplay timer.
- Completion celebration and score calculation.
- Responsive UI optimized for desktop and mobile.
- Keyboard support (1-6, arrows, backspace/delete, `H` for hint).

## Tech Stack

- **Next.js 14** (full-stack app + API routes)
- **React 18**
- **TypeScript**
- CSS (custom premium styling)

## Project Scripts

- `npm run dev` - Start local development server.
- `npm run build` - Build production bundle.
- `npm run start` - Start production server (uses `PORT` env var).
- `npm run lint` - Run linting.

## Local Setup

1. Install Node.js 18.18+ (Node 20+ recommended).
2. Clone repo and install dependencies:
   ```bash
   npm install
   ```
3. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```
4. Run development mode:
   ```bash
   npm run dev
   ```
5. Open the shown URL from terminal (typically `http://localhost:3000`).

## Production Run Locally

```bash
npm run build
PORT=3000 npm run start
```

## Railway Deployment (Step-by-Step)

1. Push this project to GitHub.
2. In Railway, click **New Project** → **Deploy from GitHub repo**.
3. Select this repository.
4. Railway should auto-detect Node/Next app. If asked, set:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm run start`
5. Add environment variables in Railway Project Settings:
   - `DAILY_SEED_SALT` (optional but recommended; set a stable secret-like value)
6. Deploy.
7. Railway automatically injects `PORT`; this app uses it via the `start` script and Next runtime.

## Railway Notes

- No localhost hardcoding is used for API calls (frontend calls relative `/api/daily`).
- `PORT` is respected in production startup.
- No external database required.
- Daily puzzles are deterministic by date, difficulty, and `DAILY_SEED_SALT`.

## Environment Variables

| Name | Required | Description |
| --- | --- | --- |
| `DAILY_SEED_SALT` | No | Optional salt to stabilize/customize daily puzzle generation |

See `.env.example`.

## API

### `GET /api/daily`

Query params:
- `difficulty`: `easy` | `medium` | `hard` (default: `medium`)
- `date`: `YYYY-MM-DD` (default: current UTC date)

Returns JSON payload with puzzle, solution, and metadata.

## Troubleshooting Railway Deployments

1. **Build fails due to Node version:**
   - Ensure Node 18.18+ is available (Railway Node runtime generally supports this).
2. **App boots but no response:**
   - Confirm Start Command is `npm run start`.
   - Confirm build succeeded (`npm run build`).
3. **Different daily puzzle behavior across environments:**
   - Set consistent `DAILY_SEED_SALT` in all environments.
4. **Blank UI due to stale build cache:**
   - Trigger a redeploy and clear build cache in Railway.

## Commands to Run

```bash
npm install
npm run build
npm run start
```
