# Calimove Migration Research

## What Calimove Is

A personal companion app for the **Cali Move: Mobility 2.0** program. The program has a fixed curriculum of flows and workouts — you can't change the exercises, only how you do them (duration, sets, reps). The app solves three main problems the official UI doesn't:

1. **Timer during workouts** — the official app only times when you're watching a follow-along video
2. **Navigation control** — skip or go back to an exercise/rep mid-workout
3. **Training log** — tracking which workouts you've done and when

---

## Data Model (current, from SQLite + SQLAlchemy)

```
Exercise
  exercise_id    int (PK)
  lecture_id     int (unique) — used to build calimove.com URLs
  name           str (unique)
  mod_lecture_id int? (unique) — lecture for the modifications video

Flow
  flow_id  int (PK)
  level    int           — e.g. 1, 2, 3
  name     str (A/B/C/D)

FlowExercise  (junction)
  flow_id     FK → Flow
  exercise_id FK → Exercise
  position    int — order of exercise within the flow

Workout
  workout_id  int (PK)
  lecture_id  int (unique) — the workout lecture on calimove.com
  flow_id     FK → Flow
  n_sets      int
  n_reps      int
  durations   str — semicolon-separated ints, one per exercise (e.g. "30;45;30")
  skip        bool — some workouts are excluded from the UI

Execution  (the training log)
  execution_id int (PK)
  workout_id   FK → Workout
  finished_at  datetime (server default = now)
```

Key insight: **durations is per-exercise**, not a single value. Different exercises in the same workout can have different active durations. This is stored as a semicolon-delimited string in SQLite but should become an integer array in Postgres.

---

## API Endpoints (current FastAPI backend, to be replaced by Supabase)

| Method | Path                     | Purpose                                            |
| ------ | ------------------------ | -------------------------------------------------- |
| GET    | `/exercises`             | All exercises with their flows (sorted by name)    |
| GET    | `/flows`                 | All flows with their exercises                     |
| GET    | `/flows/next`            | Next flow to practice (cycles by last execution)   |
| GET    | `/flows/{flow_id}`       | Flow + exercises + workouts sorted by duration     |
| GET    | `/workouts/{workout_id}` | Workout with exercises zipped with their durations |
| GET    | `/executions`            | Streak info + weekday distribution stats           |
| POST   | `/executions`            | Log a completed workout                            |

---

## Pages & Features

### Exercises (`/exercises`)

- Search by name (client-side filter)
- Exercise cards: name, image (`/exercise_images/exercise_{id}.png`), video link, mods link, flow chips
- Clicking a flow chip does nothing currently (TODO in old code)

### Flows (`/flows`)

- All flows listed, each with their exercises as cards in order
- Click flow title → flow detail

### Flow Detail (`/flows/:flow_id`)

- Shows exercises in the flow
- Shows available workout variants as buttons (each differs by sets/reps/duration)
- Workouts are sorted by total time, so the "middle" one is pre-selected
- "Start Workout" button → practice page

### Practice (`/practice/:workout_id`) — the core feature

**State machine:** `ready (8s) → workout (per-exercise duration) → rest (15s) → repeat`

- Displays current exercise: name, image, links to video/mods
- Countdown timer (MM:SS), state label ("Get ready…", "Go!", "Rest")
- Rep / Set counters (current / total)
- Prev Rep / Play-Pause / Next Rep buttons
- Space bar toggles play/pause
- Beep sound at 5s remaining in each phase
- **WakeLock** — prevents screen sleep while timer is running
- "Log Workout" button → POST /executions → redirects to log
- Link to follow-along video (adds `#lecture_content_complete_button` to URL)

**Timer constants:**

- `SECONDS_INITIAL = 8` (get ready before first exercise)
- `SECONDS_REST = 15` (between reps/exercises/sets)
- Beep at 5s remaining

### Log (`/log`)

- Max streak, current streak, total workouts done
- Weekday distribution (how over/under-represented each day is vs. expected 1/7)

---

## "Next Flow" Logic

The next flow to practice is determined by cycling through all flows in flow_id order. It finds the flow_id of the most recent execution and returns the next one. If at the end, it wraps back to the start.

---

## What the New Stack Replaces

| Old                        | New                                       |
| -------------------------- | ----------------------------------------- |
| Quasar (Vue 3 + Quasar UI) | Nuxt UI (Vue 3 + Nuxt UI)                 |
| Axios → FastAPI            | Supabase JS client                        |
| Python FastAPI             | Supabase (RLS + Edge Functions if needed) |
| SQLite                     | Supabase Postgres                         |
| AWS EC2 + EBS              | Supabase hosted                           |
| Vercel (frontend)          | Vercel (or same)                          |
| Local static images        | Supabase Storage (TBD)                    |

The static data (exercises, flows, workouts) was scraped from calimove.com and lives in `backend/data/calimove-mobility.sqlite` (the root-level one is empty). This will be migrated to Supabase Postgres as a one-time seed.

The only write operation is logging executions (`POST /executions`). Everything else is read-only from the scraped dataset.

### Actual data sizes (from SQLite)

| Table          | Rows                                 |
| -------------- | ------------------------------------ |
| exercises      | 83                                   |
| flows          | 12 (3 levels × 4 flows: A/B/C/D)     |
| flow_exercises | 120 (~10 exercises per flow)         |
| workouts       | 96 total, **60 skipped** → 36 active |
| executions     | 11 (from April–May 2024)             |

The `durations` field is a semicolon-separated string like `"40;40;40;40;40;60;40;40;60;60"` — one integer per exercise in the flow. In Postgres this becomes an `integer[]` array.

---

## Computed Values (currently done in Python, must move somewhere)

**`time_active`** = `n_sets × n_reps × sum(durations)` — total active exercise time in seconds

**`time_break`** = `(n_sets × n_reps × n_exercises - 1) × 15 + 16` — total rest time (16s = 8s initial + 3s finish + 5s buffer, 15s per break)

These are used to sort and label workout variants on the Flow Detail page. They can be computed in the frontend or as Postgres computed columns/views.

---

## Decisions

| #   | Topic                        | Decision                                                                                                                 |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | Data seeding                 | SQLite at `backend/data/calimove-mobility.sqlite` — confirmed, schema known                                              |
| 2   | Auth                         | Supabase Auth with **manual user approval** — no self-service signups; every registration must be confirmed by the owner |
| 3   | Exercise images              | Currently on S3 somewhere — to be clarified; placeholder approach until resolved                                         |
| 4   | "Next flow" logic            | Keep round-robin for now                                                                                                 |
| 5   | Log page                     | Keep minimal for now, expand later                                                                                       |
| 6   | UX scope                     | Decide per-feature during implementation                                                                                 |
| 7   | Flow chips on exercise cards | Undecided                                                                                                                |
| 8   | Mobile vs desktop            | Both equally important                                                                                                   |

### Auth detail

Supabase Auth will be used. Since this is a personal/small-group tool, new users must be manually approved by the owner. Implementation approach: **disable public signups** in Supabase dashboard, create users manually via the Supabase Auth admin panel. Executions will have a `user_id` column (FK to `auth.users`) so logs are per-user. All data read endpoints are public (exercises, flows, workouts are static), but `executions` reads/writes are protected by RLS to the authenticated user's own rows.

---

## Migration Rules (apply to all phases)

- **Commits:** Divide each phase into meaningful, focused commits — not too large
- **Tests:** Each commit includes tests where it makes sense to test the code
- **Verify:** Run `pnpm verify` (format + lint + typecheck + test) before every commit; it must pass
- **Approval:** Wait for explicit approval before committing
- **Phase completion:** Mark a phase as completed in this document once all its commits are approved

---

## Migration Plan

### Phase 1 — Supabase schema + seed ✅

**Goal:** Supabase Postgres contains all data; the old SQLite is no longer needed.

1. Create Supabase project
2. Write SQL migration for the production schema (schema: `calimove`):
   - `exercises`, `flows`, `flow_exercises`, `workouts` — static, public read (no RLS needed)
   - `executions` — `user_id uuid references auth.users`, RLS: users read/insert only their own rows
   - `durations` as `integer[]` (no more semicolon strings)
   - No `skip` column — skipped workouts are filtered out during seeding, never inserted
   - `execution_id` as UUID with `gen_random_uuid()` default
3. Generate TypeScript types from the schema: `supabase gen types typescript`
4. Write a one-time seed script (`scripts/seed.ts`) that:
   - Reads the SQLite file with `better-sqlite3`
   - Filters out `skip=1` workouts
   - Converts `durations` from `"30;45;30"` to `[30, 45, 30]`
   - Upserts all rows into Supabase
   - Migrates the 11 existing executions (assigning them to the owner's user UUID)
5. Enable RLS on `executions`; leave other tables open for anonymous read
6. In Supabase dashboard: disable "Allow new users to sign up"

**Deliverables:** `supabase/migrations/` SQL file, `scripts/seed.ts`, generated types at `src/types/database.ts`

---

### Phase 2 — Static data build step ✅

**Goal:** Exercises, flows, and workouts are baked into the app at build time — zero runtime Supabase reads for static content.

Since this data never changes, fetching it live on every page load is unnecessary overhead.

1. Write `scripts/generate-static-data.ts` — queries Supabase once and writes:
   - `src/data/exercises.json`
   - `src/data/flows.json` (includes exercises per flow)
   - `src/data/workouts.json` (includes per-exercise durations as arrays)
2. Add this script to the build pipeline (`pnpm build:data && pnpm build`)
3. Import JSON directly in composables — no Supabase call needed for read pages

Only `executions` (the training log) remains a live Supabase query.

This also enables **offline browsing** of exercises and flows with no extra work.

**Deliverables:** `scripts/generate-static-data.ts`, JSON data files, updated `package.json` scripts

---

### Phase 3 — Supabase client + live composables

**Goal:** Auth session and execution logging wired up via `@supabase/supabase-js`.

1. `src/lib/supabase.ts` — single typed client instance
2. `src/composables/useAuth.ts` — wraps `onAuthStateChange`, exposes `user`, `signIn`, `signOut`
3. `src/composables/useLog.ts` — fetches executions for current user, computes streaks + weekday stats client-side
4. `src/composables/useNextFlow.ts` — reads from static flows JSON, finds next flow_id after last execution
5. `logWorkout(workout_id)` utility — inserts execution with `auth.uid()`

Streak and weekday distribution logic (currently Python) moves to `src/utils/stats.ts`.

**Deliverables:** `src/lib/supabase.ts`, composables, `src/utils/stats.ts`

---

### Phase 4 — Auth pages + route guard

**Goal:** App requires login; unauthenticated users see only the login page.

1. `src/pages/login.vue` — email + password form using Nuxt UI
2. Router guard (via `vue-router/auto-routes` middleware): redirect to `/login` if no session
3. Header: show current user email + sign out button
4. `src/pages/admin.vue` — simple protected page (owner only) to invite new users via Supabase Admin API, avoiding the need to go to the Supabase dashboard

**Deliverables:** login page, admin page, router guard

---

### Phase 5 — Dashboard (home page)

**Goal:** Replace the exercises-as-home-page with a dashboard reflecting actual usage.

`src/pages/index.vue`:

- "Your next workout" card — uses `useNextFlow()`, shows flow name + a pre-selected workout variant
- "Start Workout" CTA navigates directly to the flow detail
- Quick stats: current streak, total workouts done
- Navigation to Exercises / Flows / Log

This makes the most common action (start next workout) one tap from opening the app.

---

### Phase 6 — Exercises page

Port `ExercisesPage` + `ExerciseCard` to Nuxt UI.

- `UInput` for name search (client-side filter over static JSON)
- Responsive card grid (mobile: 2 columns, desktop: 4–5)
- Exercise image URL: TBD (S3 or Supabase Storage — see Phase 9)
- "Video" / "Mods" links: `https://www.calimove.com/courses/1467532/lectures/{lecture_id}`
- Flow chips: behaviour TBD

---

### Phase 7 — Flows + Flow Detail pages

Port `FlowsPage` + `FlowPage` using static JSON data.

- Flows list with exercises in order
- Flow detail: exercise list + workout variant selector + "Start Workout" CTA
- Workout variant buttons display: total time, break time, sets, reps
- Pre-select the middle variant by total duration (same logic as before)

---

### Phase 8 — Practice page

The most complex page. Port `PracticePage` + `CountdownTimer` + `useWakeLock`.

`CountdownTimer` and `useWakeLock` are pure TS with no Quasar dependency — copy with minimal changes.

**State machine:**

```
ready (8s) → workout (durations[i]s) → rest (15s) → next rep/exercise/set → ... → finished
```

**New additions vs old app:**

- **Persist state to `localStorage`** — save `{workoutId, exerciseIdx, repIdx, setIdx}` on every transition; restore on mount if same workout. Prevents losing your place if the browser closes.
- **Progress indicator** — a progress bar showing position across all exercises × reps × sets
- **Vibration** — `navigator.vibrate([200])` at the beep point (alongside audio); useful when phone is face-down at the gym
- **Auto-log prompt on finish** — when state reaches `finished`, show a modal "Log this workout?" instead of requiring a manual button click
- Prev / Play-Pause / Next buttons
- Space bar shortcut
- Beep audio + vibration at 5s remaining
- WakeLock on play, release on pause

**Deliverables:** `src/pages/practice/[workout_id].vue`, `src/utils/CountdownTimer.ts`, updated `useWakeLock`

---

### Phase 9 — Log page

Port `LogPage`. Streak + weekday stats from `useLog()` (computed client-side from executions).

**New additions:**

- Recent workout history list (date + flow name) — the data is already being fetched, just display it
- Aggregate stats: max streak, current streak, total workouts, weekday distribution

Start here; expand further (calendar heatmap, per-flow breakdown) later.

---

### Phase 10 — Images

Resolve S3 situation:

- (a) Keep on S3 — just update the image URL pattern in components
- (b) Move to Supabase Storage — upload 83 images, update URL pattern

Placeholder until S3 location is confirmed. Image URL is used in one place: `exercise_${exercise_id}.png` pattern — changing it is a one-line update.

---

### Phase 11 — PWA / offline

**Goal:** App works fully offline once loaded.

With static data already baked in (Phase 2), only the executions need network. A service worker handles the rest.

1. Add `vite-plugin-pwa`
2. Configure to cache static assets + the JSON data files
3. Manifest: app name, icons, `display: standalone` for home screen install on mobile

**Deliverables:** PWA config in `vite.config.ts`, manifest, icons

---

### Pending

- Confirm S3 bucket location for exercise images (affects Phase 6 + 10)
- Decide flow chip click behaviour (affects Phase 6)
- Choose login method: email+password vs magic link
