# DFA-Based Smart Traffic Signal Management and Emergency Ambulance Route Simulation

B.Tech Theory of Computation Capstone Project demonstrating how a formal **Deterministic Finite Automaton (DFA)** governs four-way traffic signal transitions and verified emergency ambulance routing.

## Formal Model

$$M = (Q, \Sigma, \delta, q_0, F)$$

- **Q (19 states):** `ALL_RED`, `NORTH_GREEN`, `NORTH_YELLOW`, `ALL_RED_E`, `EAST_GREEN`, `EAST_YELLOW`, `ALL_RED_S`, `SOUTH_GREEN`, `SOUTH_YELLOW`, `ALL_RED_W`, `WEST_GREEN`, `WEST_YELLOW`, `EMERGENCY_PREPARATION`, `EMERGENCY_NORTH_GREEN`, `EMERGENCY_EAST_GREEN`, `EMERGENCY_SOUTH_GREEN`, `EMERGENCY_WEST_GREEN`, `EMERGENCY_RECOVERY`, `SYSTEM_FAULT`
- **Σ (8 inputs):** `TIMER`, `EMERGENCY_NORTH`, `EMERGENCY_EAST`, `EMERGENCY_SOUTH`, `EMERGENCY_WEST`, `EMERGENCY_CLEARED`, `RESET`, `FAULT`
- **δ:** Complete 19 × 8 = 152 deterministic transitions
- **q0:** `ALL_RED`
- **F:** `{ALL_RED}` (safe equilibrium checkpoint reached after completing a full cycle or emergency recovery)

## Running Locally on Windows (VS Code)

### Option A: Full-Stack Node.js + SQLite + React (Recommended — Single Command)

1. Open the project folder in **VS Code**.
2. Open the integrated terminal (`Ctrl + \``).
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the backend + frontend server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` in your browser.

### Option B: Python / Flask Backend Verification & Tests

To test the Python DFA engine (`backend/dfa_engine.py`, `backend/transition_table.py`, `backend/test_dfa.py`):

```bash
cd backend
python -m unittest test_dfa.py -v
```

To run the Flask backend separately:

```bash
cd backend
pip install -r requirements.txt
python app.py
```

## Sample Emergency Verification Credentials

- **Driver Name:** `Ravi Kumar`
- **Driver ID:** `DRV-101`
- **Vehicle ID:** `AMB-101`
- **Organization:** `City Emergency Hospital`
- **Status:** `Authorized`
