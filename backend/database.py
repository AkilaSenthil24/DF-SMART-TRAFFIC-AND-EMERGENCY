"""SQLite persistence layer for the Python/Flask DFA backend."""

import json
import os
import sqlite3
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "traffic_dfa.db")


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS dfa_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                previous_state TEXT NOT NULL,
                received_input TEXT NOT NULL,
                next_state TEXT NOT NULL,
                transition_rule TEXT NOT NULL,
                reason TEXT NOT NULL,
                category TEXT NOT NULL,
                accepted INTEGER NOT NULL,
                signals_json TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS authorized_ambulances (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                driver_name TEXT NOT NULL,
                driver_id TEXT NOT NULL UNIQUE,
                vehicle_id TEXT NOT NULL UNIQUE,
                vehicle_type TEXT NOT NULL,
                organization TEXT NOT NULL,
                account_status TEXT NOT NULL
            )
            """
        )
        cnt = conn.execute("SELECT COUNT(*) FROM authorized_ambulances").fetchone()[0]
        if cnt == 0:
            conn.executemany(
                """
                INSERT INTO authorized_ambulances
                (driver_name, driver_id, vehicle_id, vehicle_type, organization, account_status)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                [
                    ("Ravi Kumar", "DRV-101", "AMB-101", "Ambulance", "City Emergency Hospital", "Authorized"),
                    ("Meera Nair", "DRV-102", "AMB-102", "Ambulance", "Metro Trauma Center", "Authorized"),
                    ("Vikram Rao", "DRV-999", "AMB-999", "Ambulance", "Unregistered Fleet", "Suspended"),
                ],
            )


def record_event(event: Dict[str, Any]) -> Dict[str, Any]:
    ts = datetime.now(timezone.utc).isoformat()
    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO dfa_events
            (timestamp, previous_state, received_input, next_state, transition_rule, reason, category, accepted, signals_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                ts,
                event["previousState"],
                event["receivedInput"],
                event["nextState"],
                event["transitionRule"],
                event["reason"],
                event["category"],
                1 if event["accepted"] else 0,
                json.dumps(event["signals"]),
            ),
        )
        return {"id": cur.lastrowid, "timestamp": ts, **event}


def list_events(limit: int = 200) -> List[Dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM dfa_events ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
        return [
            {
                "id": r["id"],
                "timestamp": r["timestamp"],
                "previousState": r["previous_state"],
                "receivedInput": r["received_input"],
                "nextState": r["next_state"],
                "transitionRule": r["transition_rule"],
                "reason": r["reason"],
                "category": r["category"],
                "accepted": bool(r["accepted"]),
                "signals": json.loads(r["signals_json"]),
            }
            for r in rows
        ]


def find_ambulance(driver_id: str, vehicle_id: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn:
        r = conn.execute(
            "SELECT * FROM authorized_ambulances WHERE UPPER(driver_id)=UPPER(?) AND UPPER(vehicle_id)=UPPER(?)",
            (driver_id.strip(), vehicle_id.strip()),
        ).fetchone()
        if not r:
            return None
        return {
            "id": r["id"],
            "driverName": r["driver_name"],
            "driverId": r["driver_id"],
            "vehicleId": r["vehicle_id"],
            "vehicleType": r["vehicle_type"],
            "organization": r["organization"],
            "accountStatus": r["account_status"],
        }
