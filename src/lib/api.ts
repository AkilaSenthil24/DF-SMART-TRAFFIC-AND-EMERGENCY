import type {
  AmbulanceCredential,
  DfaDefinition,
  Direction,
  LiveSystemSnapshot,
  TransitionEventRecord,
  VerificationSession,
} from '../shared/dfaTypes.ts';

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.message || `Request failed (${res.status})`) as Error & {
      data?: unknown;
      status?: number;
    };
    err.data = data;
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export interface InvariantReport {
  allPairsDefined: boolean;
  totalDefinedPairs: number;
  expectedPairs: number;
  zeroConflictingGreens: boolean;
  conflictingStates: string[];
  yellowSafetyEnforced: boolean;
  yellowViolations: string[];
  faultIsolationVerified: boolean;
}

export const api = {
  getDefinition: () => requestJson<DfaDefinition>('/api/dfa/definition'),
  verifyInvariants: () => requestJson<InvariantReport>('/api/dfa/verify-invariants'),
  getState: () => requestJson<LiveSystemSnapshot>('/api/dfa/state'),
  stepDfa: (input: string) =>
    requestJson<{
      accepted: boolean;
      result: {
        valid: boolean;
        previousState: string;
        receivedInput: string;
        nextState: string;
        transitionRule: string;
        reason: string;
        safetyNote: string;
      };
      snapshot: LiveSystemSnapshot;
      event: TransitionEventRecord;
    }>('/api/dfa/step', {
      method: 'POST',
      body: JSON.stringify({ input }),
    }),
  resetDfa: () =>
    requestJson<{ snapshot: LiveSystemSnapshot; event: TransitionEventRecord }>('/api/dfa/reset', {
      method: 'POST',
    }),
  controlSimulation: (running: boolean) =>
    requestJson<{ snapshot: LiveSystemSnapshot }>('/api/simulation/control', {
      method: 'POST',
      body: JSON.stringify({ running }),
    }),
  tickSimulation: () =>
    requestJson<{ ticked: boolean; snapshot: LiveSystemSnapshot; event?: TransitionEventRecord }>(
      '/api/simulation/tick',
      { method: 'POST' },
    ),
  getAmbulances: () => requestJson<{ ambulances: AmbulanceCredential[] }>('/api/ambulances'),
  verifyEmergency: (payload: { driverName: string; driverId: string; vehicleId: string }) =>
    requestJson<{
      verified: boolean;
      message: string;
      verification: VerificationSession;
      snapshot: LiveSystemSnapshot;
      event: TransitionEventRecord;
    }>('/api/emergency/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  logoutVerification: () =>
    requestJson<{ snapshot: LiveSystemSnapshot }>('/api/emergency/logout', { method: 'POST' }),
  requestEmergency: (direction: Direction) =>
    requestJson<{
      accepted: boolean;
      queued: boolean;
      message: string;
      snapshot: LiveSystemSnapshot;
      event?: TransitionEventRecord;
    }>('/api/emergency/request', {
      method: 'POST',
      body: JSON.stringify({ direction }),
    }),
  clearEmergency: () =>
    requestJson<{ accepted: boolean; snapshot: LiveSystemSnapshot; event: TransitionEventRecord }>(
      '/api/emergency/clear',
      { method: 'POST' },
    ),
  getHistory: (category = 'ALL', limit = 200) =>
    requestJson<{ events: TransitionEventRecord[] }>(
      `/api/history?category=${encodeURIComponent(category)}&limit=${limit}`,
    ),
  clearHistory: () => requestJson<{ cleared: boolean }>('/api/history', { method: 'DELETE' }),
};
