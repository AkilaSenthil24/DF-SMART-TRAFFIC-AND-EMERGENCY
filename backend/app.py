"""Flask REST API for the DFA Smart Traffic & Emergency Ambulance backend."""

from flask import Flask, jsonify, request
from database import find_ambulance, init_db, list_events, record_event
from dfa_engine import verify_invariants
from simulation import TrafficSimulationController
from transition_table import DFA_ACCEPTING_STATES, DFA_ALPHABET, DFA_INITIAL_STATE, DFA_STATES, TRANSITION_TABLE

init_db()
app = Flask(__name__)
controller = TrafficSimulationController()


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "engine": "Python-Flask-DFA"})


@app.get("/api/dfa/definition")
def definition():
    return jsonify({
        "formalName": "Smart Traffic Signal & Emergency Corridor DFA",
        "tupleSummary": {
            "Q_count": len(DFA_STATES),
            "Sigma_count": len(DFA_ALPHABET),
            "delta_count": len(DFA_STATES) * len(DFA_ALPHABET),
            "q0": DFA_INITIAL_STATE,
            "F": DFA_ACCEPTING_STATES,
        },
        "states": DFA_STATES,
        "alphabet": DFA_ALPHABET,
        "transitionTable": TRANSITION_TABLE,
    })


@app.get("/api/dfa/verify-invariants")
def invariants():
    return jsonify(verify_invariants())


@app.get("/api/dfa/state")
def get_state():
    return jsonify(controller.snapshot())


@app.post("/api/dfa/step")
def step_dfa():
    payload = request.get_json(silent=True) or {}
    out = controller.step(str(payload.get("input", "")))
    record_event({
        "previousState": out["result"]["previousState"],
        "receivedInput": out["result"]["receivedInput"],
        "nextState": out["result"]["nextState"],
        "transitionRule": out["result"]["transitionRule"],
        "reason": out["result"]["reason"],
        "category": "NORMAL" if out["accepted"] else "INVALID",
        "accepted": out["accepted"],
        "signals": out["result"]["signals"],
    })
    return jsonify(out)


@app.post("/api/dfa/reset")
def reset_dfa():
    out = controller.step("RESET")
    controller.reset()
    return jsonify(out)


@app.post("/api/emergency/verify")
def verify_emergency():
    payload = request.get_json(silent=True) or {}
    match = find_ambulance(payload.get("driverId", ""), payload.get("vehicleId", ""))
    if not match or match["accountStatus"] != "Authorized":
        return jsonify({"verified": False, "message": "Unauthorized or invalid credentials."}), 403
    return jsonify({"verified": True, "ambulance": match})


@app.get("/api/history")
def history():
    return jsonify({"events": list_events()})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
