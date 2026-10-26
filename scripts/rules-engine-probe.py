#!/usr/bin/env python3
"""
rules-engine-probe — the engine half of scripts/independent-rules-check.ts.

The Botswana rules engine is Python (backend/game.py), so the TypeScript audit
cannot import it directly. This bridge runs the REAL engine and returns raw,
uninterpreted observations as JSON. It contains no rulebook expectations: every
expected value lives in the .ts audit, so the two halves stay independent
(observations from the code, expectations from the rulebook).

Usage:
    python3 scripts/rules-engine-probe.py '<json-request>'

Request keys (all optional):
    scoreScenarios : list of {"board": {species: [cards...]}, "tokens": {pid: {species: n}}}
                     Boards/tokens are installed verbatim, then end_round() runs.
    turnProbe      : bool  - drive a real 2-player round to the 6th card of a species
    exhaustionProbe: bool  - all 25 figures claimed, a species at 5 cards, play a card
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "backend"))

from game import ANIMALS, GameState  # noqa: E402


def new_game(n_players, start=True):
    g = GameState("probe")
    for i in range(n_players):
        g.add_player(f"P{i}" if n_players > 2 else f"{'AB'[i]}")
    if start:
        g.start_game()
    return g


def deck_observation():
    """Read the engine's own dealt deck (5 players set aside no cards)."""
    g = new_game(5)
    dealt = [card for p in g.players for card in g.hands[p]]
    per_species = {}
    for a in ANIMALS:
        vals = sorted(v for (sp, v) in dealt if sp == a)
        per_species[a] = {"count": len(vals), "values": vals}
    return {"total": len(dealt), "perSpecies": per_species}


def setup_observation(counts):
    out = {}
    for n in counts:
        g = new_game(n)
        hand_sizes = [len(g.hands[p]) for p in g.players]
        out[str(n)] = {"setAside": 30 - sum(hand_sizes), "handSizes": hand_sizes}
    return out


def pool_observation():
    g = new_game(2)
    return {a: g.pool[a] for a in ANIMALS}


def turn_probe():
    """Two players alternate playing the six Lion cards 0..5; each takes a Lion
    figure while any remain, then a Rhino. The 6th Lion card ends the round."""
    g = new_game(2)
    g.current_turn_index = 0
    g.board = {a: [] for a in ANIMALS}
    g.pool = {a: 5 for a in ANIMALS}
    g.hands["A"] = [("Lion", 0), ("Lion", 2), ("Lion", 4)]
    g.hands["B"] = [("Lion", 1), ("Lion", 3), ("Lion", 5)]

    plays = 0
    took_every_play = True
    while g.is_playing and plays < 10:
        p = g.current_player()
        animal, value = g.hands[p][0]
        pool_before = dict(g.pool)
        tok = "Lion" if g.pool["Lion"] > 0 else "Rhino"
        if not g.play_turn(p, animal, value, tok):
            break
        plays += 1
        if not (tok == "Rhino" and all(c == 0 for c in pool_before.values())) and g.pool[tok] != pool_before[tok] - 1:
            took_every_play = False
    return {
        "plays": plays,
        "ended": g.round_ended,
        "finalValues": {a: (g.board[a][-1] if g.board[a] else 0) for a in ANIMALS},
        "roundScores": dict(g.round_scores),
        "tokens": {p: {a: g.player_tokens[p][a] for a in ANIMALS if g.player_tokens[p][a]} for p in g.players},
        "lionPoolLeft": g.pool["Lion"],
        "tookAFigureEveryPlay": took_every_play,
    }


def exhaustion_probe():
    """All 25 figures claimed and no species yet at six cards: the rulebook still
    lets a player play a card (no figure taken) and the round must end normally."""
    g = new_game(2)
    g.current_turn_index = 0
    g.board = {a: [0, 1, 2, 3, 4] for a in ANIMALS}  # 5 each, none at 6
    g.pool = {a: 0 for a in ANIMALS}                 # every figure claimed
    g.hands["A"] = [("Lion", 0)]
    g.hands["B"] = [("Lion", 1)]
    ok = g.play_turn("A", "Lion", 0, None)
    return {"playOk": ok, "ended": g.round_ended, "isPlaying": g.is_playing}


def score_scenario(scn):
    ids = list(scn["tokens"].keys())
    g = GameState("probe")
    for pid in ids:
        g.add_player(pid)
    g.board = {a: list(scn["board"].get(a, [])) for a in ANIMALS}
    for p in g.players:
        g.player_tokens[p] = {a: int(scn["tokens"].get(p, {}).get(a, 0)) for a in ANIMALS}
    g.round_scores = {p: 0 for p in g.players}
    g.global_scores = {p: 0 for p in g.players}
    g.current_round = 1
    g.max_rounds = len(g.players)
    g.end_round("probe")
    return {
        "finalValues": {a: g.score_breakdown[g.players[0]]["animals"][a]["value"] for a in ANIMALS},
        "scores": dict(g.round_scores),
    }


def rounds_probe():
    """Round count, rotating first player, and cumulative scoring across rounds."""
    g = new_game(3)
    max_rounds = g.max_rounds
    starts = [g.current_turn_index]
    while g.current_round < g.max_rounds:
        g.start_next_round()
        starts.append(g.current_turn_index)
    max_rounds_by_count = {str(n): new_game(n).max_rounds for n in (2, 3, 4, 5)}

    # Cumulative score: A takes 2 Lions (worth 5) in round 1, then 1 Zebra (worth 3)
    # in round 2 of a 2-round game; the global total must be 10 + 3, and the game over.
    c = new_game(2)
    c.board = {a: [] for a in ANIMALS}
    c.board["Lion"] = [5]
    c.player_tokens["A"] = {a: 0 for a in ANIMALS}
    c.player_tokens["A"]["Lion"] = 2
    c.end_round("probe")
    after_round_1 = dict(c.global_scores)
    c.start_next_round()
    c.board["Zebra"] = [3]
    c.player_tokens["A"]["Zebra"] = 1
    c.end_round("probe")
    return {
        "maxRounds": max_rounds,
        "maxRoundsByCount": max_rounds_by_count,
        "startIndices": starts,
        "afterRound1": after_round_1,
        "finalGlobal": dict(c.global_scores),
        "gameOver": c.game_over,
    }


def main():
    req = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
    out = {
        "species": list(ANIMALS),
        "deck": deck_observation(),
        "poolPerSpecies": pool_observation(),
    }
    if req.get("setupCounts"):
        out["setup"] = setup_observation(req["setupCounts"])
    if req.get("turnProbe"):
        out["turnProbe"] = turn_probe()
    if req.get("exhaustionProbe"):
        out["exhaustionProbe"] = exhaustion_probe()
    if req.get("roundsProbe"):
        out["roundsProbe"] = rounds_probe()
    if req.get("scoreScenarios"):
        out["scoreScenarios"] = [score_scenario(s) for s in req["scoreScenarios"]]
    print(json.dumps(out))


if __name__ == "__main__":
    main()
