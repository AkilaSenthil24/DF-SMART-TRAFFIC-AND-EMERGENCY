"""Simulation state coordinator connecting ambulance routing strictly to the DFA engine."""

from typing import Any, Dict, List, Optional
from dfa_engine import evaluate_dfa_transition
from transition_table import DFA_INITIAL_STATE, STATE_SIGNALS


class TrafficSimulationController:
    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        self.current_state: str = DFA_INITIAL_STATE
        self.previous_state: Optional[str] = None
        self.last_input: Optional[str] = None
        self.last_rule: Optional[str] = None
        self.last_reason: str = "System initialized at ALL_RED (q0)."
        self.simulation_running: bool = False
        self.active_emergency_direction: Optional[str] = None
        self.pending_emergency_direction: Optional[str] = None
        self.emergency_queue: List[str] = []
        self.ambulance_phase: str = "IDLE"
        self.step_count: int = 0

    def snapshot(self) -> Dict[str, Any]:
        return {
            "currentState": self.current_state,
            "previousState": self.previous_state,
            "lastInput": self.last_input,
            "lastTransitionRule": self.last_rule,
            "lastReason": self.last_reason,
            "signals": STATE_SIGNALS[self.current_state],
            "simulationRunning": self.simulation_running,
            "activeEmergencyDirection": self.active_emergency_direction,
            "pendingEmergencyDirection": self.pending_emergency_direction,
            "emergencyQueue": list(self.emergency_queue),
            "ambulancePhase": self.ambulance_phase,
            "stepCount": self.step_count,
        }

    def step(self, raw_input: str) -> Dict[str, Any]:
        res = evaluate_dfa_transition(self.current_state, raw_input)
        if not res["valid"]:
            return {"accepted": False, "result": res, "snapshot": self.snapshot()}
        self.previous_state = res["previousState"]
        self.current_state = res["nextState"]
        self.last_input = res["receivedInput"]
        self.last_rule = res["transitionRule"]
        self.last_reason = res["reason"]
        self.step_count += 1
        if self.current_state.startswith("EMERGENCY_") and self.current_state.endswith("_GREEN"):
            self.active_emergency_direction = self.current_state.split("_")[1]
            self.pending_emergency_direction = None
            self.ambulance_phase = "CROSSING"
        elif self.current_state == "EMERGENCY_RECOVERY":
            self.active_emergency_direction = None
            self.ambulance_phase = "CLEARED"
        elif self.current_state == "ALL_RED":
            self.ambulance_phase = "IDLE"
        return {"accepted": True, "result": res, "snapshot": self.snapshot()}
