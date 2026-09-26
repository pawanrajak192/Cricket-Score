# Cricket Scorecard API — Node + Express + MySQL

Backs the `../frontend` (formerly the root of this zip) app: accounts and
match persistence for signed-up users. Guests never touch this server —
per the spec, guest matches stay in the browser's `localStorage` only.

## Setup

```bash
cd server
npm install
cp .env.example .env      # then edit DB_PASSWORD, JWT_SECRET, etc.
```

Create the database and tables:

```bash
npm run migrate
```

(This just runs `sql/schema.sql` against the MySQL server in your `.env`.
You can run `sql/schema.sql` by hand with the `mysql` CLI instead if you
prefer.)

Start the API:

```bash
npm run dev      # auto-restarts on file changes
# or
npm start
```

It listens on `http://localhost:4000` by default. Check `GET /api/health`.

## Endpoints

| Method | Path                    | Auth | Purpose |
|--------|-------------------------|------|---------|
| POST   | `/api/auth/signup`      | —    | `{name, email?, mobile?, password}` → `{token, user}` |
| POST   | `/api/auth/login`       | —    | `{identifier, password}` (identifier = email or mobile) → `{token, user}` |
| GET    | `/api/auth/me`          | ✓    | current user |
| GET    | `/api/matches`          | ✓    | matches owned by the current user |
| POST   | `/api/matches`          | ✓    | create/upsert a match (client sends the full match object, including its own `id`) |
| PUT    | `/api/matches/:id`      | ✓    | update a match you own (used after every scored ball) |
| DELETE | `/api/matches/:id`      | ✓    | delete a match you own |
| GET    | `/api/matches/public/:id` | —  | read-only fetch for the shareable scorecard link — no login needed |

Auth = send `Authorization: Bearer <token>`.

## Data model note

`matches.team_a`, `team_b`, `toss`, `innings` and `result` are stored as
MySQL `JSON` columns holding exactly what the frontend's ball-by-ball engine
produces (see `frontend/src/engine/scoringEngine.js`). That engine — not the
server — is the source of truth for how an event log turns into a score, so
the server just persists and returns whatever shape the client sends.

This is a deliberate v1 tradeoff: it gets you real MySQL persistence with a
small surface area. If you outgrow it, the natural next step is an `events`
table (`match_id, innings_index, seq, payload JSON`) so the server can run
`deriveInningsState`-equivalent logic itself, enable multi-scorer conflict
resolution, and support partial/incremental sync instead of sending the
whole match on every ball.

## Security notes for going further

- Passwords are hashed with bcrypt; never stored in plain text.
- Add rate limiting on `/api/auth/*` before deploying publicly.
- `JWT_SECRET` in `.env.example` is a placeholder — generate a real random
  string (`openssl rand -hex 32`) for any real deployment.
