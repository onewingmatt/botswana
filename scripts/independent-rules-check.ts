/**
 * INDEPENDENT RULES CHECK — Botswana / Wildlife Safari (Reiner Knizia)
 *
 * Purpose: replay the RULEBOOK's own components list, setup table and worked scoring
 * examples against the game engine. Every expected value below is quoted from the
 * rulebook transcription (see references/rulebook-extract.md); the engine's numbers come
 * from the real Python engine (backend/game.py) via scripts/rules-engine-probe.py. If the
 * rulebook and the engine disagree, the rulebook wins and this script MUST fail.
 *
 * The engine is Python and the audit harness is TypeScript, so the bridge runs the engine
 * and returns raw observations; every rulebook expectation lives HERE, never in the bridge.
 *
 * Sources of the expected values:
 *  - Components: "25 animals (5 elephants, 5 rhinos, 5 lions, 5 leopards, 5 zebras)";
 *    "30 cards (6 of each animal, numbered 0 to 5)"  [UltraBoardGames, Wildlife Safari]
 *  - Setup: "two or four players, randomly remove two cards face down; ... three players,
 *    remove three cards ...; With five players, use all 30 cards"  [UltraBoardGames]
 *  - Game play: play a card, then take an animal of your choice (may differ); stack cards;
 *    round ends when all six cards of any one species have been played; the player who
 *    played the last card may still take an animal; each animal is worth the value of the
 *    TOP card on its stack; animals with no cards played are worth 0  [UltraBoardGames]
 *  - Round-end table: "All Elephants are worth 5 points; Rhinos=0; Lions=3; Leopards=1;
 *    Zebras=4."  [UltraBoardGames, rulebook example]
 *  - Scoring example: top cards Giraffes:1, Hippos:1, Elephants:3, Meerkats:5, Lions:0 ->
 *    Britta 18, Weberson 13, Natalie 7, Karen 3  [officialgamerules.org, 25th Century ed.]
 *  - End of game: "Play as many rounds as there are players, with each player starting a
 *    round once. The player with the highest total after the last round wins."
 *    [UltraBoardGames]
 *
 * Run with: npm run audit  (node scripts/independent-rules-check.ts)
 */

import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BRIDGE = join(HERE, 'rules-engine-probe.py');

let passes = 0;
let failures = 0;

function check(desc: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passes += 1;
    console.log(`  PASS  ${desc} -> ${JSON.stringify(actual)}`);
  } else {
    failures += 1;
    console.error(`  FAIL  ${desc} -> expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const SPECIES = ['Lion', 'Rhino', 'Elephant', 'Leopard', 'Zebra'];

// The 25th Century scoring example uses Giraffe/Hippo/Meerkat; the engine (Wildlife Safari
// set) uses Zebra/Rhino/Leopard. The two species present in both editions keep their names.
//   25th Century: Giraffe 1, Hippo 1, Elephant 3, Meerkat 5, Lion 0
//   mapped here:  Zebra   1, Rhino 1, Elephant 3, Leopard 5, Lion 0
const BRITTA_BOARD = {
  Zebra: [1],
  Rhino: [1],
  Elephant: [3],
  Leopard: [5],
  Lion: [0],
};
const BRITTA_TOKENS = {
  Britta: { Zebra: 2, Elephant: 2, Leopard: 2 },
  Weberson: { Rhino: 2, Elephant: 2, Leopard: 1 },
  Natalie: { Rhino: 2, Leopard: 1, Lion: 2 },
  Karen: { Zebra: 3, Lion: 2 },
};

const request = {
  setupCounts: [2, 3, 4, 5],
  turnProbe: true,
  exhaustionProbe: true,
  roundsProbe: true,
  scoreScenarios: [
    // Rulebook round-end table: Elephants 5, Rhinos 0, Lions 3, Leopards 1, Zebras 4.
    { board: { Elephant: [1, 2, 5], Lion: [3], Leopard: [1], Zebra: [2, 4] }, tokens: { A: { Elephant: 2, Zebra: 1 } } },
    { board: BRITTA_BOARD, tokens: BRITTA_TOKENS },
  ],
};

const raw = execFileSync('python3', [BRIDGE, JSON.stringify(request)], { encoding: 'utf8' });
const obs = JSON.parse(raw);

console.log('Botswana / Wildlife Safari — independent rules check vs rulebook\n');

console.log('1) Components & deck (rulebook "Components"):');
check('five animal species', obs.species, SPECIES);
check('30 cards in the deck', obs.deck.total, 30);
for (const s of SPECIES) {
  check(`${s}: 6 cards`, obs.deck.perSpecies[s].count, 6);
  check(`${s}: values 0..5`, obs.deck.perSpecies[s].values, [0, 1, 2, 3, 4, 5]);
}
check('25 animal figures (5 per species)', obs.poolPerSpecies, { Lion: 5, Rhino: 5, Elephant: 5, Leopard: 5, Zebra: 5 });

console.log('\n2) Setup — cards set aside & dealt evenly (rulebook "Setup"):');
const SETUP: Record<string, { setAside: number; hand: number }> = {
  '2': { setAside: 2, hand: 14 },
  '3': { setAside: 3, hand: 9 },
  '4': { setAside: 2, hand: 7 },
  '5': { setAside: 0, hand: 6 },
};
for (const [n, exp] of Object.entries(SETUP)) {
  check(`${n} players: ${exp.setAside} cards set aside`, obs.setup[n].setAside, exp.setAside);
  check(`${n} players: ${exp.hand} cards each`, obs.setup[n].handSizes, Array(Number(n)).fill(exp.hand));
}

console.log('\n3) Course of play (rulebook "Game Play"):');
check('round ends when the 6th card of a species is played', obs.turnProbe.ended, true);
check('exactly 6 plays to complete a species', obs.turnProbe.plays, 6);
check('a figure is taken on every play, even the last', obs.turnProbe.tookAFigureEveryPlay, true);
check('the player of the 6th card still took a figure (B -> 1 Rhino)', obs.turnProbe.tokens.B.Rhino, 1);
check('a depleted species may still receive cards (Lion pool exhausted)', obs.turnProbe.lionPoolLeft, 0);

console.log('\n4) Round scoring — rulebook round-end table (UltraBoardGames example):');
check('final values = top card of each stack', obs.scoreScenarios[0].finalValues, {
  Lion: 3,
  Rhino: 0,
  Elephant: 5,
  Leopard: 1,
  Zebra: 4,
});
check('2 Elephants + 1 Zebra = 10 + 4 = 14', obs.scoreScenarios[0].scores.A, 14);

console.log('\n5) Round scoring — rulebook worked example (officialgamerules.org / Britta):');
check('top-card values', obs.scoreScenarios[1].finalValues, {
  Lion: 0,
  Rhino: 1,
  Elephant: 3,
  Leopard: 5,
  Zebra: 1,
});
check('Britta = 2x1 + 2x3 + 2x5 = 18', obs.scoreScenarios[1].scores.Britta, 18);
check('Weberson = 2x1 + 2x3 + 1x5 = 13', obs.scoreScenarios[1].scores.Weberson, 13);
check('Natalie = 2x1 + 1x5 + 2x0 = 7 (Lions worth zero)', obs.scoreScenarios[1].scores.Natalie, 7);
check('Karen = 3x1 + 2x0 = 3', obs.scoreScenarios[1].scores.Karen, 3);

console.log('\n6) Multi-round game & winner (rulebook "End of the Game" / "Number of Rounds"):');
check('rounds equal to player count', obs.roundsProbe.maxRoundsByCount, { '2': 2, '3': 3, '4': 4, '5': 5 });
check('each player starts a round once (rotation)', [...obs.roundsProbe.startIndices].sort((a: number, b: number) => a - b), [0, 1, 2]);
check('scores accumulate across rounds (10 then +3 = 13)', obs.roundsProbe.finalGlobal.A, 13);
check('game ends after the last round', obs.roundsProbe.gameOver, true);

console.log('\n7) No figures remaining (rulebook: figure taken "provided an eligible figure remains"):');
check('a card play is still legal with no figures left', obs.exhaustionProbe.playOk, true);
check('the round then ends normally', obs.exhaustionProbe.ended, true);

console.log(`\n----------------------------------------`);
console.log(`Audit gate: ${failures === 0 ? 'PASS' : 'FAIL'} — ${passes} checks passed, ${failures} failed`);
if (failures > 0) process.exit(1);
