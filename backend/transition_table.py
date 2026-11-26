"""Formal DFA definition and complete deterministic transition table."""

from typing import Dict, List, TypedDict


class TransitionRule(TypedDict):
    to: str
    reason: str
    safetyNote: str


DFA_INITIAL_STATE = "ALL_RED"
DFA_ACCEPTING_STATES = ["ALL_RED"]

DFA_ALPHABET = [
    {
        "input": "TIMER",
        "label": "Timer Tick",
        "description": "Normal phase duration elapsed; advances the deterministic traffic signal sequence.",
    },
    {
        "input": "EMERGENCY_NORTH",
        "label": "Emergency (North)",
        "description": "Verified ambulance approaching from the North corridor.",
    },
    {
        "input": "EMERGENCY_EAST",
        "label": "Emergency (East)",
        "description": "Verified ambulance approaching from the East corridor.",
    },
    {
        "input": "EMERGENCY_SOUTH",
        "label": "Emergency (South)",
        "description": "Verified ambulance approaching from the South corridor.",
    },
    {
        "input": "EMERGENCY_WEST",
        "label": "Emergency (West)",
        "description": "Verified ambulance approaching from the West corridor.",
    },
    {
        "input": "EMERGENCY_CLEARED",
        "label": "Emergency Cleared",
        "description": "Ambulance has safely exited the intersection; triggers safe recovery.",
    },
    {
        "input": "RESET",
        "label": "System Reset",
        "description": "Returns the DFA deterministically to initial safe state ALL_RED (q0).",
    },
    {
        "input": "FAULT",
        "label": "Hardware / Sensor Fault",
        "description": "Moves the controller into fail-safe SYSTEM_FAULT (all signals RED) until RESET.",
    },
]

DFA_STATES = [
    {
        "id": "ALL_RED",
        "label": "All Red (Cycle Start)",
        "group": "INTER_GREEN",
        "signals": {"NORTH": "RED", "EAST": "RED", "SOUTH": "RED", "WEST": "RED"},
        "isInitial": True,
        "isAccepting": True,
        "description": "Initial and accepting equilibrium state (q0 in F).",
    },
    {
        "id": "NORTH_GREEN",
        "label": "North Green",
        "group": "NORMAL",
        "signals": {"NORTH": "GREEN", "EAST": "RED", "SOUTH": "RED", "WEST": "RED"},
        "isInitial": False,
        "isAccepting": False,
        "description": "Northbound lane is GREEN; E/S/W remain RED.",
    },
    {
        "id": "NORTH_YELLOW",
        "label": "North Yellow",
        "group": "NORMAL",
        "signals": {"NORTH": "YELLOW", "EAST": "RED", "SOUTH": "RED", "WEST": "RED"},
        "isInitial": False,
        "isAccepting": False,
        "description": "Mandatory yellow clearance on North.",
    },
    {
        "id": "ALL_RED_E",
        "label": "All Red (Pre-East)",
        "group": "INTER_GREEN",
        "signals": {"NORTH": "RED", "EAST": "RED", "SOUTH": "RED", "WEST": "RED"},
        "isInitial": False,
        "isAccepting": False,
        "description": "Inter-green All-Red buffer before East.",
    },
    {
        "id": "EAST_GREEN",
        "label": "East Green",
        "group": "NORMAL",
        "signals": {"NORTH": "RED", "EAST": "GREEN", "SOUTH": "RED", "WEST": "RED"},
        "isInitial": False,
        "isAccepting": False,
        "description": "Eastbound lane is GREEN; N/S/W remain RED.",
    },
    {
        "id": "EAST_YELLOW",
        "label": "East Yellow",
        "group": "NORMAL",
        "signals": {"NORTH": "RED", "EAST": "YELLOW", "SOUTH": "RED", "WEST": "RED"},
        "isInitial": False,
        "isAccepting": False,
        "description": "Mandatory yellow clearance on East.",
    },
    {
        "id": "ALL_RED_S",
        "label": "All Red (Pre-South)",
        "group": "INTER_GREEN",
        "signals": {"NORTH": "RED", "EAST": "RED", "SOUTH": "RED", "WEST": "RED"},
        "isInitial": False,
        "isAccepting": False,
        "description": "Inter-green All-Red buffer before South.",
    },
    {
        "id": "SOUTH_GREEN",
        "label": "South Green",
        "group": "NORMAL",
        "signals": {"NORTH": "RED", "EAST": "RED", "SOUTH": "GREEN", "WEST": "RED"},
        "isInitial": False,
        "isAccepting": False,
        "description": "Southbound lane is GREEN; N/E/W remain RED.",
    },
    {
        "id": "SOUTH_YELLOW",
        "label": "South Yellow",
        "group": "NORMAL",
        "signals": {"NORTH": "RED", "EAST": "RED", "SOUTH": "YELLOW", "WEST": "RED"},
        "isInitial": False,
        "isAccepting": False,
        "description": "Mandatory yellow clearance on South.",
    },
    {
        "id": "ALL_RED_W",
        "label": "All Red (Pre-West)",
        "group": "INTER_GREEN",
        "signals": {"NORTH": "RED", "EAST": "RED", "SOUTH": "RED", "WEST": "RED"},
        "isInitial": False,
        "isAccepting": False,
        "description": "Inter-green All-Red buffer before West.",
    },
    {
        "id": "WEST_GREEN",
        "label": "West Green",
        "group": "NORMAL",
        "signals": {"NORTH": "RED", "EAST": "RED", "SOUTH": "RED", "WEST": "GREEN"},
        "isInitial": False,
        "isAccepting": False,
        "description": "Westbound lane is GREEN; N/E/S remain RED.",
    },
    {
        "id": "WEST_YELLOW",
        "label": "West Yellow",
        "group": "NORMAL",
        "signals": {"NORTH": "RED", "EAST": "RED", "SOUTH": "RED", "WEST": "YELLOW"},
        "isInitial": False,
        "isAccepting": False,
        "description": "Mandatory yellow clearance on West.",
    },
    {
        "id": "EMERGENCY_PREPARATION",
        "label": "Emergency Preparation",
        "group": "EMERGENCY",
        "signals": {"NORTH": "RED", "EAST": "RED", "SOUTH": "RED", "WEST": "RED"},
        "isInitial": False,
        "isAccepting": False,
        "description": "All lanes locked RED while preparing the emergency corridor.",
    },
    {
        "id": "EMERGENCY_NORTH_GREEN",
        "label": "Emergency North Green",
        "group": "EMERGENCY",
        "signals": {"NORTH": "EMERGENCY_GREEN", "EAST": "RED", "SOUTH": "RED", "WEST": "RED"},
        "isInitial": False,
        "isAccepting": False,
        "description": "Dedicated Emergency Green for Northbound ambulance.",
    },
    {
        "id": "EMERGENCY_EAST_GREEN",
        "label": "Emergency East Green",
        "group": "EMERGENCY",
        "signals": {"NORTH": "RED", "EAST": "EMERGENCY_GREEN", "SOUTH": "RED", "WEST": "RED"},
        "isInitial": False,
        "isAccepting": False,
        "description": "Dedicated Emergency Green for Eastbound ambulance.",
    },
    {
        "id": "EMERGENCY_SOUTH_GREEN",
        "label": "Emergency South Green",
        "group": "EMERGENCY",
        "signals": {"NORTH": "RED", "EAST": "RED", "SOUTH": "EMERGENCY_GREEN", "WEST": "RED"},
        "isInitial": False,
        "isAccepting": False,
        "description": "Dedicated Emergency Green for Southbound ambulance.",
    },
    {
        "id": "EMERGENCY_WEST_GREEN",
        "label": "Emergency West Green",
        "group": "EMERGENCY",
        "signals": {"NORTH": "RED", "EAST": "RED", "SOUTH": "RED", "WEST": "EMERGENCY_GREEN"},
        "isInitial": False,
        "isAccepting": False,
        "description": "Dedicated Emergency Green for Westbound ambulance.",
    },
    {
        "id": "EMERGENCY_RECOVERY",
        "label": "Emergency Recovery",
        "group": "EMERGENCY",
        "signals": {"NORTH": "RED", "EAST": "RED", "SOUTH": "RED", "WEST": "RED"},
        "isInitial": False,
        "isAccepting": False,
        "description": "Post-clearance All-Red buffer before resuming normal traffic.",
    },
    {
        "id": "SYSTEM_FAULT",
        "label": "System Fault (Fail-Safe Red)",
        "group": "FAULT",
        "signals": {"NORTH": "RED", "EAST": "RED", "SOUTH": "RED", "WEST": "RED"},
        "isInitial": False,
        "isAccepting": False,
        "description": "Fail-safe error state; requires explicit RESET.",
    },
]

EMERGENCY_INPUTS = [
    "EMERGENCY_NORTH",
    "EMERGENCY_EAST",
    "EMERGENCY_SOUTH",
    "EMERGENCY_WEST",
]

EMERGENCY_TARGET_BY_INPUT = {
    "EMERGENCY_NORTH": "EMERGENCY_NORTH_GREEN",
    "EMERGENCY_EAST": "EMERGENCY_EAST_GREEN",
    "EMERGENCY_SOUTH": "EMERGENCY_SOUTH_GREEN",
    "EMERGENCY_WEST": "EMERGENCY_WEST_GREEN",
}

NORMAL_CYCLE_NEXT = {
    "ALL_RED": ("NORTH_GREEN", "Timer tick starts Northbound green from ALL_RED."),
    "NORTH_GREEN": ("NORTH_YELLOW", "North green elapsed; stepping to North yellow."),
    "NORTH_YELLOW": ("ALL_RED_E", "North yellow finished; entering All-Red pre-East."),
    "ALL_RED_E": ("EAST_GREEN", "All-Red buffer complete; opening East green."),
    "EAST_GREEN": ("EAST_YELLOW", "East green elapsed; stepping to East yellow."),
    "EAST_YELLOW": ("ALL_RED_S", "East yellow finished; entering All-Red pre-South."),
    "ALL_RED_S": ("SOUTH_GREEN", "All-Red buffer complete; opening South green."),
    "SOUTH_GREEN": ("SOUTH_YELLOW", "South green elapsed; stepping to South yellow."),
    "SOUTH_YELLOW": ("ALL_RED_W", "South yellow finished; entering All-Red pre-West."),
    "ALL_RED_W": ("WEST_GREEN", "All-Red buffer complete; opening West green."),
    "WEST_GREEN": ("WEST_YELLOW", "West green elapsed; stepping to West yellow."),
    "WEST_YELLOW": ("ALL_RED", "West yellow finished; returning to accepting ALL_RED (q0)."),
}


def build_transition_table() -> Dict[str, Dict[str, TransitionRule]]:
    table: Dict[str, Dict[str, TransitionRule]] = {}
    for st in DFA_STATES:
        q = st["id"]
        row: Dict[str, TransitionRule] = {}
        for alpha in DFA_ALPHABET:
            inp = alpha["input"]
            if inp == "RESET":
                row[inp] = {
                    "to": "ALL_RED",
                    "reason": "Authorized RESET returns controller to ALL_RED.",
                    "safetyNote": "All signals RED.",
                }
            elif inp == "FAULT":
                row[inp] = {
                    "to": "SYSTEM_FAULT",
                    "reason": "Fault detected; entering fail-safe SYSTEM_FAULT.",
                    "safetyNote": "All directions RED until RESET.",
                }
            elif q == "SYSTEM_FAULT":
                row[inp] = {
                    "to": "SYSTEM_FAULT",
                    "reason": f"In SYSTEM_FAULT; {inp} ignored until RESET.",
                    "safetyNote": "Fail-safe lock.",
                }
            elif q in ("NORTH_GREEN", "EAST_GREEN", "SOUTH_GREEN", "WEST_GREEN"):
                yellow = q.replace("_GREEN", "_YELLOW")
                if inp == "TIMER":
                    nxt, rsn = NORMAL_CYCLE_NEXT[q]
                    row[inp] = {"to": nxt, "reason": rsn, "safetyNote": "Yellow required."}
                elif inp in EMERGENCY_INPUTS:
                    row[inp] = {
                        "to": yellow,
                        "reason": f"{inp} received in {q}; stepping to {yellow} first.",
                        "safetyNote": "Conflicting green cannot drop without yellow.",
                    }
                else:
                    row[inp] = {"to": q, "reason": f"{inp} inactive in {q}.", "safetyNote": "No-op."}
            elif q in ("NORTH_YELLOW", "EAST_YELLOW", "SOUTH_YELLOW", "WEST_YELLOW"):
                nxt, rsn = NORMAL_CYCLE_NEXT[q]
                if inp == "TIMER" or inp in EMERGENCY_INPUTS:
                    row[inp] = {"to": nxt, "reason": rsn, "safetyNote": "Must reach ALL_RED."}
                else:
                    row[inp] = {"to": q, "reason": f"{inp} ignored in {q}.", "safetyNote": "Yellow locked."}
            elif q in ("ALL_RED", "ALL_RED_E", "ALL_RED_S", "ALL_RED_W"):
                if inp == "TIMER":
                    nxt, rsn = NORMAL_CYCLE_NEXT[q]
                    row[inp] = {"to": nxt, "reason": rsn, "safetyNote": "Single green only."}
                elif inp in EMERGENCY_INPUTS:
                    row[inp] = {
                        "to": "EMERGENCY_PREPARATION",
                        "reason": f"All lanes RED in {q}; entering EMERGENCY_PREPARATION.",
                        "safetyNote": "Corridor locked.",
                    }
                else:
                    row[inp] = {"to": q, "reason": f"No active emergency in {q}.", "safetyNote": "All-Red."}
            elif q == "EMERGENCY_PREPARATION":
                if inp in EMERGENCY_INPUTS:
                    row[inp] = {
                        "to": EMERGENCY_TARGET_BY_INPUT[inp],
                        "reason": f"Granting {EMERGENCY_TARGET_BY_INPUT[inp]}.",
                        "safetyNote": "Conflicting lanes locked RED.",
                    }
                elif inp == "EMERGENCY_CLEARED":
                    row[inp] = {
                        "to": "EMERGENCY_RECOVERY",
                        "reason": "Cleared during preparation.",
                        "safetyNote": "Safe recovery.",
                    }
                else:
                    row[inp] = {
                        "to": "EMERGENCY_PREPARATION",
                        "reason": "Holding EMERGENCY_PREPARATION until direction confirmed.",
                        "safetyNote": "All lanes RED.",
                    }
            elif q in (
                "EMERGENCY_NORTH_GREEN",
                "EMERGENCY_EAST_GREEN",
                "EMERGENCY_SOUTH_GREEN",
                "EMERGENCY_WEST_GREEN",
            ):
                if inp == "EMERGENCY_CLEARED":
                    row[inp] = {
                        "to": "EMERGENCY_RECOVERY",
                        "reason": f"Ambulance cleared {q}; moving to EMERGENCY_RECOVERY.",
                        "safetyNote": "All lanes RED.",
                    }
                else:
                    row[inp] = {
                        "to": q,
                        "reason": f"Non-preemptive lock: {q} active until EMERGENCY_CLEARED.",
                        "safetyNote": "Active ambulance protected.",
                    }
            elif q == "EMERGENCY_RECOVERY":
                if inp in ("TIMER", "EMERGENCY_CLEARED"):
                    row[inp] = {
                        "to": "ALL_RED",
                        "reason": "Recovery complete; returning to ALL_RED (q0).",
                        "safetyNote": "Normal cycle resumes.",
                    }
                elif inp in EMERGENCY_INPUTS:
                    row[inp] = {
                        "to": "EMERGENCY_PREPARATION",
                        "reason": f"Next emergency {inp} entering EMERGENCY_PREPARATION.",
                        "safetyNote": "All lanes RED.",
                    }
        table[q] = row
    return table


TRANSITION_TABLE = build_transition_table()
STATE_SIGNALS = {s["id"]: s["signals"] for s in DFA_STATES}
VALID_INPUTS = {a["input"] for a in DFA_ALPHABET}
