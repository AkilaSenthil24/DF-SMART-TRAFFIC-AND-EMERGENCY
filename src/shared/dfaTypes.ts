export type Direction = 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';

export type SignalColor = 'RED' | 'YELLOW' | 'GREEN' | 'EMERGENCY_GREEN';

export type StateGroup = 'NORMAL' | 'INTER_GREEN' | 'EMERGENCY' | 'FAULT';

export type DfaState =
  | 'ALL_RED'
  | 'NORTH_GREEN'
  | 'NORTH_YELLOW'
  | 'ALL_RED_E'
  | 'EAST_GREEN'
  | 'EAST_YELLOW'
  | 'ALL_RED_S'
  | 'SOUTH_GREEN'
  | 'SOUTH_YELLOW'
  | 'ALL_RED_W'
  | 'WEST_GREEN'
  | 'WEST_YELLOW'
  | 'EMERGENCY_PREPARATION'
  | 'EMERGENCY_NORTH_GREEN'
  | 'EMERGENCY_EAST_GREEN'
  | 'EMERGENCY_SOUTH_GREEN'
  | 'EMERGENCY_WEST_GREEN'
  | 'EMERGENCY_RECOVERY'
  | 'SYSTEM_FAULT';

export type DfaInput =
  | 'TIMER'
  | 'EMERGENCY_NORTH'
  | 'EMERGENCY_EAST'
  | 'EMERGENCY_SOUTH'
  | 'EMERGENCY_WEST'
  | 'EMERGENCY_CLEARED'
  | 'RESET'
  | 'FAULT';

export interface SignalTuple {
  NORTH: SignalColor;
  EAST: SignalColor;
  SOUTH: SignalColor;
  WEST: SignalColor;
}

export interface StateMetadata {
  id: DfaState;
  label: string;
  group: StateGroup;
  signals: SignalTuple;
  isInitial: boolean;
  isAccepting: boolean;
  description: string;
}

export interface TransitionRule {
  from: DfaState;
  input: DfaInput;
  to: DfaState;
  reason: string;
  safetyNote: string;
}

export interface DfaDefinition {
  formalName: string;
  tupleSummary: {
    Q_count: number;
    Sigma_count: number;
    delta_count: number;
    q0: DfaState;
    F: DfaState[];
    acceptingJustification: string;
  };
  states: StateMetadata[];
  alphabet: {
    input: DfaInput;
    label: string;
    description: string;
  }[];
  transitionTable: Record<DfaState, Record<DfaInput, TransitionRule>>;
  normalSequence: DfaState[];
}

export interface TransitionEventRecord {
  id: number;
  timestamp: string;
  previousState: DfaState;
  receivedInput: string;
  nextState: DfaState;
  transitionRule: string;
  reason: string;
  category: 'NORMAL' | 'EMERGENCY' | 'VERIFICATION' | 'INVALID' | 'FAULT' | 'RESET';
  accepted: boolean;
  signals: SignalTuple;
}

export interface AmbulanceCredential {
  id: number;
  driverName: string;
  driverId: string;
  vehicleId: string;
  vehicleType: string;
  organization: string;
  accountStatus: 'Authorized' | 'Suspended' | 'Revoked';
}

export interface VerificationSession {
  verified: boolean;
  token: string | null;
  driverName: string | null;
  driverId: string | null;
  vehicleId: string | null;
  organization: string | null;
  verifiedAt: string | null;
}

export interface LiveSystemSnapshot {
  currentState: DfaState;
  previousState: DfaState | null;
  lastInput: string | null;
  lastTransitionRule: string | null;
  lastReason: string;
  signals: SignalTuple;
  simulationRunning: boolean;
  activeEmergencyDirection: Direction | null;
  pendingEmergencyDirection: Direction | null;
  emergencyQueue: Direction[];
  ambulancePhase: 'IDLE' | 'APPROACHING' | 'WAITING_AT_RED' | 'CROSSING' | 'CLEARED';
  stepCount: number;
  verification: VerificationSession;
}
