"""Pure deterministic DFA execution engine and mathematical invariant checks."""

from typing import Dict, Any
from transition_table import (
    DFA_ALPHABET,
    DFA_INITIAL_STATE,
    DFA_STATES,
    STATE_SIGNALS,
    TRANSITION_TABLE,
    VALID_INPUTS,
)


def evaluate_dfa_transition(current_state: str, raw_input: str) -> Dict[str, Any]:
    normalized = (raw_input or "").strip().upper()
    if normalized not in VALID_INPUTS:
        return {
            "valid": False,
            "previousState": current_state,
            "receivedInput": raw_input,
            "nextState": current_state,
            "transitionRule": f"delta({current_state}, '{raw_input}') = REJECTED",
            "reason": f"Rejected invalid input '{raw_input}' (not in Sigma). State unchanged.",
            "safetyNote": "Invalid input cannot alter traffic signals.",
            "signals": STATE_SIGNALS[current_state],
        }

    rule = TRANSITION_TABLE[current_state][normalized]
    next_state = rule["to"]
    return {
        "valid": True,
        "previousState": current_state,
        "receivedInput": normalized,
        "nextState": next_state,
        "transitionRule": f"delta({current_state}, {normalized}) = {next_state}",
        "reason": rule["reason"],
        "safetyNote": rule["safetyNote"],
        "signals": STATE_SIGNALS[next_state],
    }


def verify_invariants() -> Dict[str, Any]:
    defined_pairs = sum(
        1
        for st in DFA_STATES
        for alpha in DFA_ALPHABET
        if TRANSITION_TABLE.get(st["id"], {}).get(alpha["input"], {}).get("to")
    )
    conflicting = [
        st["id"]
        for st in DFA_STATES
        if sum(1 for c in st["signals"].values() if c != "RED") > 1
    ]
    yellow_violations = []
    for g in ("NORTH_GREEN", "EAST_GREEN", "SOUTH_GREEN", "WEST_GREEN"):
        expected_y = g.replace("_GREEN", "_YELLOW")
        for alpha in DFA_ALPHABET:
            inp = alpha["input"]
            if inp in ("RESET", "FAULT"):
                continue
            to = TRANSITION_TABLE[g][inp]["to"]
            if to not in (g, expected_y):
                yellow_violations.append(f"{g}+{inp}->{to}")

    return {
        "allPairsDefined": defined_pairs == len(DFA_STATES) * len(DFA_ALPHABET),
        "totalDefinedPairs": defined_pairs,
        "expectedPairs": len(DFA_STATES) * len(DFA_ALPHABET),
        "zeroConflictingGreens": len(conflicting) == 0,
        "conflictingStates": conflicting,
        "yellowSafetyEnforced": len(yellow_violations) == 0,
        "yellowViolations": yellow_violations,
        "initialState": DFA_INITIAL_STATE,
    }
