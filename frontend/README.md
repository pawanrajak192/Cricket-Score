# Crease — Live Cricket Scorecard

React + Vite + Tailwind. Ball-by-ball scoring engine, auth, match history,
player career stats, and a public read-only scorecard link.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL. `npm run build` produces a static production build.

## How it's organized

- `src/engine/scoringEngine.js` — the scoring core. Every ball and wicket is
  stored as an **event**; score, batter/bowler stats and who's on strike are
  always *derived* by replaying the event log (`deriveInningsState`). This is
  what makes Undo, refresh-recovery and edit history safe — nothing is ever
  hand-mutated.
- `src/engine/statsEngine.js` — rolls completed matches up into career
  batting/bowling/fielding numbers for the Player Performance page.
- `src/store/useStore.js` — Zustand store, persisted to `localStorage`. Holds
  accounts and every match. Auth here is intentionally simple (local accounts,
  no server) so v1 works fully offline — see "Going to a real backend" below.
- `src/pages/*` — Landing, Login, Signup, Dashboard, CreateMatch (3-step
  wizard), Toss, LiveScoring (the scoring screen), Scorecard (public, at
  `/match/:id`), PlayerProfile.

## What's implemented

- Email/mobile/password signup+login, or Continue as Guest
- Multi-step match creation: details → teams (with captain/keeper) → rules
- Toss + opening lineup selection
- Live scoring: 0/1/2/3/4/6, wide, no-ball, bye, leg-bye, wicket (with
  dismissal type, fielder, next-batter picker), Undo
- Automatic strike rotation, over completion + forced new-bowler selection
- Auto-save on every ball (writes through Zustand's localStorage persistence)
- Full batting/bowling scorecards, second-innings chase (target/required
  run-rate), match result, simple Player of the Match
- Match history with status/type filters, Continue / Delete / Share
- Shareable public scorecard link (`/match/:id`, read-only, no login needed)
- Player career page with a Recharts runs-per-innings chart

## Deliberately simplified for v1

- **Test matches**: scoring logic is identical, but only 2 innings are wired
  up end-to-end and there's no declaration/follow-on flow — treat "Test" as
  unlimited-overs custom for now.
- **Player of the Match**: a simple runs + wickets×20 heuristic, not a real
  judge's pick.
- **Partnerships / match timeline**: not built yet — the event log has
  everything needed to add these later (each event carries both batters'
  ids and the over/ball it happened on).
- **Edit an arbitrary past ball**: Undo removes the *last* event; a full
  "edit ball N" UI isn't built, though the event-log design supports it.

## Backend (MySQL)

`server/` is a separate Node + Express + MySQL API for signed-up users'
accounts and match storage — see `server/README.md` for setup. Guest
matches stay local-only in the browser, as the spec asks.

## Going to a real backend

`src/store/useStore.js` is local-first and already wired to `server/`: it
updates the UI immediately, then syncs to the API in the background for
anyone who isn't a guest (see `src/api/client.js`). It's the only frontend
file that knows a server exists — every page only ever calls the store.

