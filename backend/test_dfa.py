"""Comprehensive unit tests for the formal DFA engine and transition table."""

import unittest
from dfa_engine import evaluate_dfa_transition, verify_invariants
from transition_table import DFA_INITIAL_STATE


class TestDfaTrafficEngine(unittest.TestCase):
    def test_invariants_pass(self):
        inv = verify_invariants()
        self.assertTrue(inv["allPairsDefined"])
        self.assertEqual(inv["totalDefinedPairs"], 152)
        self.assertTrue(inv["zeroConflictingGreens"])
        self.assertTrue(inv["yellowSafetyEnforced"])

    def test_normal_traffic_cycle(self):
        expected = [
            "NORTH_GREEN",
            "NORTH_YELLOW",
            "ALL_RED_E",
            "EAST_GREEN",
            "EAST_YELLOW",
            "ALL_RED_S",
            "SOUTH_GREEN",
            "SOUTH_YELLOW",
            "ALL_RED_W",
            "WEST_GREEN",
            "WEST_YELLOW",
            "ALL_RED",
        ]
        state = DFA_INITIAL_STATE
        for target in expected:
            res = evaluate_dfa_transition(state, "TIMER")
            self.assertTrue(res["valid"])
            self.assertEqual(res["nextState"], target)
            state = res["nextState"]

    def test_emergency_east_from_north_green(self):
        chain = [
            ("NORTH_GREEN", "EMERGENCY_EAST", "NORTH_YELLOW"),
            ("NORTH_YELLOW", "EMERGENCY_EAST", "ALL_RED_E"),
            ("ALL_RED_E", "EMERGENCY_EAST", "EMERGENCY_PREPARATION"),
            ("EMERGENCY_PREPARATION", "EMERGENCY_EAST", "EMERGENCY_EAST_GREEN"),
            ("EMERGENCY_EAST_GREEN", "EMERGENCY_CLEARED", "EMERGENCY_RECOVERY"),
            ("EMERGENCY_RECOVERY", "TIMER", "ALL_RED"),
        ]
        for cur, inp, nxt in chain:
            res = evaluate_dfa_transition(cur, inp)
            self.assertTrue(res["valid"])
            self.assertEqual(res["nextState"], nxt)

    def test_invalid_input_rejected(self):
        res = evaluate_dfa_transition("NORTH_GREEN", "SKIP_TO_SOUTH")
        self.assertFalse(res["valid"])
        self.assertEqual(res["nextState"], "NORTH_GREEN")

    def test_fault_and_reset(self):
        res = evaluate_dfa_transition("EAST_GREEN", "FAULT")
        self.assertEqual(res["nextState"], "SYSTEM_FAULT")
        res2 = evaluate_dfa_transition("SYSTEM_FAULT", "TIMER")
        self.assertEqual(res2["nextState"], "SYSTEM_FAULT")
        res3 = evaluate_dfa_transition("SYSTEM_FAULT", "RESET")
        self.assertEqual(res3["nextState"], "ALL_RED")


if __name__ == "__main__":
    unittest.main()
