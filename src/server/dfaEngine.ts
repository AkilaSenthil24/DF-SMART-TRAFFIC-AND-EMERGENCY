import type {
  DfaDefinition,
  DfaInput,
  DfaState,
  Direction,
  SignalTuple,
  StateMetadata,
  TransitionRule,
} from '../shared/dfaTypes.ts';

export const DFA_INITIAL_STATE: DfaState = 'ALL_RED';
export const DFA_ACCEPTING_STATES: DfaState[] = ['ALL_RED'];

export const DFA_ALPHABET: DfaDefinition['alphabet'] = [
  {
    input: 'TIMER',
    label: 'Timer Tick',
    description: 'Normal phase duration elapsed; advances the deterministic traffic signal sequence.',
  },
  {
    input: 'EMERGENCY_NORTH',
    label: 'Emergency (North)',
    description: 'Verified ambulance approaching from the North corridor.',
  },
  {
    input: 'EMERGENCY_EAST',
    label: 'Emergency (East)',
    description: 'Verified ambulance approaching from the East corridor.',
  },
  {
    input: 'EMERGENCY_SOUTH',
    label: 'Emergency (South)',
    description: 'Verified ambulance approaching from the South corridor.',
  },
  {
    input: 'EMERGENCY_WEST',
    label: 'Emergency (West)',
    description: 'Verified ambulance approaching from the West corridor.',
  },
  {
    input: 'EMERGENCY_CLEARED',
    label: 'Emergency Cleared',
    description: 'Ambulance has safely exited the intersection; triggers safe recovery.',
  },
  {
    input: 'RESET',
    label: 'System Reset',
    description: 'Returns the DFA deterministically to initial safe state ALL_RED (q0).',
  },
  {
    input: 'FAULT',
    label: 'Hardware / Sensor Fault',
    description: 'Moves the controller into fail-safe SYSTEM_FAULT (all signals RED) until RESET.',
  },
];

export const DFA_STATES: StateMetadata[] = [
  {
    id: 'ALL_RED',
    label: 'All Red (Cycle Start)',
    group: 'INTER_GREEN',
    signals: { NORTH: 'RED', EAST: 'RED', SOUTH: 'RED', WEST: 'RED' },
    isInitial: true,
    isAccepting: true,
    description:
      'Initial and accepting equilibrium state (q0 ∈ F). All lanes hold RED before North Green or Emergency Preparation.',
  },
  {
    id: 'NORTH_GREEN',
    label: 'North Green',
    group: 'NORMAL',
    signals: { NORTH: 'GREEN', EAST: 'RED', SOUTH: 'RED', WEST: 'RED' },
    isInitial: false,
    isAccepting: false,
    description: 'Northbound lane is GREEN; East, South, and West remain strictly RED.',
  },
  {
    id: 'NORTH_YELLOW',
    label: 'North Yellow',
    group: 'NORMAL',
    signals: { NORTH: 'YELLOW', EAST: 'RED', SOUTH: 'RED', WEST: 'RED' },
    isInitial: false,
    isAccepting: false,
    description: 'Mandatory clearance warning on North before entering All-Red synchronization.',
  },
  {
    id: 'ALL_RED_E',
    label: 'All Red (Pre-East)',
    group: 'INTER_GREEN',
    signals: { NORTH: 'RED', EAST: 'RED', SOUTH: 'RED', WEST: 'RED' },
    isInitial: false,
    isAccepting: false,
    description:
      'Inter-green All-Red buffer encoding next normal phase (East), eliminating hidden counters from the DFA.',
  },
  {
    id: 'EAST_GREEN',
    label: 'East Green',
    group: 'NORMAL',
    signals: { NORTH: 'RED', EAST: 'GREEN', SOUTH: 'RED', WEST: 'RED' },
    isInitial: false,
    isAccepting: false,
    description: 'Eastbound lane is GREEN; North, South, and West remain strictly RED.',
  },
  {
    id: 'EAST_YELLOW',
    label: 'East Yellow',
    group: 'NORMAL',
    signals: { NORTH: 'RED', EAST: 'YELLOW', SOUTH: 'RED', WEST: 'RED' },
    isInitial: false,
    isAccepting: false,
    description: 'Mandatory clearance warning on East before entering All-Red synchronization.',
  },
  {
    id: 'ALL_RED_S',
    label: 'All Red (Pre-South)',
    group: 'INTER_GREEN',
    signals: { NORTH: 'RED', EAST: 'RED', SOUTH: 'RED', WEST: 'RED' },
    isInitial: false,
    isAccepting: false,
    description: 'Inter-green All-Red buffer encoding next normal phase (South).',
  },
  {
    id: 'SOUTH_GREEN',
    label: 'South Green',
    group: 'NORMAL',
    signals: { NORTH: 'RED', EAST: 'RED', SOUTH: 'GREEN', WEST: 'RED' },
    isInitial: false,
    isAccepting: false,
    description: 'Southbound lane is GREEN; North, East, and West remain strictly RED.',
  },
  {
    id: 'SOUTH_YELLOW',
    label: 'South Yellow',
    group: 'NORMAL',
    signals: { NORTH: 'RED', EAST: 'RED', SOUTH: 'YELLOW', WEST: 'RED' },
    isInitial: false,
    isAccepting: false,
    description: 'Mandatory clearance warning on South before entering All-Red synchronization.',
  },
  {
    id: 'ALL_RED_W',
    label: 'All Red (Pre-West)',
    group: 'INTER_GREEN',
    signals: { NORTH: 'RED', EAST: 'RED', SOUTH: 'RED', WEST: 'RED' },
    isInitial: false,
    isAccepting: false,
    description: 'Inter-green All-Red buffer encoding next normal phase (West).',
  },
  {
    id: 'WEST_GREEN',
    label: 'West Green',
    group: 'NORMAL',
    signals: { NORTH: 'RED', EAST: 'RED', SOUTH: 'RED', WEST: 'GREEN' },
    isInitial: false,
    isAccepting: false,
    description: 'Westbound lane is GREEN; North, East, and South remain strictly RED.',
  },
  {
    id: 'WEST_YELLOW',
    label: 'West Yellow',
    group: 'NORMAL',
    signals: { NORTH: 'RED', EAST: 'RED', SOUTH: 'RED', WEST: 'YELLOW' },
    isInitial: false,
    isAccepting: false,
    description: 'Mandatory clearance warning on West before completing cycle back to ALL_RED (q0).',
  },
  {
    id: 'EMERGENCY_PREPARATION',
    label: 'Emergency Preparation',
    group: 'EMERGENCY',
    signals: { NORTH: 'RED', EAST: 'RED', SOUTH: 'RED', WEST: 'RED' },
    isInitial: false,
    isAccepting: false,
    description: 'All lanes locked RED while intersection clears and prepares the emergency corridor.',
  },
  {
    id: 'EMERGENCY_NORTH_GREEN',
    label: 'Emergency North Green',
    group: 'EMERGENCY',
    signals: { NORTH: 'EMERGENCY_GREEN', EAST: 'RED', SOUTH: 'RED', WEST: 'RED' },
    isInitial: false,
    isAccepting: false,
    description: 'Dedicated Emergency Green for Northbound ambulance; all conflicting roads locked RED.',
  },
  {
    id: 'EMERGENCY_EAST_GREEN',
    label: 'Emergency East Green',
    group: 'EMERGENCY',
    signals: { NORTH: 'RED', EAST: 'EMERGENCY_GREEN', SOUTH: 'RED', WEST: 'RED' },
    isInitial: false,
    isAccepting: false,
    description: 'Dedicated Emergency Green for Eastbound ambulance; all conflicting roads locked RED.',
  },
  {
    id: 'EMERGENCY_SOUTH_GREEN',
    label: 'Emergency South Green',
    group: 'EMERGENCY',
    signals: { NORTH: 'RED', EAST: 'RED', SOUTH: 'EMERGENCY_GREEN', WEST: 'RED' },
    isInitial: false,
    isAccepting: false,
    description: 'Dedicated Emergency Green for Southbound ambulance; all conflicting roads locked RED.',
  },
  {
    id: 'EMERGENCY_WEST_GREEN',
    label: 'Emergency West Green',
    group: 'EMERGENCY',
    signals: { NORTH: 'RED', EAST: 'RED', SOUTH: 'RED', WEST: 'EMERGENCY_GREEN' },
    isInitial: false,
    isAccepting: false,
    description: 'Dedicated Emergency Green for Westbound ambulance; all conflicting roads locked RED.',
  },
  {
    id: 'EMERGENCY_RECOVERY',
    label: 'Emergency Recovery',
    group: 'EMERGENCY',
    signals: { NORTH: 'RED', EAST: 'RED', SOUTH: 'RED', WEST: 'RED' },
    isInitial: false,
    isAccepting: false,
    description: 'Post-clearance All-Red buffer before resuming normal traffic or dispatching queued emergency.',
  },
  {
    id: 'SYSTEM_FAULT',
    label: 'System Fault (Fail-Safe Red)',
    group: 'FAULT',
    signals: { NORTH: 'RED', EAST: 'RED', SOUTH: 'RED', WEST: 'RED' },
    isInitial: false,
    isAccepting: false,
    description: 'Fail-safe error state. All signals locked RED; requires explicit RESET to resume.',
  },
];

export const STATE_METADATA_MAP: Record<DfaState, StateMetadata> = DFA_STATES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<DfaState, StateMetadata>,
);

const EMERGENCY_INPUTS: DfaInput[] = [
  'EMERGENCY_NORTH',
  'EMERGENCY_EAST',
  'EMERGENCY_SOUTH',
  'EMERGENCY_WEST',
];

const EMERGENCY_TARGET_BY_INPUT: Record<string, DfaState> = {
  EMERGENCY_NORTH: 'EMERGENCY_NORTH_GREEN',
  EMERGENCY_EAST: 'EMERGENCY_EAST_GREEN',
  EMERGENCY_SOUTH: 'EMERGENCY_SOUTH_GREEN',
  EMERGENCY_WEST: 'EMERGENCY_WEST_GREEN',
};

const NORMAL_CYCLE_NEXT: Record<string, { to: DfaState; reason: string; safetyNote: string }> = {
  ALL_RED: {
    to: 'NORTH_GREEN',
    reason: 'Timer tick starts Northbound green phase from initial ALL_RED.',
    safetyNote: 'E/S/W remain RED before North opens.',
  },
  NORTH_GREEN: {
    to: 'NORTH_YELLOW',
    reason: 'North green interval elapsed; transitioning to mandatory North yellow clearance.',
    safetyNote: 'Never switch directly from Green to another Green.',
  },
  NORTH_YELLOW: {
    to: 'ALL_RED_E',
    reason: 'North yellow clearance finished; entering All-Red buffer before East.',
    safetyNote: 'All four roads held RED to clear lingering vehicles.',
  },
  ALL_RED_E: {
    to: 'EAST_GREEN',
    reason: 'All-Red safety buffer complete; granting green to Eastbound traffic.',
    safetyNote: 'N/S/W strictly locked RED.',
  },
  EAST_GREEN: {
    to: 'EAST_YELLOW',
    reason: 'East green interval elapsed; transitioning to mandatory East yellow clearance.',
    safetyNote: 'Yellow warning prevents abrupt stop.',
  },
  EAST_YELLOW: {
    to: 'ALL_RED_S',
    reason: 'East yellow clearance finished; entering All-Red buffer before South.',
    safetyNote: 'All four roads held RED for safe phase swap.',
  },
  ALL_RED_S: {
    to: 'SOUTH_GREEN',
    reason: 'All-Red safety buffer complete; granting green to Southbound traffic.',
    safetyNote: 'N/E/W strictly locked RED.',
  },
  SOUTH_GREEN: {
    to: 'SOUTH_YELLOW',
    reason: 'South green interval elapsed; transitioning to mandatory South yellow clearance.',
    safetyNote: 'Yellow clearance required before All-Red.',
  },
  SOUTH_YELLOW: {
    to: 'ALL_RED_W',
    reason: 'South yellow clearance finished; entering All-Red buffer before West.',
    safetyNote: 'All four roads held RED before West opens.',
  },
  ALL_RED_W: {
    to: 'WEST_GREEN',
    reason: 'All-Red safety buffer complete; granting green to Westbound traffic.',
    safetyNote: 'N/E/S strictly locked RED.',
  },
  WEST_GREEN: {
    to: 'WEST_YELLOW',
    reason: 'West green interval elapsed; transitioning to mandatory West yellow clearance.',
    safetyNote: 'Yellow clearance required before All-Red.',
  },
  WEST_YELLOW: {
    to: 'ALL_RED',
    reason: 'West yellow clearance finished; full cycle returns to accepting state ALL_RED (q0).',
    safetyNote: 'Safe equilibrium state reached.',
  },
};

function buildTransitionTable(): Record<DfaState, Record<DfaInput, TransitionRule>> {
  const table = {} as Record<DfaState, Record<DfaInput, TransitionRule>>;

  for (const stateMeta of DFA_STATES) {
    const q = stateMeta.id;
    const row = {} as Record<DfaInput, TransitionRule>;

    for (const { input } of DFA_ALPHABET) {
      // Universal RESET and FAULT rules
      if (input === 'RESET') {
        row[input] = {
          from: q,
          input,
          to: 'ALL_RED',
          reason: 'Authorized RESET returns controller deterministically to initial state ALL_RED.',
          safetyNote: 'All signals set RED; emergency locks cleared.',
        };
        continue;
      }

      if (input === 'FAULT') {
        row[input] = {
          from: q,
          input,
          to: 'SYSTEM_FAULT',
          reason: 'Hardware or sensor fault detected; entering fail-safe SYSTEM_FAULT.',
          safetyNote: 'All directions forced RED until explicit RESET.',
        };
        continue;
      }

      // SYSTEM_FAULT state locks everything except RESET (handled above)
      if (q === 'SYSTEM_FAULT') {
        row[input] = {
          from: q,
          input,
          to: 'SYSTEM_FAULT',
          reason: `Controller is in SYSTEM_FAULT; input ${input} ignored until RESET.`,
          safetyNote: 'Fail-safe red lock prevents unsafe transitions.',
        };
        continue;
      }

      // Normal Green states: NORTH_GREEN, EAST_GREEN, SOUTH_GREEN, WEST_GREEN
      if (q === 'NORTH_GREEN' || q === 'EAST_GREEN' || q === 'SOUTH_GREEN' || q === 'WEST_GREEN') {
        const yellowState = q.replace('_GREEN', '_YELLOW') as DfaState;
        if (input === 'TIMER') {
          const normalNext = NORMAL_CYCLE_NEXT[q];
          row[input] = { from: q, input, ...normalNext };
        } else if (EMERGENCY_INPUTS.includes(input)) {
          row[input] = {
            from: q,
            input,
            to: yellowState,
            reason: `Emergency input ${input} received during ${q}; stepping first to ${yellowState} for safe clearance.`,
            safetyNote: 'Conflicting green cannot drop instantly; yellow phase is mandatory.',
          };
        } else {
          // EMERGENCY_CLEARED while not in emergency -> self-loop
          row[input] = {
            from: q,
            input,
            to: q,
            reason: `Input ${input} is inactive during normal state ${q}; state unchanged.`,
            safetyNote: 'No-op self-loop preserves deterministic total function.',
          };
        }
        continue;
      }

      // Normal Yellow states: NORTH_YELLOW, EAST_YELLOW, SOUTH_YELLOW, WEST_YELLOW
      if (
        q === 'NORTH_YELLOW' ||
        q === 'EAST_YELLOW' ||
        q === 'SOUTH_YELLOW' ||
        q === 'WEST_YELLOW'
      ) {
        const normalNext = NORMAL_CYCLE_NEXT[q];
        if (input === 'TIMER') {
          row[input] = { from: q, input, ...normalNext };
        } else if (EMERGENCY_INPUTS.includes(input)) {
          row[input] = {
            from: q,
            input,
            to: normalNext.to,
            reason: `Completing ${q} clearance to ${normalNext.to} before preparing emergency corridor.`,
            safetyNote: 'All signals must reach ALL_RED before EMERGENCY_PREPARATION.',
          };
        } else {
          row[input] = {
            from: q,
            input,
            to: q,
            reason: `Input ${input} ignored while clearing ${q}; state unchanged.`,
            safetyNote: 'Yellow clearance cannot be skipped.',
          };
        }
        continue;
      }

      // Inter-green All-Red states: ALL_RED, ALL_RED_E, ALL_RED_S, ALL_RED_W
      if (q === 'ALL_RED' || q === 'ALL_RED_E' || q === 'ALL_RED_S' || q === 'ALL_RED_W') {
        if (input === 'TIMER') {
          const normalNext = NORMAL_CYCLE_NEXT[q];
          row[input] = { from: q, input, ...normalNext };
        } else if (EMERGENCY_INPUTS.includes(input)) {
          row[input] = {
            from: q,
            input,
            to: 'EMERGENCY_PREPARATION',
            reason: `All roads already RED in ${q}; entering EMERGENCY_PREPARATION for ${input}.`,
            safetyNote: 'Intersection safely locked prior to granting Emergency Green.',
          };
        } else {
          row[input] = {
            from: q,
            input,
            to: q,
            reason: `No active emergency in ${q}; ${input} leaves state unchanged.`,
            safetyNote: 'Deterministic self-loop maintains All-Red safety.',
          };
        }
        continue;
      }

      // EMERGENCY_PREPARATION
      if (q === 'EMERGENCY_PREPARATION') {
        if (EMERGENCY_INPUTS.includes(input)) {
          const targetGreen = EMERGENCY_TARGET_BY_INPUT[input];
          row[input] = {
            from: q,
            input,
            to: targetGreen,
            reason: `Corridor verified and all conflicting roads RED; granting ${targetGreen}.`,
            safetyNote: 'Only the ambulance approach direction opens; other 3 roads locked RED.',
          };
        } else if (input === 'EMERGENCY_CLEARED') {
          row[input] = {
            from: q,
            input,
            to: 'EMERGENCY_RECOVERY',
            reason: 'Emergency cleared during preparation; moving to EMERGENCY_RECOVERY.',
            safetyNote: 'Safe recovery before returning to normal traffic.',
          };
        } else {
          // TIMER holds EMERGENCY_PREPARATION until emergency direction input confirms
          row[input] = {
            from: q,
            input,
            to: 'EMERGENCY_PREPARATION',
            reason: 'Holding EMERGENCY_PREPARATION All-Red lock until verified direction input is processed.',
            safetyNote: 'Prevents opening any conflicting normal green.',
          };
        }
        continue;
      }

      // Active EMERGENCY_<DIR>_GREEN states
      if (
        q === 'EMERGENCY_NORTH_GREEN' ||
        q === 'EMERGENCY_EAST_GREEN' ||
        q === 'EMERGENCY_SOUTH_GREEN' ||
        q === 'EMERGENCY_WEST_GREEN'
      ) {
        if (input === 'EMERGENCY_CLEARED') {
          row[input] = {
            from: q,
            input,
            to: 'EMERGENCY_RECOVERY',
            reason: `Ambulance exited intersection (${q}); transitioning to EMERGENCY_RECOVERY.`,
            safetyNote: 'All signals return to RED for post-emergency safety buffer.',
          };
        } else if (EMERGENCY_INPUTS.includes(input)) {
          row[input] = {
            from: q,
            input,
            to: q,
            reason: `Non-preemptive lock: ${q} remains active until EMERGENCY_CLEARED (incoming ${input} queued/deferred).`,
            safetyNote: 'Never interrupt or conflict with an active ambulance crossing.',
          };
        } else {
          row[input] = {
            from: q,
            input,
            to: q,
            reason: `TIMER ignored during active ${q}; emergency green stays open until EMERGENCY_CLEARED.`,
            safetyNote: 'Normal timer cannot cut off an emergency ambulance.',
          };
        }
        continue;
      }

      // EMERGENCY_RECOVERY
      if (q === 'EMERGENCY_RECOVERY') {
        if (input === 'TIMER' || input === 'EMERGENCY_CLEARED') {
          row[input] = {
            from: q,
            input,
            to: 'ALL_RED',
            reason: 'Recovery buffer complete; returning to ALL_RED (q0) to resume normal traffic cycle.',
            safetyNote: 'Normal cycle restarts deterministically from ALL_RED.',
          };
        } else if (EMERGENCY_INPUTS.includes(input)) {
          row[input] = {
            from: q,
            input,
            to: 'EMERGENCY_PREPARATION',
            reason: `Queued/new verified emergency ${input} entering EMERGENCY_PREPARATION directly from recovery.`,
            safetyNote: 'All lanes already RED; safe transition to next emergency corridor.',
          };
        }
      }
    }

    table[q] = row;
  }

  return table;
}

export const TRANSITION_TABLE = buildTransitionTable();

export const NORMAL_TRAFFIC_SEQUENCE: DfaState[] = [
  'ALL_RED',
  'NORTH_GREEN',
  'NORTH_YELLOW',
  'ALL_RED_E',
  'EAST_GREEN',
  'EAST_YELLOW',
  'ALL_RED_S',
  'SOUTH_GREEN',
  'SOUTH_YELLOW',
  'ALL_RED_W',
  'WEST_GREEN',
  'WEST_YELLOW',
  'ALL_RED',
];

export const DFA_DEFINITION: DfaDefinition = {
  formalName: 'Smart Traffic Signal & Emergency Corridor DFA',
  tupleSummary: {
    Q_count: DFA_STATES.length,
    Sigma_count: DFA_ALPHABET.length,
    delta_count: DFA_STATES.length * DFA_ALPHABET.length,
    q0: DFA_INITIAL_STATE,
    F: DFA_ACCEPTING_STATES,
    acceptingJustification:
      'In a continuous reactive controller, F = {ALL_RED} represents the safe equilibrium checkpoint reached upon completing a full 4-way normal cycle or recovering from an emergency, where zero vehicles have conflicting right-of-way.',
  },
  states: DFA_STATES,
  alphabet: DFA_ALPHABET,
  transitionTable: TRANSITION_TABLE,
  normalSequence: NORMAL_TRAFFIC_SEQUENCE,
};

export function isValidDfaInput(value: string): value is DfaInput {
  return DFA_ALPHABET.some((item) => item.input === value);
}

export function isValidDfaState(value: string): value is DfaState {
  return value in STATE_METADATA_MAP;
}

export function getSignalsForState(state: DfaState): SignalTuple {
  return STATE_METADATA_MAP[state].signals;
}

export function directionToEmergencyInput(dir: Direction): DfaInput {
  return `EMERGENCY_${dir}` as DfaInput;
}

export function emergencyStateToDirection(state: DfaState): Direction | null {
  switch (state) {
    case 'EMERGENCY_NORTH_GREEN':
      return 'NORTH';
    case 'EMERGENCY_EAST_GREEN':
      return 'EAST';
    case 'EMERGENCY_SOUTH_GREEN':
      return 'SOUTH';
    case 'EMERGENCY_WEST_GREEN':
      return 'WEST';
    default:
      return null;
  }
}

export interface StepResult {
  valid: boolean;
  previousState: DfaState;
  receivedInput: string;
  nextState: DfaState;
  transitionRule: string;
  reason: string;
  safetyNote: string;
  signals: SignalTuple;
}

export function evaluateDfaTransition(currentState: DfaState, rawInput: string): StepResult {
  const normalized = rawInput.trim().toUpperCase();
  if (!isValidDfaInput(normalized)) {
    return {
      valid: false,
      previousState: currentState,
      receivedInput: rawInput,
      nextState: currentState,
      transitionRule: `δ(${currentState}, "${rawInput}") = REJECTED (∉ Σ)`,
      reason: `Rejected invalid input "${rawInput}" because it does not belong to the DFA input alphabet Σ. State remains ${currentState}.`,
      safetyNote: 'Invalid or unrecognized inputs never alter traffic signals.',
      signals: getSignalsForState(currentState),
    };
  }

  const rule = TRANSITION_TABLE[currentState][normalized];
  return {
    valid: true,
    previousState: currentState,
    receivedInput: normalized,
    nextState: rule.to,
    transitionRule: `δ(${currentState}, ${normalized}) = ${rule.to}`,
    reason: rule.reason,
    safetyNote: rule.safetyNote,
    signals: getSignalsForState(rule.to),
  };
}

export interface InvariantReport {
  allPairsDefined: boolean;
  totalDefinedPairs: number;
  expectedPairs: number;
  zeroConflictingGreens: boolean;
  conflictingStates: DfaState[];
  yellowSafetyEnforced: boolean;
  yellowViolations: string[];
  faultIsolationVerified: boolean;
}

export function verifyDfaInvariants(): InvariantReport {
  let totalDefinedPairs = 0;
  for (const state of DFA_STATES) {
    for (const alpha of DFA_ALPHABET) {
      if (TRANSITION_TABLE[state.id]?.[alpha.input]?.to) {
        totalDefinedPairs += 1;
      }
    }
  }

  const conflictingStates: DfaState[] = [];
  for (const state of DFA_STATES) {
    const activeNonRed = Object.values(state.signals).filter((c) => c !== 'RED').length;
    if (activeNonRed > 1) {
      conflictingStates.push(state.id);
    }
  }

  const yellowViolations: string[] = [];
  const greenStates: DfaState[] = ['NORTH_GREEN', 'EAST_GREEN', 'SOUTH_GREEN', 'WEST_GREEN'];
  for (const g of greenStates) {
    const expectedYellow = g.replace('_GREEN', '_YELLOW') as DfaState;
    for (const alpha of DFA_ALPHABET) {
      if (alpha.input === 'RESET' || alpha.input === 'FAULT') continue;
      const to = TRANSITION_TABLE[g][alpha.input].to;
      if (to !== g && to !== expectedYellow) {
        yellowViolations.push(`δ(${g}, ${alpha.input}) -> ${to} skipped ${expectedYellow}`);
      }
    }
  }

  const faultRow = TRANSITION_TABLE.SYSTEM_FAULT;
  const faultIsolationVerified = DFA_ALPHABET.every(({ input }) =>
    input === 'RESET' ? faultRow[input].to === 'ALL_RED' : faultRow[input].to === 'SYSTEM_FAULT',
  );

  return {
    allPairsDefined: totalDefinedPairs === DFA_STATES.length * DFA_ALPHABET.length,
    totalDefinedPairs,
    expectedPairs: DFA_STATES.length * DFA_ALPHABET.length,
    zeroConflictingGreens: conflictingStates.length === 0,
    conflictingStates,
    yellowSafetyEnforced: yellowViolations.length === 0,
    yellowViolations,
    faultIsolationVerified,
  };
}
