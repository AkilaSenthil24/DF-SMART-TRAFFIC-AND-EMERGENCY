import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import type { DfaInput, Direction, LiveSystemSnapshot } from './src/shared/dfaTypes.ts';
import {
  clearEvents,
  findAmbulanceMatch,
  getSnapshot,
  initDatabase,
  listAmbulances,
  listEvents,
  recordEvent,
  saveSnapshot,
} from './src/server/db.ts';
import {
  DFA_DEFINITION,
  directionToEmergencyInput,
  emergencyStateToDirection,
  evaluateDfaTransition,
  verifyDfaInvariants,
} from './src/server/dfaEngine.ts';

initDatabase();

const app = express();
app.use(express.json());

const VALID_DIRECTIONS: Direction[] = ['NORTH', 'EAST', 'SOUTH', 'WEST'];

function deriveCategory(input: string, valid: boolean): 'NORMAL' | 'EMERGENCY' | 'INVALID' | 'FAULT' | 'RESET' {
  if (!valid) return 'INVALID';
  if (input === 'RESET') return 'RESET';
  if (input === 'FAULT') return 'FAULT';
  if (input.startsWith('EMERGENCY')) return 'EMERGENCY';
  return 'NORMAL';
}

function syncAmbulancePhaseFromState(snapshot: LiveSystemSnapshot): void {
  const emergencyDir = emergencyStateToDirection(snapshot.currentState);
  if (emergencyDir) {
    snapshot.activeEmergencyDirection = emergencyDir;
    snapshot.pendingEmergencyDirection = null;
    snapshot.ambulancePhase = 'CROSSING';
    return;
  }

  if (snapshot.currentState === 'EMERGENCY_RECOVERY') {
    snapshot.activeEmergencyDirection = null;
    snapshot.ambulancePhase = snapshot.pendingEmergencyDirection ? 'WAITING_AT_RED' : 'CLEARED';
    return;
  }

  if (snapshot.pendingEmergencyDirection) {
    snapshot.ambulancePhase = 'WAITING_AT_RED';
    return;
  }

  if (snapshot.currentState === 'ALL_RED' && snapshot.ambulancePhase === 'CLEARED') {
    snapshot.ambulancePhase = 'IDLE';
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', engine: 'DFA-Traffic-Control' });
});

app.get('/api/dfa/definition', (_req, res) => {
  res.json(DFA_DEFINITION);
});

app.get('/api/dfa/verify-invariants', (_req, res) => {
  res.json(verifyDfaInvariants());
});

app.get('/api/dfa/state', (_req, res) => {
  res.json(getSnapshot());
});

app.post('/api/dfa/step', (req, res) => {
  const rawInput = typeof req.body?.input === 'string' ? req.body.input : '';
  const snapshot = getSnapshot();
  const result = evaluateDfaTransition(snapshot.currentState, rawInput);

  if (!result.valid) {
    const event = recordEvent({
      previousState: result.previousState,
      receivedInput: result.receivedInput || '(empty)',
      nextState: result.nextState,
      transitionRule: result.transitionRule,
      reason: result.reason,
      category: 'INVALID',
      accepted: false,
      signals: result.signals,
    });
    return res.json({ accepted: false, result, snapshot, event });
  }

  snapshot.previousState = result.previousState;
  snapshot.currentState = result.nextState;
  snapshot.lastInput = result.receivedInput;
  snapshot.lastTransitionRule = result.transitionRule;
  snapshot.lastReason = result.reason;
  snapshot.signals = result.signals;
  snapshot.stepCount += 1;

  if (result.receivedInput === 'RESET') {
    snapshot.activeEmergencyDirection = null;
    snapshot.pendingEmergencyDirection = null;
    snapshot.emergencyQueue = [];
    snapshot.ambulancePhase = 'IDLE';
  } else if (result.receivedInput === 'FAULT') {
    snapshot.simulationRunning = false;
  } else {
    const targetDir = emergencyStateToDirection(result.nextState);
    if (targetDir) {
      snapshot.activeEmergencyDirection = targetDir;
      snapshot.pendingEmergencyDirection = null;
      snapshot.ambulancePhase = 'CROSSING';
    } else if (result.nextState === 'EMERGENCY_RECOVERY') {
      snapshot.activeEmergencyDirection = null;
      snapshot.ambulancePhase = 'CLEARED';
    } else if (result.nextState === 'ALL_RED') {
      snapshot.ambulancePhase = 'IDLE';
    }
  }

  saveSnapshot(snapshot);
  const event = recordEvent({
    previousState: result.previousState,
    receivedInput: result.receivedInput,
    nextState: result.nextState,
    transitionRule: result.transitionRule,
    reason: result.reason,
    category: deriveCategory(result.receivedInput, true),
    accepted: true,
    signals: result.signals,
  });

  res.json({ accepted: true, result, snapshot, event });
});

app.post('/api/dfa/reset', (_req, res) => {
  const snapshot = getSnapshot();
  const result = evaluateDfaTransition(snapshot.currentState, 'RESET');

  snapshot.previousState = result.previousState;
  snapshot.currentState = result.nextState;
  snapshot.lastInput = 'RESET';
  snapshot.lastTransitionRule = result.transitionRule;
  snapshot.lastReason = result.reason;
  snapshot.signals = result.signals;
  snapshot.simulationRunning = false;
  snapshot.activeEmergencyDirection = null;
  snapshot.pendingEmergencyDirection = null;
  snapshot.emergencyQueue = [];
  snapshot.ambulancePhase = 'IDLE';
  snapshot.stepCount += 1;

  saveSnapshot(snapshot);
  const event = recordEvent({
    previousState: result.previousState,
    receivedInput: 'RESET',
    nextState: result.nextState,
    transitionRule: result.transitionRule,
    reason: result.reason,
    category: 'RESET',
    accepted: true,
    signals: result.signals,
  });

  res.json({ snapshot, result, event });
});

app.get('/api/ambulances', (_req, res) => {
  res.json({ ambulances: listAmbulances() });
});

app.post('/api/emergency/verify', (req, res) => {
  const driverName = typeof req.body?.driverName === 'string' ? req.body.driverName.trim() : '';
  const driverId = typeof req.body?.driverId === 'string' ? req.body.driverId.trim() : '';
  const vehicleId = typeof req.body?.vehicleId === 'string' ? req.body.vehicleId.trim() : '';
  const snapshot = getSnapshot();

  if (!driverId || !vehicleId) {
    const event = recordEvent({
      previousState: snapshot.currentState,
      receivedInput: `VERIFY(${driverId || 'MISSING'}, ${vehicleId || 'MISSING'})`,
      nextState: snapshot.currentState,
      transitionRule: 'Verification Rejected (Missing Credentials)',
      reason: 'Driver ID and Vehicle ID are required. Traffic signal state was not modified.',
      category: 'VERIFICATION',
      accepted: false,
      signals: snapshot.signals,
    });
    return res.status(400).json({
      verified: false,
      message: 'Driver ID and Vehicle ID are required.',
      snapshot,
      event,
    });
  }

  const match = findAmbulanceMatch(driverId, vehicleId);
  if (!match || (driverName && match.driverName.toLowerCase() !== driverName.toLowerCase())) {
    const event = recordEvent({
      previousState: snapshot.currentState,
      receivedInput: `VERIFY(${driverId}, ${vehicleId})`,
      nextState: snapshot.currentState,
      transitionRule: 'Verification Rejected (Invalid Credentials)',
      reason: `No authorized ambulance matches Driver ID "${driverId}" and Vehicle ID "${vehicleId}". Traffic signal state remained ${snapshot.currentState}.`,
      category: 'VERIFICATION',
      accepted: false,
      signals: snapshot.signals,
    });
    return res.status(403).json({
      verified: false,
      message: 'Verification failed: Driver ID, Driver Name, or Vehicle ID is invalid.',
      snapshot,
      event,
    });
  }

  if (match.accountStatus !== 'Authorized') {
    const event = recordEvent({
      previousState: snapshot.currentState,
      receivedInput: `VERIFY(${driverId}, ${vehicleId})`,
      nextState: snapshot.currentState,
      transitionRule: `Verification Rejected (Status: ${match.accountStatus})`,
      reason: `Vehicle ${match.vehicleId} account status is "${match.accountStatus}". Only Authorized ambulances may dispatch DFA emergency inputs.`,
      category: 'VERIFICATION',
      accepted: false,
      signals: snapshot.signals,
    });
    return res.status(403).json({
      verified: false,
      message: `Account status is "${match.accountStatus}". Only Authorized ambulances can trigger emergency signals.`,
      snapshot,
      event,
    });
  }

  const token = crypto.randomBytes(12).toString('hex');
  snapshot.verification = {
    verified: true,
    token,
    driverName: match.driverName,
    driverId: match.driverId,
    vehicleId: match.vehicleId,
    organization: match.organization,
    verifiedAt: new Date().toISOString(),
  };
  saveSnapshot(snapshot);

  const event = recordEvent({
    previousState: snapshot.currentState,
    receivedInput: `VERIFY(${match.driverId}, ${match.vehicleId})`,
    nextState: snapshot.currentState,
    transitionRule: 'Verification Authorized',
    reason: `Authorized ${match.driverName} (${match.vehicleId}, ${match.organization}). Ready to convert emergency requests into DFA inputs.`,
    category: 'VERIFICATION',
    accepted: true,
    signals: snapshot.signals,
  });

  res.json({
    verified: true,
    message: `Verified ${match.driverName} (${match.vehicleId}) from ${match.organization}.`,
    verification: snapshot.verification,
    snapshot,
    event,
  });
});

app.post('/api/emergency/logout', (_req, res) => {
  const snapshot = getSnapshot();
  snapshot.verification = {
    verified: false,
    token: null,
    driverName: null,
    driverId: null,
    vehicleId: null,
    organization: null,
    verifiedAt: null,
  };
  saveSnapshot(snapshot);
  res.json({ snapshot });
});

app.post('/api/emergency/request', (req, res) => {
  const direction = String(req.body?.direction || '').toUpperCase() as Direction;
  const snapshot = getSnapshot();

  if (!VALID_DIRECTIONS.includes(direction)) {
    const event = recordEvent({
      previousState: snapshot.currentState,
      receivedInput: `EMERGENCY_${direction || 'UNKNOWN'}`,
      nextState: snapshot.currentState,
      transitionRule: 'Rejected (Invalid Direction)',
      reason: `Direction "${req.body?.direction}" is not in {NORTH, EAST, SOUTH, WEST}. State unchanged.`,
      category: 'INVALID',
      accepted: false,
      signals: snapshot.signals,
    });
    return res.status(400).json({ accepted: false, message: 'Invalid direction.', snapshot, event });
  }

  if (!snapshot.verification.verified) {
    const event = recordEvent({
      previousState: snapshot.currentState,
      receivedInput: `UNVERIFIED_EMERGENCY_${direction}`,
      nextState: snapshot.currentState,
      transitionRule: 'Blocked (Unverified Request)',
      reason: `Emergency request from ${direction} rejected because ambulance verification is not complete. Traffic signal remained ${snapshot.currentState}.`,
      category: 'VERIFICATION',
      accepted: false,
      signals: snapshot.signals,
    });
    return res.status(403).json({
      accepted: false,
      message: 'Emergency request blocked: Complete Ambulance Verification first.',
      snapshot,
      event,
    });
  }

  if (snapshot.currentState === 'SYSTEM_FAULT') {
    return res.status(409).json({
      accepted: false,
      message: 'System is in SYSTEM_FAULT state. Execute RESET before dispatching an ambulance.',
      snapshot,
    });
  }

  // Deterministic FIFO Queue Policy when an emergency is already active or pending
  if (snapshot.activeEmergencyDirection || snapshot.pendingEmergencyDirection) {
    if (
      snapshot.activeEmergencyDirection === direction ||
      snapshot.pendingEmergencyDirection === direction ||
      snapshot.emergencyQueue.includes(direction)
    ) {
      return res.json({
        accepted: true,
        queued: false,
        message: `Emergency for ${direction} is already active or queued.`,
        snapshot,
      });
    }

    snapshot.emergencyQueue.push(direction);
    saveSnapshot(snapshot);

    const event = recordEvent({
      previousState: snapshot.currentState,
      receivedInput: directionToEmergencyInput(direction),
      nextState: snapshot.currentState,
      transitionRule: `δ(${snapshot.currentState}, ${directionToEmergencyInput(direction)}) = ${snapshot.currentState} [FIFO Queued]`,
      reason: `Active emergency in progress (${snapshot.activeEmergencyDirection || snapshot.pendingEmergencyDirection}). ${direction} request placed in deterministic FIFO queue at position #${snapshot.emergencyQueue.length}.`,
      category: 'EMERGENCY',
      accepted: true,
      signals: snapshot.signals,
    });

    return res.json({
      accepted: true,
      queued: true,
      message: `Active emergency in progress. ${direction} queued deterministically (FIFO #${snapshot.emergencyQueue.length}).`,
      snapshot,
      event,
    });
  }

  // Start emergency pipeline via first DFA step
  const input = directionToEmergencyInput(direction);
  const result = evaluateDfaTransition(snapshot.currentState, input);

  snapshot.previousState = result.previousState;
  snapshot.currentState = result.nextState;
  snapshot.lastInput = result.receivedInput;
  snapshot.lastTransitionRule = result.transitionRule;
  snapshot.lastReason = result.reason;
  snapshot.signals = result.signals;
  snapshot.pendingEmergencyDirection = direction;
  snapshot.stepCount += 1;
  syncAmbulancePhaseFromState(snapshot);

  saveSnapshot(snapshot);
  const event = recordEvent({
    previousState: result.previousState,
    receivedInput: result.receivedInput,
    nextState: result.nextState,
    transitionRule: result.transitionRule,
    reason: result.reason,
    category: 'EMERGENCY',
    accepted: true,
    signals: result.signals,
  });

  res.json({
    accepted: true,
    queued: false,
    message: `Verified emergency accepted for ${direction}. DFA stepped to ${result.nextState}.`,
    result,
    snapshot,
    event,
  });
});

app.post('/api/emergency/clear', (_req, res) => {
  const snapshot = getSnapshot();
  const result = evaluateDfaTransition(snapshot.currentState, 'EMERGENCY_CLEARED');

  snapshot.previousState = result.previousState;
  snapshot.currentState = result.nextState;
  snapshot.lastInput = 'EMERGENCY_CLEARED';
  snapshot.lastTransitionRule = result.transitionRule;
  snapshot.lastReason = result.reason;
  snapshot.signals = result.signals;
  snapshot.activeEmergencyDirection = null;
  snapshot.pendingEmergencyDirection = null;
  snapshot.ambulancePhase = result.nextState === 'EMERGENCY_RECOVERY' ? 'CLEARED' : 'IDLE';
  snapshot.stepCount += 1;

  saveSnapshot(snapshot);
  const event = recordEvent({
    previousState: result.previousState,
    receivedInput: 'EMERGENCY_CLEARED',
    nextState: result.nextState,
    transitionRule: result.transitionRule,
    reason: result.reason,
    category: 'EMERGENCY',
    accepted: true,
    signals: result.signals,
  });

  res.json({ accepted: true, result, snapshot, event });
});

app.post('/api/simulation/control', (req, res) => {
  const running = Boolean(req.body?.running);
  const snapshot = getSnapshot();
  if (running && snapshot.currentState === 'SYSTEM_FAULT') {
    return res.status(409).json({
      message: 'Cannot start simulation while in SYSTEM_FAULT. Please RESET first.',
      snapshot,
    });
  }
  snapshot.simulationRunning = running;
  saveSnapshot(snapshot);
  res.json({ snapshot });
});

app.post('/api/simulation/tick', (_req, res) => {
  const snapshot = getSnapshot();

  if (snapshot.currentState === 'SYSTEM_FAULT') {
    return res.json({ ticked: false, snapshot });
  }

  let inputToApply: DfaInput = 'TIMER';

  if (snapshot.pendingEmergencyDirection) {
    inputToApply = directionToEmergencyInput(snapshot.pendingEmergencyDirection);
  } else if (
    snapshot.currentState === 'EMERGENCY_RECOVERY' &&
    snapshot.emergencyQueue.length > 0
  ) {
    const nextDir = snapshot.emergencyQueue.shift()!;
    snapshot.pendingEmergencyDirection = nextDir;
    inputToApply = directionToEmergencyInput(nextDir);
  }

  const result = evaluateDfaTransition(snapshot.currentState, inputToApply);

  snapshot.previousState = result.previousState;
  snapshot.currentState = result.nextState;
  snapshot.lastInput = result.receivedInput;
  snapshot.lastTransitionRule = result.transitionRule;
  snapshot.lastReason = result.reason;
  snapshot.signals = result.signals;
  snapshot.stepCount += 1;
  syncAmbulancePhaseFromState(snapshot);

  saveSnapshot(snapshot);
  const event = recordEvent({
    previousState: result.previousState,
    receivedInput: result.receivedInput,
    nextState: result.nextState,
    transitionRule: result.transitionRule,
    reason: result.reason,
    category: deriveCategory(result.receivedInput, true),
    accepted: true,
    signals: result.signals,
  });

  res.json({ ticked: true, result, snapshot, event });
});

app.get('/api/history', (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category : 'ALL';
  const limit = Number(req.query.limit || 200);
  res.json({ events: listEvents(Math.min(Math.max(limit, 1), 500), category) });
});

app.delete('/api/history', (_req, res) => {
  clearEvents();
  res.json({ cleared: true });
});

async function startServer() {
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve('dist/index.html'));

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DFA Traffic Control server listening on http://localhost:${PORT}`);
  });
}

startServer();
