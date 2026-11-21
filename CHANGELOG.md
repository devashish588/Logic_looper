# Changelog

## Merged onto the deployed codebase

This work was first built on the original February history. GitHub's `main` had since diverged (Google
sign-in, the Vercel setup, a difficulty picker, "How to Play" cards, a redesigned shell, restyled game
screens and renderers), so everything below was re-applied on top of it. The deployed behaviour is kept;
what changed is listed here.

### Kept exactly as deployed
- Google sign-in (`POST /api/auth/google`, the "Continue with Google" button) and the Vercel setup
  (`vercel.json`, `api/index.mjs`, the relative `/api` URL, the `.env` loading and `VERCEL` guard).
- The **difficulty picker** before today's puzzle (Novice / Intermediate / Expert), the per-level hint
  limits (3 / 2 / 1), and the "How to Play" card. It now also has rules and tips for every new game.
- The deployed scoring formula (each hint is -10% of the score, minutes cost 5 points). Added on top:
  each wrong submission costs 10 points, and the larger new games get a time allowance first.
- The hint that **reveals a value on the board** for the original games, the redesigned shell (desktop
  header, mobile bottom tab bar, immersive play mode), and the deployed heatmap (calendar-year view).
- Every past day generates **exactly the puzzle the deployed site generates**: checked for 2,097
  (date, difficulty) combinations, Pattern Match days included.

### Pattern Match is retired, not erased
It is no longer in the daily rotation from `V2_START` onward, nor in Free Play, but past days that used it
still replay in the archive, and the server and the history/stats keep accepting its solves. Deleting it
outright would have changed which puzzle every past day shows and silently dropped those days from a
player's restored history.

### Problems found while merging, now fixed
- **A player's 150-day upload hung the server.** New days were saved one database statement at a time, so
  a player with months of history waited tens of seconds (and would exceed Vercel's time limit) while
  restoring. They are now inserted in one statement (150 days in about 3 seconds), and two simultaneous
  uploads (two tabs, a retry) are safe.
- **The app waited forever if the server stalled.** Requests now give up after 15 s (45 s for uploads) and
  the app carries on with what is saved on the device.
- **Number Matrix could never be solved** after the merge until `checkPuzzle` was corrected: the deployed
  validator takes the whole puzzle, not just the solution grid.
- **Pattern Match hints leaked into other rounds** (a hint used in round 1 could grey out the correct
  answer in round 3). A hint now only applies to its own round.
- **The Stats heatmap overflowed phone screens** (360 px wide); its columns can now shrink to fit.
- Google sign-in now matches emails case-insensitively, like password login, so one person can't end up
  with two accounts.
- A missing icon import (`Palette`) crashed Free Play and the archive; a static check for undefined names
  now runs clean across the whole frontend.

### Known follow-ups
- The 15 test files in `frontend/src/__tests__` (and `jest.config.cjs`) cannot run today: Jest is not in
  `package.json` and there is no `test` script. Several of them describe the old stats code
  (`loadStats`, running streak counters) and need updating if Jest is added.
- `binaryBridge`, `quantumGrid` and `truthAndLies` engines/renderers exist but are not registered in the
  game. They are untouched.
- The unused `backend/src/routes/dailyScores.js` references fields (`difficultyLevel`, `gameType`) that are
  not in the Prisma schema and is not mounted.

## 1.4.0: Letter Lock, a daily word game

### New game: Letter Lock
Guess the hidden five-letter word. After each guess every letter is marked:
**green** (right letter, right spot), **yellow** (in the word, wrong spot) or **grey** (not in the word).

- Type on a physical keyboard, or tap the on-screen keyboard, which colours itself as you learn letters.
- Repeated letters are scored the standard way: greens are claimed first, and a letter is never coloured more
  times than it occurs in the word (a test checks this on 5,000 random pairs).
- Guesses must be real words (2,027 accepted); the daily answer comes from a curated list of 916 everyday words.
  Daily words come in a fixed shuffled order and **never repeat until the whole list has been used**
  (916 words, one every 11 days in the rotation: about 27 years).
- Guess limit follows the difficulty: 7 on easy days, 6 on medium, 5 on hard. A reasonable solving strategy finds
  98.8% of words within 5 guesses and 99.8% within 6, so even the 5-guess days are fair.
- Running out of guesses gives a fresh board and costs 10 points, like a wrong submission in the other games.
  Hints reveal one letter (a different position each time, skipping letters you already have).
- Guesses survive leaving the page and coming back in the same browser tab.
- Enter submits a guess without re-triggering the Hint button you last clicked.
- Colour reveal animation respects "reduce motion"; tiles and keys have screen-reader labels.
- On phones the keyboard is pinned to the bottom of the screen and the row you're filling scrolls into view above it.
- Added to the daily rotation (after Sequence Solver) and to Free Play. The server accepts the new type.

Note: the game is named Letter Lock, not after any existing word game.

### Also
- Home and Settings now count puzzle types from the list instead of a typed-in number.

## 1.3.0: Six new games, Free Play, and a bigger rotation

### New puzzle types
Each was designed so the player acts on something and sees the result, instead of
only filling in an answer. All of them check themselves the moment they are solved.

| Game | You... |
|---|---|
| **Switchboard** | press switches that flip themselves and their neighbours to light the whole board |
| **Laser Path** | turn mirrors to steer a live laser beam into a target |
| **Measure Up** | fill, empty and pour jugs to measure an exact amount (tap mode and pour-only mode) |
| **Balance Scales** | work out each shape's weight; the scales tilt live as you enter weights |
| **Pixel Logic** | use row/column clues to reveal a picture (drag to paint, works on touch) |
| **Number Trail** | draw one path through every cell, passing numbers in order |

Every generated puzzle is checked, not just generated:
- *Switchboard*: exact minimum presses via Gaussian elimination over GF(2); "par" is the true minimum.
- *Measure Up*: exhaustive search, so "par" is the true minimum move count.
- *Balance Scales*: the clue system is proven to have exactly one solution.
- *Pixel Logic*: a line solver confirms it can be finished by deduction alone.
- *Number Trail*: given numbers are removed one at a time only while the solution stays unique.
- *Laser Path*: the beam is simulated, so any arrangement that reaches the target counts, not just the intended one.
- Hints are per type (for example "press this switch", "turn that mirror", "pour A into B") and
  point at the thing on the board.

### More patterns in existing types
- *Sequence Solver*: primes, doubling-plus-constant, counting down, two interleaved sequences, growing gaps.

### Rotation and difficulty
- The daily rotation is now a longer rotation of new and old types. **It starts on `V2_START` (`frontend/src/engine/generator.js`,
  currently `2026-12-01`). Dates before it keep the old 5-type rotation and generate exactly the same
  puzzles as before** (verified for every date by comparing against the committed generator), so the
  archive and existing history are unaffected.
- On the new rotation the base difficulty follows the weekday (easy Monday, hard Sunday), and the player's
  chosen level (Novice x0.6 / Intermediate x1 / Expert x1.8) is applied on top. The new games are tested
  across that whole range (effective difficulty 0.6 to 3.6).
- The bigger new puzzles get a time allowance before the time penalty starts, so they aren't unfairly penalised.

### Free Play
- New **Free Play** page (`/free`): pick any of the 11 games at Novice / Intermediate / Expert, unlimited puzzles,
  or "Surprise me". Never touches streaks, history or the leaderboard.

### Bugs found and fixed while testing in a browser
- **Direct links and refreshes showed a blank "Loading puzzle" screen** on `/practice/:date` (added in
  1.2.0) and on Free Play. The app-level effect that resets the game ran after the puzzle effect had
  loaded it. Puzzles now wait until the player's session has loaded.
- **The server rejected every solve of a new puzzle type**, because it validated against a hard-coded list of
  the original five. The list is updated and a test now fails if the frontend and backend lists differ.
- The header overflowed the screen on phones (worse since the Ranks tab and backup pill were added); it now
  wraps. The Stats heatmap also stretched the page on phones; it now scrolls inside its card, starting at today.
- "Descending" sequences could reach zero or negative numbers; they now stay positive.
- Startup no longer hangs on "Loading" if loading saved progress throws.

### Other
- `checkPuzzle()` is now the single place that knows how to validate each puzzle type.
- The difficulty badge shows the chosen level (Novice / Intermediate / Expert).

### Deploying
No new database changes. **Before deploying, set `V2_START` to today's date or later**
(the cutover day). If it is earlier than the day you deploy, days between `V2_START` and the deploy day
will show a different puzzle type in the archive than the one players actually played.

## 1.2.0: Reasons to come back

### Streak freezes
- Every 7 days in a row earns a streak freeze (hold up to 2). Missing a day
  uses one automatically, so the streak survives. Unused freezes carry over.
- Freezes are **derived from the solve history**, not stored, so they can't
  get out of sync and they apply to existing history too. The same algorithm
  runs on the client (`frontend/src/utils/streakCalculator.js`) and the server
  (`backend/src/lib/streaks.js`); a test checks both agree on 2,000 random
  histories.
- Shown on Home (freeze count, plus a "a freeze saved your streak" banner),
  Stats (freeze card, frozen days in light blue on the heatmap) and the result
  dialog ("Streak freeze earned!").
- Leaderboard streaks are now calculated live from scores (they used to be a
  stored number that went stale once someone stopped playing). The server
  treats UTC-yesterday as still open, so players behind UTC aren't shown a
  broken streak before their day ends.

### Practice archive
- New **Puzzle Archive** (`/practice`): a month calendar of the past year
  showing each day's puzzle type and whether it was solved, practiced, frozen
  or missed. Any past day can be replayed at `/practice/YYYY-MM-DD`. Clicking a
  past day on the Stats heatmap opens it too.
- Practice never affects streaks, history or the leaderboard; best practice
  scores are kept on the device.
- Leaving an unfinished daily puzzle to practice sets it aside and restores
  it (timer, hints, mistakes) when you return, so practice can't be used to
  reset the daily puzzle.

### Share grid
- Results share as a spoiler-free grid, like Wordle:
  ```
  Logic Looper #326 · Binary Logic
  🟨🟥🟩 1:42 · 65 pts
  🔥 12-day streak
  ```
  (yellow = hint, red = wrong submission, green = solved). Puzzle numbers
  count from #1 on 2026-01-01. The grid also appears in the result dialog and
  can be shared again from the "already solved" screen.

### Also
- The backend now refuses to start without `DATABASE_URL` and `JWT_SECRET`
  (before, every login failed with a 500 when `JWT_SECRET` was missing).
- `schema.prisma` now includes the `googleId` / `truecallerId` columns that
  exist in the database, so `prisma db push` never drops them.

## 1.1.0: Progress you can't lose

### Fixed: players losing their heatmap and streak

Several bugs combined so that a player's history lived only in one browser,
and could be wiped from there too:

1. **Nothing reached the server.** The frontend never called `/stats/sync` or
   `/stats/daily`. The one sync that did run (`/stats/batch-sync`) looked for
   unsynced entries via an IndexedDB index on `synced`, but `synced` was
   stored as `true`/`false`, and booleans aren't valid IndexedDB keys, so
   the index was always empty and 0 entries were ever sent.
2. **Logout and login wiped local progress.** Logging out (and switching
   user) dispatched `resetStats()` while a store subscriber auto-saved stats,
   so the empty state was written over `stats::<userId>` in IndexedDB.
3. **The heatmap hid older history.** Once the `daily_activity` store had
   *any* entry, the heatmap and streak read only from it and ignored the older
   history kept in `heatmapData`.
4. **Expired sessions failed silently.** JWTs expired after 7 days with no
   handling, so syncs failed without the player knowing.

How it works now:

- **One source of truth.** The solve history (one entry per day). Streaks,
  totals, heatmap and badges are all *derived* from it
  (`frontend/src/utils/statsCalculator.js`), so they can't drift or be
  wiped on their own.
- **Merge, never overwrite.** On login the app merges the server history,
  this device's records and any old `stats::<userId>` snapshot (legacy days
  are rebuilt, since the puzzle type is deterministic from the date), then
  uploads whatever the server is missing. The server also only merges: a
  stored day is never lowered or deleted except by the explicit "Reset all
  progress" action.
- Nothing writes stats to `localStorage`/IndexedDB on reset or logout any more.
- The browser is asked for persistent storage, so it doesn't evict data.
- A header pill shows backup status (Backed up / Offline / Not backed up).
- Expired sessions send the player to log in again with a clear message,
  and their local progress is uploaded right after. Tokens now last 30 days.
- Stats shows a banner when days were restored from the device.

### Fixed: gameplay

- **Hints did nothing** in the newer games' first version: the Hint button cost points but showed nothing.
  Each new game now has real hints that point at the board. (The original games keep the deployed
  behaviour: the hint reveals a value on the board, limited to 3 / 2 / 1 hints by difficulty, -10% score each.)
- **Submitting an empty answer crashed** validation for most puzzle types.
- **"Try again" reset the timer and hint count**, which made failing free.
  Entries, timer and hints are now kept; each wrong submission costs 10 points.
- **Leaving and returning restarted the puzzle** (resetting timer and hints).
  It now resumes.
- A day can't be recorded twice (e.g. from two tabs).
- The "No Help Needed" badge was never awarded. "Perfect Ten" now matches its
  description (10 solves with no mistakes).
- The Timer setting is respected; Settings were saved to an unscoped key.
- "Reset all progress" only cleared the screen. It now deletes server and
  device data.
- `npm run build` failed (`tsc` ran with no `tsconfig.json`).

### New

- **Leaderboard** (Today / This week / All time) backed by real data
  (previously mocked). Names that were auto-derived from emails are shown as
  `Player XXXX`.
- Share your result, a countdown to the next puzzle, a "keep your streak"
  reminder on Home, and a per-puzzle-type breakdown on Stats.

### Backend

- Shared Prisma client (one connection pool instead of one per route file).
- Input validation on every score write (date format, no far-future dates,
  known puzzle types, clamped numbers, batch size limit).
- `GET /api/stats/me`, `DELETE /api/stats/me`; `/stats/sync` can no longer
  overwrite counters.
- Emails are normalized to lowercase (old mixed-case accounts still log in).
- `CORS_ORIGIN` accepts a comma-separated list.

### Deploying

The schema change only **adds** columns (`mistakes`, `legacy`, `solvedAt`), so
existing data is untouched. Apply it **before** deploying the new backend:

```bash
cd backend
npx prisma db push
```

Then deploy the backend, then the frontend.
