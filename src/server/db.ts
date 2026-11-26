import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type {
  AmbulanceCredential,
  DfaState,
  Direction,
  LiveSystemSnapshot,
  TransitionEventRecord,
  VerificationSession,
} from '../shared/dfaTypes.ts';
import { DFA_INITIAL_STATE, getSignalsForState } from './dfaEngine.ts';

const DB_PATH = path.resolve(process.cwd(), 'traffic_dfa.db');

export const db = new DatabaseSync(DB_PATH);

export function initDatabase(): void {
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS system_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_state TEXT NOT NULL,
      previous_state TEXT,
      last_input TEXT,
      last_transition_rule TEXT,
      last_reason TEXT NOT NULL,
      simulation_running INTEGER NOT NULL DEFAULT 0,
      active_emergency_direction TEXT,
      pending_emergency_direction TEXT,
      emergency_queue TEXT NOT NULL DEFAULT '[]',
      ambulance_phase TEXT NOT NULL DEFAULT 'IDLE',
      step_count INTEGER NOT NULL DEFAULT 0,
      verification_json TEXT NOT NULL
    );

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
    );

    CREATE TABLE IF NOT EXISTS authorized_ambulances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_name TEXT NOT NULL,
      driver_id TEXT NOT NULL UNIQUE,
      vehicle_id TEXT NOT NULL UNIQUE,
      vehicle_type TEXT NOT NULL,
      organization TEXT NOT NULL,
      account_status TEXT NOT NULL
    );
  `);

  const emptyVerification: VerificationSession = {
    verified: false,
    token: null,
    driverName: null,
    driverId: null,
    vehicleId: null,
    organization: null,
    verifiedAt: null,
  };

  const existingState = db.prepare('SELECT id FROM system_state WHERE id = 1').get();
  if (!existingState) {
    db.prepare(
      `INSERT INTO system_state (
        id, current_state, previous_state, last_input, last_transition_rule, last_reason,
        simulation_running, active_emergency_direction, pending_emergency_direction,
        emergency_queue, ambulance_phase, step_count, verification_json
      ) VALUES (1, ?, NULL, NULL, NULL, ?, 0, NULL, NULL, '[]', 'IDLE', 0, ?)`,
    ).run(
      DFA_INITIAL_STATE,
      'System initialized at safe equilibrium state ALL_RED (q0).',
      JSON.stringify(emptyVerification),
    );
  }

  const countAmb = db.prepare('SELECT COUNT(*) as cnt FROM authorized_ambulances').get() as {
    cnt: number;
  };
  if (countAmb.cnt === 0) {
    const insertAmb = db.prepare(
      `INSERT INTO authorized_ambulances (
        driver_name, driver_id, vehicle_id, vehicle_type, organization, account_status
      ) VALUES (?, ?, ?, ?, ?, ?)`,
    );
    insertAmb.run(
      'Ravi Kumar',
      'DRV-101',
      'AMB-101',
      'Ambulance',
      'City Emergency Hospital',
      'Authorized',
    );
    insertAmb.run(
      'Meera Nair',
      'DRV-102',
      'AMB-102',
      'Ambulance',
      'Metro Trauma Center',
      'Authorized',
    );
    insertAmb.run(
      'Vikram Rao',
      'DRV-999',
      'AMB-999',
      'Ambulance',
      'Unregistered Fleet',
      'Suspended',
    );
  }
}

export function getSnapshot(): LiveSystemSnapshot {
  const row = db.prepare('SELECT * FROM system_state WHERE id = 1').get() as {
    current_state: DfaState;
    previous_state: DfaState | null;
    last_input: string | null;
    last_transition_rule: string | null;
    last_reason: string;
    simulation_running: number;
    active_emergency_direction: Direction | null;
    pending_emergency_direction: Direction | null;
    emergency_queue: string;
    ambulance_phase: LiveSystemSnapshot['ambulancePhase'];
    step_count: number;
    verification_json: string;
  };

  return {
    currentState: row.current_state,
    previousState: row.previous_state,
    lastInput: row.last_input,
    lastTransitionRule: row.last_transition_rule,
    lastReason: row.last_reason,
    signals: getSignalsForState(row.current_state),
    simulationRunning: Boolean(row.simulation_running),
    activeEmergencyDirection: row.active_emergency_direction,
    pendingEmergencyDirection: row.pending_emergency_direction,
    emergencyQueue: JSON.parse(row.emergency_queue || '[]') as Direction[],
    ambulancePhase: row.ambulance_phase,
    stepCount: row.step_count,
    verification: JSON.parse(row.verification_json) as VerificationSession,
  };
}

export function saveSnapshot(snapshot: LiveSystemSnapshot): void {
  db.prepare(
    `UPDATE system_state SET
      current_state = ?,
      previous_state = ?,
      last_input = ?,
      last_transition_rule = ?,
      last_reason = ?,
      simulation_running = ?,
      active_emergency_direction = ?,
      pending_emergency_direction = ?,
      emergency_queue = ?,
      ambulance_phase = ?,
      step_count = ?,
      verification_json = ?
     WHERE id = 1`,
  ).run(
    snapshot.currentState,
    snapshot.previousState,
    snapshot.lastInput,
    snapshot.lastTransitionRule,
    snapshot.lastReason,
    snapshot.simulationRunning ? 1 : 0,
    snapshot.activeEmergencyDirection,
    snapshot.pendingEmergencyDirection,
    JSON.stringify(snapshot.emergencyQueue),
    snapshot.ambulancePhase,
    snapshot.stepCount,
    JSON.stringify(snapshot.verification),
  );
}

export function recordEvent(event: Omit<TransitionEventRecord, 'id' | 'timestamp'>): TransitionEventRecord {
  const timestamp = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO dfa_events (
        timestamp, previous_state, received_input, next_state, transition_rule,
        reason, category, accepted, signals_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      timestamp,
      event.previousState,
      event.receivedInput,
      event.nextState,
      event.transitionRule,
      event.reason,
      event.category,
      event.accepted ? 1 : 0,
      JSON.stringify(event.signals),
    );

  return {
    id: Number(result.lastInsertRowid),
    timestamp,
    ...event,
  };
}

export function listEvents(limit = 200, category?: string): TransitionEventRecord[] {
  const rows = (
    category && category !== 'ALL'
      ? db
          .prepare('SELECT * FROM dfa_events WHERE category = ? ORDER BY id DESC LIMIT ?')
          .all(category, limit)
      : db.prepare('SELECT * FROM dfa_events ORDER BY id DESC LIMIT ?').all(limit)
  ) as Array<{
    id: number;
    timestamp: string;
    previous_state: DfaState;
    received_input: string;
    next_state: DfaState;
    transition_rule: string;
    reason: string;
    category: TransitionEventRecord['category'];
    accepted: number;
    signals_json: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    timestamp: row.timestamp,
    previousState: row.previous_state,
    receivedInput: row.received_input,
    nextState: row.next_state,
    transitionRule: row.transition_rule,
    reason: row.reason,
    category: row.category,
    accepted: Boolean(row.accepted),
    signals: JSON.parse(row.signals_json),
  }));
}

export function clearEvents(): void {
  db.exec('DELETE FROM dfa_events');
}

export function listAmbulances(): AmbulanceCredential[] {
  const rows = db.prepare('SELECT * FROM authorized_ambulances ORDER BY id ASC').all() as Array<{
    id: number;
    driver_name: string;
    driver_id: string;
    vehicle_id: string;
    vehicle_type: string;
    organization: string;
    account_status: AmbulanceCredential['accountStatus'];
  }>;

  return rows.map((r) => ({
    id: r.id,
    driverName: r.driver_name,
    driverId: r.driver_id,
    vehicleId: r.vehicle_id,
    vehicleType: r.vehicle_type,
    organization: r.organization,
    accountStatus: r.account_status,
  }));
}

export function findAmbulanceMatch(driverId: string, vehicleId: string): AmbulanceCredential | null {
  const row = db
    .prepare(
      'SELECT * FROM authorized_ambulances WHERE UPPER(driver_id) = UPPER(?) AND UPPER(vehicle_id) = UPPER(?)',
    )
    .get(driverId.trim(), vehicleId.trim()) as
    | {
        id: number;
        driver_name: string;
        driver_id: string;
        vehicle_id: string;
        vehicle_type: string;
        organization: string;
        account_status: AmbulanceCredential['accountStatus'];
      }
    | undefined;

  if (!row) return null;
  return {
    id: row.id,
    driverName: row.driver_name,
    driverId: row.driver_id,
    vehicleId: row.vehicle_id,
    vehicleType: row.vehicle_type,
    organization: row.organization,
    accountStatus: row.account_status,
  };
}
