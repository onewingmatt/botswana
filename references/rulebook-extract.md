# Rulebook Extract — Botswana / Wildlife Safari (Flinke Pinke)

> **Primary source used:** *Wildlife Safari* rules transcription at UltraBoardGames —
> <https://www.ultraboardgames.com/wildlife-safari/game-rules.php> — which reproduces the
> **Eagle-Gryphon Games *Wildlife Safari*** rulebook (Eagle-Gryphon Games, 2014; the 2010
> Eagle-Gryphon re-issue of Knizia's 1997 *Botswana*, re-titled 2014). Components quoted below
> are this edition's: 5 elephants, 5 rhinos, 5 lions, 5 leopards, 5 zebras — the exact animal set
> the shipped engine implements.
>
> **Cross-checks (all fetched 2026-10-26):**
> - **officialgamerules.org**, *"How to Play Botswana"* (page "Last Updated on September 4, 2026"),
>   the **25th Century Games** (2025) edition — <https://officialgamerules.org/game-rules/botswana-board-game-rules/>.
>   This edition swaps the animal names (Giraffe, Hippo, Elephant, Meerkat, Lion) but carries the
>   same mechanics; it supplies the setup-removal table, the round count, and the **worked scoring
>   example** replayed by `scripts/independent-rules-check.ts`.
> - **BoardGameGeek** entry #398 (*Botswana*) / boardgamewikia mirror —
>   <https://boardgamegeek.com/boardgame/398/botswana> · <https://boardgamewikia.com/wildlife-safari/>
>   — "five different colored chips, with six cards, zero through five, in each of the colors … play
>   a card and taking any available chip … use the last card played in each category to value their
>   chips. The highest total value wins."
> - **The A.V. Club**, Keith Law, *"Go Wild with the Surprisingly Tense … Botswana"*, 2025-10-01 —
>   <https://www.avclub.com/go-wild-with-the-surprisingly-tense-family-friendly-board-game-botswana>
>   — confirms 5 animal types / 5 tokens each / 30 cards (0–5), that you take **any** token regardless
>   of the card played, that points equal "the last card played to that animal", and that the round
>   ends once a species has six cards beneath it.
> - **Games Night Guru**, *"Botswana / Wildlife Safari"* review — <https://gamesnightguru.com/game/botswana-aka-wildlife-safari/>
> - **The Dao of Board Gaming**, *"Botswana (aka Wildlife Safari)"*, 2021-11-14 — <https://daoofboardgaming.home.blog/2021/11/14/botswana-aka-wildlife-safari/>
>
> **No first-party publisher PDF was reachable.** The BGG rule-file page for the 25th Century
> rulebook (<https://boardgamegeek.com/filepage/306950/25th-century-botswana-rules>) returned HTTP 502
> and requires a logged-in BGG session to download; the Eagle-Gryphon product page linked from
> UltraBoardGames (`eaglegames.net/ProductDetails.asp?ProductCode=GRY00236-WLS`) is dead. The
> UltraBoardGames transcription of the Eagle-Gryphon rulebook is therefore the canonical text used,
> exactly as it is the canonical text for this engine's animal set. Rule statements below are quoted
> from the primary source unless marked **[cross-check]** or **[unconfirmed]**.

## Components (UltraBoardGames / Eagle-Gryphon)

- **25 animals** — 5 elephants, 5 rhinos, 5 lions, 5 leopards, 5 zebras
- **30 cards** — 6 of each animal, numbered **0 to 5**
- Rulebook

[cross-check] officialgamerules.org (25th Century) lists the same 30 cards / 25 figures plus a
double-sided score board and 10 scoring markers (production extras with no bearing on a web port).

## Setup (UltraBoardGames / Eagle-Gryphon)

> "Before each round, shuffle all of the cards. **When playing with two or four players, randomly
> remove two cards face down; when playing with three players, remove three cards face down.** With
> five players, use all 30 cards. Deal the cards evenly to all the players, who take the cards into
> their hands. Divide the animals into five separate groups (by species), reachable by all players.
> The youngest player takes the first turn in the first round, and play proceeds clockwise."

[cross-check] officialgamerules.org gives the same set-aside table as an explicit list — "2 players:
set aside 2 cards · 3 players: set aside 3 cards · 4 players: set aside 2 cards · 5 players: set aside
none" — and says the **first player is chosen randomly** for round 1 (the editions differ only on how
the round-1 starter is picked; the Eagle-Gryphon text says "youngest").

### Cards set aside & dealt (both sources agree)

| Players | Cards set aside | Cards dealt | Cards each |
|---|---|---|---|
| 2 | 2 | 28 | 14 |
| 3 | 3 | 27 | 9 |
| 4 | 2 | 28 | 7 |
| 5 | 0 | 30 | 6 |

## Course of play (UltraBoardGames / Eagle-Gryphon)

> "Each player, in turn, **plays a card and then takes an animal of their choice. You are not required
> to take the animal that matches the card you played**, but you may if you wish."

> "When playing cards, stack them so that all players can see what cards have been played. Make sure
> that **the most recent card played on top of each stack is obvious**."

> "Play continues until **all six cards of any one animal species have been played** (e.g. when all
> six elephant cards have been played). **The player who played the last card may still take an
> animal.**"

> "At that time, the round ends and **each animal is worth the value of the top card played on its
> stack** of cards (i.e. if the sixth elephant card was a 5, then each elephant is worth 5 points).
> **Animals with no cards played for them are worth '0'.** Each player then totals his or her points
> and the score is recorded on a notepad."

[cross-check] officialgamerules.org, "Ending a Round": "A round ends when the sixth Animal Card of any
one species is played. **The player who plays that sixth card still completes their turn by taking one
Animal Figure, provided an eligible figure remains.** Then the round ends immediately." It also
states, under "What if a Species Runs Out of Figures?": "Once all figures of one species have been
taken, nobody can collect any more figures of that type during the round. **However, players may still
play cards onto that species' card stack.**"

> **[unconfirmed]** Neither source spells out the case where **all 25 figures** have been claimed but
> no species has yet reached six cards. The engine must still let the final card be played (the "provided
> an eligible figure remains" clause implies play continues with no figure taken). See RULES-AUDIT.md D13.

## Round scoring — the rulebook's own worked examples

**Example A — the round-end value table (UltraBoardGames / Eagle-Gryphon):**

> "**Example:** The round has ended because the sixth Elephant card was played. All Elephants are worth
> **5** points; Rhinos = **0**; Lions = **3**; Leopards = **1**; Zebras = **4**."

**Example B — the worked scoring example (officialgamerules.org / 25th Century):**

> The rulebook gives an example involving **Britta**. Britta plays the sixth Lion Card, a **0**, then
> collects a Meerkat Figure; the round ends because the Lion stack has reached six cards.
> With the top cards **Giraffes 1, Hippos 1, Elephants 3, Meerkats 5, Lions 0**, the round scores are:
>
> - **Britta** — 2 Giraffes, 2 Elephants, 2 Meerkats → **18**
> - **Weberson** — 2 Hippos, 2 Elephants, 1 Meerkat → **13**
> - **Natalie** — 2 Hippos, 1 Meerkat, 2 Lions → **7** (Lions are worth zero)
> - **Karen** — 3 Giraffes, 2 Lions → **3**
>
> So a figure's value is `topCard(species) × numberOfFiguresHeld`.

The 25th Century species map onto the engine's Wildlife Safari species as
Giraffe→Zebra, Hippo→Rhino, Elephant→Elephant, Meerkat→Leopard, Lion→Lion (the two shared names keep
their names).

## End of the game (UltraBoardGames / Eagle-Gryphon)

> "**Play as many rounds as there are players, with each player starting a round once.** The player
> with the **highest total** after the last round wins."

[cross-check] officialgamerules.org, "Number of Rounds": "A standard game lasts a number of rounds
equal to the number of players" (2p → 2, 3p → 3, 4p → 4, 5p → 5), and "For later rounds … The player
immediately clockwise from the previous round's starting player becomes the new starting player."

> **[unconfirmed]** officialgamerules.org (25th Century edition only) records a tie rule — "play one
> complete bonus round with every player participating" before declaring a winner. No second source
> was found for it and it is **not implemented** in the engine. See RULES-AUDIT.md D15.

## Player count

The published game is **2–5 players**. [cross-check] boardgamewikia/BGG entry and the Amazon listing
for the 25th Century edition both state 2–5 players, ages 7+, ~20–30 min. The web port's lobby is
labelled "Players (n/6)" and the backend applies no cap above 5 — see RULES-AUDIT.md D17.

## Source URLs

- Eagle-Gryphon *Wildlife Safari* rules (primary, transcription): https://www.ultraboardgames.com/wildlife-safari/game-rules.php
- 25th Century *Botswana* rules (cross-check, transcription): https://officialgamerules.org/game-rules/botswana-board-game-rules/
- BoardGameGeek #398 (*Botswana*): https://boardgamegeek.com/boardgame/398/botswana
- BoardGameWikia (*Botswana / Wildlife Safari*): https://boardgamewikia.com/wildlife-safari/
- The A.V. Club review (2025-10-01, 25th Century edition): https://www.avclub.com/go-wild-with-the-surprisingly-tense-family-friendly-board-game-botswana
- Games Night Guru review: https://gamesnightguru.com/game/botswana-aka-wildlife-safari/
- The Dao of Board Gaming review (2021-11-14): https://daoofboardgaming.home.blog/2021/11/14/botswana-aka-wildlife-safari/
