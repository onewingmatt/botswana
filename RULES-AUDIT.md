# RULES-AUDIT — Botswana / Wildlife Safari web port (`/home/onewing/botswana-remote-check`)

**Audit type:** Deep real-rules audit (independent; second-pass cross-check vs. rulebook)
**Audit date:** 2026-10-26
**Auditor:** Hermes subagent
**Game audited:** *Botswana* / *Wildlife Safari* (originally *Flinke Pinke*), Reiner Knizia. This port
uses the **Eagle-Gryphon Games *Wildlife Safari*** animal set (Elephant, Rhino, Lion, Leopard, Zebra),
2–5 players, ~20–30 min.
**Rules sources:** Eagle-Gryphon *Wildlife Safari* rulebook (transcription at UltraBoardGames, fetched
2026-10-26) — quoted in `references/rulebook-extract.md`; cross-checked against officialgamerules.org's
25th Century Games (2025) *Botswana* transcription, BGG #398 / boardgamewikia, and two reviews (The A.V.
Club 2025-10-01; Games Night Guru). No first-party publisher PDF was reachable (BGG file page 502s and
needs login; the Eagle-Gryphon product page is dead).

## Verdict on real-game identity

The port is unambiguously a real-rules implementation of **Botswana / Wildlife Safari** by Reiner
Knizia, in its Eagle-Gryphon *Wildlife Safari* dress:

- 30 cards = 5 species × values 0–5 (6 per species), and 25 animal figures (5 per species) — matches
  the rulebook exactly.
- Turn = "play a card, then take an animal of your choice (not necessarily the one you played)" —
  matches exactly.
- The round ends the instant a species receives its sixth card, and **the player of that sixth card
  still takes a figure** — matches exactly.
- Each species is worth the **top card** of its stack; an empty species is worth 0; a figure's score is
  `topCard × count` — matches exactly (both rulebook worked examples replay cleanly; see below).
- A game is one round per player with a rotating starter; scores accumulate; highest total wins —
  matches exactly.

**Repaired during this audit:** two rules the engine got wrong (D3, D13). Both were fixed in
`backend/game.py` (and, for D13, `backend/main.py` and `frontend/src/main.ts`), each with the rulebook
line that justifies it quoted in the code comment. Everything else in the divergence table is a
documented scope gap, not a silent error.

## How the audit was performed

1. **Rules located.** Searched for a first-party Eagle-Gryphon / 25th Century rulebook PDF (none
   reachable — see header), then captured the full rulebook transcription from UltraBoardGames plus
   five independent cross-checks. Full extract in `references/rulebook-extract.md`.
2. **Engine read.** `backend/game.py` (the whole rules engine), `backend/main.py` (WebSocket handlers,
   bot loop), `deploy.json`, `scripts/gate.mjs`, and `frontend/src/main.ts` (renderer — confirmed to
   hold no rules).
3. **Rulebook worked examples replayed against the engine.** `scripts/independent-rules-check.ts`
   asserts the rulebook's own component inventory, setup table, round-end value table and the Britta
   worked-scoring example against the **real** engine. Because the engine is Python, the TS audit
   spawns `scripts/rules-engine-probe.py`, which runs `backend/game.py` and returns raw observations;
   every expected value lives in the TS file (rulebook-derived), never in the probe (engine-derived),
   so the audit is not self-consistent with the code it tests.
4. **Verdicts recorded** in the divergence table below; the audit command is wired as `npm run audit`
   and added to the gate FLOOR.

## Divergence table (engine vs rulebook)

| # | Rule | Rulebook | Port engine (`backend/game.py`) | Verdict |
|---|------|----------|----------------------------------|---------|
| D1 | Deck composition | 30 cards: 5 species × 6 cards (0–5) | `[(a, v) for a in ANIMALS for v in range(6)]` → 30 | ✅ MATCH |
| D2 | Animal figures | 25 (5 per species) | `pool = {a: 5 for a in ANIMALS}` | ✅ MATCH |
| D3 | Cards set aside by player count | 2p→2, 3p→3, 4p→2, 5p→0 | was `len(deck) % num_players` → **0 for 2p and 3p** | ❌ **DIVERGENCE — FIXED** (see below) |
| D4 | Deal the rest evenly | even hands | `deck // num_players` each | ✅ MATCH |
| D5 | Turn: play a card, then take **any** figure | "not required to take the animal that matches the card you played" | `play_turn(card, token_animal)` — token species independent of card | ✅ MATCH |
| D6 | Cards stack per species, newest on top | "the most recent card played on top of each stack is obvious" | `board[card_animal].append(value)`; UI renders the top card | ✅ MATCH |
| D7 | Round ends when a species reaches 6 cards | "until all six cards of any one animal species have been played" | `if len(self.board[card_animal]) == 6: end_round(...)` | ✅ MATCH |
| D8 | The sixth-card player still takes a figure | "the player who played the last card may still take an animal" | figure taken *before* the round-end check | ✅ MATCH |
| D9 | Value = top card; empty species = 0 | "worth the value of the top card …; animals with no cards played … worth 0" | `board[a][-1] if board[a] else 0` | ✅ MATCH |
| D10 | Score = figures × species value | Britta/Weberson/Natalie/Karen example | `pts = tokens * value` | ✅ MATCH |
| D11 | One round per player, rotating starter | "as many rounds as there are players, with each player starting a round once" | `max_rounds = len(players)`; `start = (round-1) % n` | ✅ MATCH |
| D12 | Winner = highest cumulative total | "the player with the highest total after the last round wins" | `global_scores` accumulate across rounds; UI crowns the max | ✅ MATCH |
| D13 | A card may be played with no figure left | "still completes their turn by taking one Animal Figure, **provided an eligible figure remains**" | was: any empty pool rejected the whole turn → **round deadlocked once all 25 figures were claimed** | ❌ **DIVERGENCE — FIXED** (see below) |
| D14 | Round-1 first player | "the youngest player takes the first turn" (EG) / "randomly select" (25th C) | player 0 in the room (join order) | ⚠️ COSMETIC — both editions pick arbitrarily; immaterial |
| D15 | Tie → bonus round | "play one complete bonus round with every player participating" (25th C only) | no tie handling; the higher score is crowned winner | ⚠️ NOT IMPLEMENTED (documented; source unconfirmed by a second source) |
| D16 | A species running out of figures | "nobody can collect any more of that type … players may still play cards onto that species' stack" | `pool[a] == 0` blocks taking that species, not playing its cards | ✅ MATCH |
| D17 | Player count 2–5 | published game is 2–5 players | lobby labelled `n/6`; backend applies no cap above 5 | ⚠️ DIVERGENCE (documented, unfixed — UI/server cap change out of Pillar-1 scope) |

### D3 — cards set aside (fixed)

- **Rulebook** (UltraBoardGames, "Setup"): "When playing with two or four players, randomly remove two
  cards face down; when playing with three players, remove three cards face down. With five players,
  use all 30 cards." officialgamerules.org gives the same numbers as a table.
- **Engine on arrival:** `cards_to_remove = len(self.deck) % num_players` — a value chosen so the deck
  deals evenly, not the rulebook's value. `30 % 2 == 0` and `30 % 3 == 0`, so **2- and 3-player games
  set aside nothing** and dealt 15 / 10 cards each instead of 14 / 9. (4p and 5p happened to coincide.)
- **Fix:** set the aside count from the rulebook table `{2:2, 3:3, 4:2, 5:0}`, falling back to even
  dealing only above 5 players (no rulebook value exists there). Verified: 2p→14 each, 3p→9 each,
  4p→7 each, 5p→6 each.

### D13 — deadlock when no figures remain (fixed)

- **Rulebook** (officialgamerules.org, "Ending a Round"): the sixth-card player takes a figure "provided
  an eligible figure remains"; and "Once all figures of one species have been taken … players may still
  play cards onto that species' card stack." The round is not permitted to stall.
- **Engine on arrival:** `if self.pool[token_animal] <= 0: return False` rejected the *entire turn* if
  the chosen species had no figures left. Since the round can reach 25 plays with 5 cards on every
  species (all 25 figures claimed) before any species reaches six, the 26th play — which must complete
  a species and end the round — became impossible. The round **hung**.
- **Fix:** a play is legal with `token_animal = None` only when **no** species has a figure left; if any
  figure remains, a figure must be taken (unchanged behaviour). The bot (`backend/main.py`) passes
  `None` in that case, and the frontend (`frontend/src/main.ts`) plays the selected card immediately
  when no token pill is takeable, with an explanatory turn prompt. Verified: with all pools at 0 the
  play returns `True` and the round ends.

## Rulebook worked-example replay (the audit gate)

Run: `npm run audit` → `node scripts/independent-rules-check.ts` (+ `scripts/rules-engine-probe.py`).
The script imports/executes the real engine and encodes the **rulebook's** numbers, not the engine's.

| Rulebook item | Rulebook value | Engine result | Verdict |
|---|---|---|---|
| 5 species, 30 cards, 6 per species valued 0–5 | per "Components" | 5 / 30 / 6 × [0..5] | ✅ PASS |
| 25 figures, 5 per species | per "Components" | {5,5,5,5,5} | ✅ PASS |
| Set aside / deal: 2p 2/14, 3p 3/9, 4p 2/7, 5p 0/6 | per "Setup" | 2/14, 3/9, 2/7, 0/6 | ✅ PASS |
| Round ends on the 6th card of a species | per "Game Play" | round ends after 6 Lion cards | ✅ PASS |
| Sixth-card player still takes a figure | per "Game Play" | yes (B takes 1 Rhino) | ✅ PASS |
| A depleted species may still receive cards | per 25th C "figures run out" | Lion pool 0, cards keep going | ✅ PASS |
| Round-end value table: Elephants 5, Rhinos 0, Lions 3, Leopards 1, Zebras 4 | per "Example" | identical | ✅ PASS |
| Score from that table (2 Elephants + 1 Zebra) | 10 + 4 = **14** | 14 | ✅ PASS |
| Britta example — top cards 1/1/3/5/0 | per "Scoring Example" | mapped values identical | ✅ PASS |
| Britta 2 Giraffes + 2 Elephants + 2 Meerkats | **18** | 18 | ✅ PASS |
| Weberson 2 Hippos + 2 Elephants + 1 Meerkat | **13** | 13 | ✅ PASS |
| Natalie 2 Hippos + 1 Meerkat + 2 Lions | **7** | 7 | ✅ PASS |
| Karen 3 Giraffes + 2 Lions | **3** | 3 | ✅ PASS |
| Rounds = player count (2/3/4/5) | per "Number of Rounds" | {2,3,4,5} | ✅ PASS |
| Each player starts a round once | per "End of the Game" | starters [0,1,2] | ✅ PASS |
| Cumulative scoring across rounds | 10 then +3 = **13** | 13 | ✅ PASS |
| Play legal with no figures remaining (D13 fix) | per "provided an eligible figure remains" | play ok, round ends | ✅ PASS |

**39/39 checks pass. Audit gate: PASS (exit 0).**

```
Audit gate: PASS — 39 checks passed, 0 failed
```

## Audit counts

- Checks in `scripts/independent-rules-check.ts`: **39** — **all PASS** (`npm run audit` exits 0).
- Divergences found: **2 real, both fixed** (D3 set-aside table; D13 no-figures deadlock), **1 real,
  unfixed** (D17 player count), **1 unimplemented** (D15 bonus-round tie rule, unconfirmed source),
  **1 cosmetic** (D14 round-1 starter).
- Gate: `npm run gate:strict` → PASS (registry: FLOOR `[typecheck, audit, deploy:verify]` all declared);
  `npm run gate` → run the three FLOOR tiers.

## Missing done-gate features (game-build-standard probes)

1. **Rules audit** (`npm run audit`): ✅ **PRESENT** (this audit; added to the FLOOR).
2. **Test / replay / sim tiers**: ❌ **MISSING** — no unit tests, no seeded RNG, no replay harness, no
   full-game sim. The engine mutates state in place and calls `random.*` directly.
3. **Socket E2E** (full game over the live socket): ❌ **MISSING**.
4. **Bot-move probe**: ⚠️ **PARTIAL** — the bot loop exists (`handle_bot_turn`) but there is no automated
   probe that plays a bot turn.
5. **Headless-browser zero-pageerror play-through**: ❌ **MISSING**.
6. **Deploy verification**: ✅ **PRESENT** (`npm run deploy:verify`, container md5 vs `git HEAD` + URL
   status); cache-busting via content-hashed Vite asset names.
7. **Seeded replay / determinism**: ❌ **MISSING**.
8. **Bot difficulty ladder**: ❌ **MISSING** — one uniform-random tier only.
9. **Reconnect / seat retention / turn timer**: ❌ **MISSING** — a dropped socket loses the seat and can
   delete the room; a human-vs-human room stalls on an absent player.

## Recommendation summary

The engine is a faithful, minimal implementation of Botswana / Wildlife Safari for its scope. The two
rule divergences that mattered were fixed with the rulebook line quoted in-code; the remaining items are
documented scope gaps (tie rule, player-count cap) rather than silent errors. For a done-gate bar the
priority gaps are: any automated test tier at all (the engine has none), a seeded replay harness, a
socket E2E, and a reconnect policy.
