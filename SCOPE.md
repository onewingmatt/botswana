# SCOPE — Botswana / Wildlife Safari (web port)

**Project dir:** `/home/onewing/botswana-remote-check` (task name: "botswana" — the deploy/port repo)
**Game:** *Botswana* (a.k.a. *Wildlife Safari*, *Flinke Pinke*, *Loco!*, *Quandary*), Reiner Knizia;
this port implements the **Eagle-Gryphon Games *Wildlife Safari*** set (Eagle-Gryphon, 2014; the 2010
Eagle-Gryphon re-issue of the 1997 *Botswana*). 2–5 players, ages 7+, ~20–30 min.
**Audit date:** 2026-10-26 · **Auditor:** Hermes subagent (independent real-rules audit)

## What this project is

A two-thread web port of Botswana:

- **Backend** — `backend/main.py`, a FastAPI app that is the single source of truth for game state:
  in-memory `rooms`, one WebSocket per player (`/ws/{room_id}/{player_id}`), a `/health` endpoint, and
  a static-file mount that serves the built frontend from `backend/dist`. The rules engine lives in
  `backend/game.py` (`class GameState`), mutated in place; room ids are 6-char codes.
- **Frontend** — `frontend/src/main.ts`, a vanilla-TypeScript (Vite, no framework) renderer. It holds
  **no game logic**; it renders whatever `state` the server broadcasts and sends `play` messages back.
  Two-step turn UI: pick a card, then pick an animal token.

Bot seats (`Bot 1`, `Bot 2`, …) are driven server-side in `backend/main.py::handle_bot_turn` — a
1.5 s delayed random choice of card and token. There is no client-side bot and no local/hot-seat mode.

## Standards (per game-build-standard)

- **Stack:** Python 3 / FastAPI + `websockets` on the server; Vite + TypeScript (vanilla, no
  framework) client; the built client is copied into `backend/dist` and served by the same FastAPI
  app. Docker + `docker-compose.yml` + `render.yaml`.
- **Engine:** `backend/game.py::GameState` — **server-authoritative but NOT pure and NOT
  RNG-injectable**. Every rule lives in one class that mutates `self` in place; `random.shuffle` /
  `random.choice` are called directly with no injectable `RandomSource`. There is **no seeded replay
  harness and no full-game seeded sim**. Determinism is absent.
- **Rules source & edition:** Eagle-Gryphon *Wildlife Safari* rulebook, transcription at
  UltraBoardGames (`ultraboardgames.com/wildlife-safari/game-rules.php`, fetched 2026-10-26), the
  canonical text for this engine's animal set; cross-checked against officialgamerules.org's
  transcription of the 25th Century Games (2025) *Botswana* rulebook, BGG #398 / boardgamewikia, and
  two reviews (The A.V. Club 2025-10-01; Games Night Guru). Full extract in
  `references/rulebook-extract.md`. The rulebook's own worked examples are replayed by
  `scripts/independent-rules-check.ts` (`npm run audit`).
- **Hidden info:** **HIDDEN, one layer** — the opponents' hands. `GameState.get_client_state(player_id)`
  returns `my_hand` in full but only `hand_count` for every other player (trusted-server model, no
  per-player partition of a shared blob). Tokens, scores, and played stacks are public by design
  (rulebook: played cards and collected figures are public). Bots have no uncertainty model.
- **Time policy:** **no turn timer** and **no disconnect policy**. A dropped WebSocket removes the
  connection and, when a room's last connection drops, the room object is deleted (unrecoverable). A
  disconnected human keeps no seat, no reconnect token exists, and no auto-pass/bot-takeover runs for
  a human seat, so a human-vs-human room stalls on an absent player's turn. Bots never stall (scheduled
  after every action path). Not decided in SCOPE before build (gap).
- **Bots:** **one tier only** — a uniform-random legal move (`random.choice` of a hand card and of an
  available token). No difficulty ladder, no heuristics, **no measured ranking**.
- **Tiers:** the FLOOR is `["typecheck", "audit", "deploy:verify"]` (`package.json` → `gate.floor`):
  - `npm run typecheck` — `cd frontend && tsc --noEmit`
  - `npm run audit` — `node scripts/independent-rules-check.ts` (replays the rulebook's components,
    setup table and worked scoring examples against the real Python engine)
  - `npm run deploy:verify` — `node scripts/deploy-verify.mjs` (running container md5 == `git HEAD`)

  No `test`, `replay`, `sim`, `flow`, `test:e2e`, `test:bot`, `test:probe`, `test:bots`,
  `test:socket`, or `test:reconnect` tier is declared. `scripts/independent-rules-check.ts` is a
  hybrid: Node runs the TS audit and spawns `scripts/rules-engine-probe.py` to exercise
  `backend/game.py` (the engine is Python; a TS audit cannot import it).
- **Deploy target:** `https://botswana.onewing.top/` — host `onewing@10.0.0.145`, container
  `botswana-app-1`, `/health` → `{"status": "ok"}`, files verified by md5 against `git HEAD`
  (`deploy.json`). Cache-busting is by content-hashed Vite asset filenames
  (`backend/dist/assets/index-*.js`), not a `?v=N` counter.

## Real-rules scope (what "correct" means here)

Full evidence and the audit's own output are in `RULES-AUDIT.md`. Summary of the five engine rules
that were **wrong or unverified** on arrival:

| # | Rule (rulebook) | Engine on arrival | Verdict |
|---|---|---|---|
| D3 | Set aside 2 cards (2p/4p), 3 cards (3p), none (5p) | `len(deck) % num_players` → **0 for 2p and 3p** | ❌ DIVERGENCE → **fixed** |
| D13 | A card may be played even when no figure remains ("provided an eligible figure remains") | any empty figure pool rejected the whole turn → **deadlock once all 25 figures were claimed** | ❌ DIVERGENCE → **fixed** |
| D15 | Tie → play a bonus round | no tie handling; highest score wins alone | ⚠️ NOT IMPLEMENTED (documented) |
| D17 | Published game is 2–5 players | lobby labelled `n/6`, backend caps nothing | ⚠️ DIVERGENCE (documented, unfixed) |
| D14 | Round-1 starter: "youngest" / "randomly select" | room join order (player 0) | ⚠️ COSMETIC (both editions pick arbitrarily) |

Everything else the rulebook states — the 30-card / 25-figure inventory, even dealing, play-a-card-then-
take-any-figure, the sixth-card round end (the sixth-card player still taking a figure), top-card
valuation with empty species = 0, `figures × value` scoring, and one round per player with a rotating
starter — matches the engine (see `RULES-AUDIT.md`).

## In-scope (this audit)

1. Verdict on real-game identity and edition (Eagle-Gryphon *Wildlife Safari* set).
2. Engine/rule divergence table with evidence, in `RULES-AUDIT.md`.
3. The rulebook's own worked examples replayed against the real engine
   (`scripts/independent-rules-check.ts` + `scripts/rules-engine-probe.py`).
4. The audit wired as `npm run audit` and added to the gate FLOOR.
5. `SCOPE.md`, `references/rulebook-extract.md`, `RULES-AUDIT.md` artifacts.

## Explicitly out of scope (documented gaps)

- The bonus-round **tie rule** (documented in officialgamerules.org for the 25th Century edition only;
  **unconfirmed** by a second source; not implemented).
- Capping the lobby/backend at the published 2–5 players (currently unbounded; the lobby is labelled
  `n/6`).
- Seeded RNG, a replay harness, full-game seeded sims, socket E2E, a bot-move probe, a headless
  zero-pageerror probe, and a measured bot-difficulty ladder — none exist; the FLOOR therefore does not
  declare those tiers.
- Reconnect/seat retention and a turn timer (no policy exists).
