import { useCallback, useEffect, useRef, useState } from 'react';
import type { Direction, LiveSystemSnapshot } from '../shared/dfaTypes.ts';
import { api } from '../lib/api.ts';
import { IntersectionSimulation } from '../components/IntersectionSimulation.tsx';
import { FourWaySignalGrid } from '../components/SignalBadge.tsx';
import type { PageId } from './HomeDashboard.tsx';
import {
  AlertTriangle,
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Siren,
} from 'lucide-react';

interface LiveSimulationPageProps {
  snapshot: LiveSystemSnapshot;
  onStateChange: (snapshot: LiveSystemSnapshot) => void;
  onRefreshHistory: () => void;
  onNavigate: (page: PageId) => void;
}

const DIRECTIONS: Direction[] = ['NORTH', 'EAST', 'SOUTH', 'WEST'];

export function LiveSimulationPage({
  snapshot,
  onStateChange,
  onRefreshHistory,
  onNavigate,
}: LiveSimulationPageProps) {
  const [selectedDirection, setSelectedDirection] = useState<Direction>('EAST');
  const [tickMs, setTickMs] = useState<number>(1500);
  const [autoClearAfterCross, setAutoClearAfterCross] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'info' | 'error' | 'success';
    text: string;
  } | null>(null);

  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  const runTick = useCallback(async () => {
    try {
      const res = await api.tickSimulation();
      onStateChange(res.snapshot);
      onRefreshHistory();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Simulation tick error.',
      });
    }
  }, [onStateChange, onRefreshHistory]);

  // Automatic backend DFA tick loop when simulationRunning OR pending emergency clearance steps
  useEffect(() => {
    const needsEmergencySteps = Boolean(snapshot.pendingEmergencyDirection);
    const needsRecoveryStep =
      snapshot.currentState === 'EMERGENCY_RECOVERY' && snapshot.simulationRunning;

    if (!snapshot.simulationRunning && !needsEmergencySteps && !needsRecoveryStep) {
      return;
    }

    // Hold still during active EMERGENCY_<DIR>_GREEN until user clicks Clear Emergency
    if (snapshot.activeEmergencyDirection && !needsEmergencySteps) {
      return;
    }

    const delay = needsEmergencySteps ? Math.min(tickMs, 1100) : tickMs;
    const id = window.setInterval(() => {
      runTick();
    }, delay);

    return () => window.clearInterval(id);
  }, [
    snapshot.simulationRunning,
    snapshot.pendingEmergencyDirection,
    snapshot.activeEmergencyDirection,
    snapshot.currentState,
    tickMs,
    runTick,
  ]);

  const handleStartOrResume = async () => {
    try {
      const res = await api.controlSimulation(true);
      onStateChange(res.snapshot);
      setStatusMessage({
        type: 'info',
        text: 'Normal traffic simulation running. Backend DFA processes TIMER inputs sequentially.',
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to start simulation.',
      });
    }
  };

  const handlePause = async () => {
    const res = await api.controlSimulation(false);
    onStateChange(res.snapshot);
    setStatusMessage({ type: 'info', text: 'Simulation paused. Current DFA state held safely.' });
  };

  const handleReset = async () => {
    const res = await api.resetDfa();
    onStateChange(res.snapshot);
    onRefreshHistory();
    setStatusMessage({
      type: 'info',
      text: 'Simulation reset to initial DFA state ALL_RED (q0).',
    });
  };

  const handleTriggerEmergency = async () => {
    try {
      const res = await api.requestEmergency(selectedDirection);
      onStateChange(res.snapshot);
      onRefreshHistory();
      setStatusMessage({
        type: 'success',
        text: res.message,
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Emergency request rejected.',
      });
    }
  };

  const handleClearEmergency = useCallback(async () => {
    try {
      const res = await api.clearEmergency();
      onStateChange(res.snapshot);
      onRefreshHistory();
      setStatusMessage({
        type: 'info',
        text: 'Emergency cleared. DFA moved to EMERGENCY_RECOVERY and will safely resume normal traffic.',
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to clear emergency.',
      });
    }
  }, [onStateChange, onRefreshHistory]);

  const handleAmbulanceCrossed = useCallback(() => {
    if (autoClearAfterCross && snapshotRef.current.activeEmergencyDirection) {
      handleClearEmergency();
    } else {
      setStatusMessage({
        type: 'success',
        text: 'Ambulance has crossed the intersection! Click "Emergency Cleared" to enter EMERGENCY_RECOVERY.',
      });
    }
  }, [autoClearAfterCross, handleClearEmergency]);

  const handleQuickFault = async () => {
    const res = await api.stepDfa('FAULT');
    onStateChange(res.snapshot);
    onRefreshHistory();
    setStatusMessage({
      type: 'error',
      text: 'FAULT triggered! All signals locked RED in SYSTEM_FAULT until RESET.',
    });
  };

  const visibleAmbulanceDirection =
    snapshot.activeEmergencyDirection || snapshot.pendingEmergencyDirection || null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
        {/* Left/Main Interactive Stage (7 cols) */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Four-Way Intersection · Live DFA Signal Simulation
              </h2>
              <p className="text-xs text-slate-500">
                Vehicles and the emergency ambulance obey only the backend DFA state output.
              </p>
            </div>
            <div className="font-mono text-xs font-semibold text-slate-700">
              {snapshot.simulationRunning ? 'RUNNING' : 'PAUSED'} · Step #{snapshot.stepCount}
            </div>
          </div>

          <IntersectionSimulation
            currentState={snapshot.currentState}
            signals={snapshot.signals}
            simulationRunning={snapshot.simulationRunning}
            ambulanceDirection={visibleAmbulanceDirection}
            ambulancePhase={snapshot.ambulancePhase}
            onAmbulanceCrossed={handleAmbulanceCrossed}
          />

          <div className="mt-4">
            <FourWaySignalGrid signals={snapshot.signals} compact />
          </div>
        </section>

        {/* Right Control & Concept Deck (5 cols) */}
        <div className="space-y-5 xl:col-span-5">
          {/* Simulation Playback Controls */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-bold text-slate-900">Traffic Simulation Controls</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Start normal TIMER cycles, pause/resume, step manually, or reset to ALL_RED.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {!snapshot.simulationRunning ? (
                <button
                  type="button"
                  onClick={handleStartOrResume}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{snapshot.stepCount > 0 ? 'Resume Traffic' : 'Start Normal Traffic'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePause}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-700 whitespace-nowrap"
                >
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Pause</span>
                </button>
              )}

              <button
                type="button"
                onClick={runTick}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
              >
                Single Tick
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleQuickFault}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 whitespace-nowrap"
              >
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Trigger Fault</span>
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs font-medium text-slate-600">DFA Timer Interval</span>
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                {[
                  { label: 'Slow', ms: 2400 },
                  { label: 'Normal', ms: 1500 },
                  { label: 'Fast', ms: 900 },
                ].map((opt) => (
                  <button
                    key={opt.ms}
                    type="button"
                    onClick={() => setTickMs(opt.ms)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                      tickMs === opt.ms
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Verified Emergency Ambulance Dispatch */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Siren className="h-4 w-4 text-red-600" aria-hidden="true" />
                <h3 className="text-sm font-bold text-slate-900">
                  Emergency Ambulance Dispatch
                </h3>
              </div>
              {snapshot.verification.verified ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{snapshot.verification.vehicleId} Verified</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('verification')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap"
                >
                  <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Verify Ambulance First</span>
                </button>
              )}
            </div>

            {!snapshot.verification.verified && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                Unverified requests are rejected by the backend. Go to{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('verification')}
                  className="font-bold underline"
                >
                  Emergency Verification
                </button>{' '}
                to authorize Ravi Kumar (DRV-101 / AMB-101), or click below to test rejection.
              </div>
            )}

            {snapshot.verification.verified && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                <span>
                  Authorized: <strong>{snapshot.verification.driverName}</strong> (
                  {snapshot.verification.driverId} · {snapshot.verification.vehicleId})
                </span>
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
              </div>
            )}

            <div className="mt-4">
              <div className="mb-1.5 text-xs font-semibold text-slate-700">
                Select Ambulance Approach Direction
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {DIRECTIONS.map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => setSelectedDirection(dir)}
                    className={`rounded-lg border py-2 font-mono text-xs font-semibold transition-colors whitespace-nowrap ${
                      selectedDirection === dir
                        ? 'border-blue-700 bg-blue-700 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleTriggerEmergency}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-red-700 whitespace-nowrap"
              >
                <Siren className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Trigger Emergency ({selectedDirection})</span>
              </button>

              <button
                type="button"
                onClick={handleClearEmergency}
                disabled={
                  !snapshot.activeEmergencyDirection &&
                  !snapshot.pendingEmergencyDirection &&
                  snapshot.currentState !== 'EMERGENCY_PREPARATION'
                }
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 whitespace-nowrap"
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Emergency Cleared</span>
              </button>
            </div>

            <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={autoClearAfterCross}
                onChange={(e) => setAutoClearAfterCross(e.target.checked)}
                className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span>Auto-send EMERGENCY_CLEARED after ambulance crosses</span>
            </label>

            {snapshot.emergencyQueue.length > 0 && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
                <span className="font-semibold">Deterministic FIFO Queue:</span>{' '}
                <span className="font-mono">{snapshot.emergencyQueue.join(' → ')}</span>
              </div>
            )}
          </section>

          {/* Live DFA State Readout */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-bold text-slate-900">Live Backend DFA Decision</h3>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Current State</span>
                <span className="font-mono font-bold text-blue-900">{snapshot.currentState}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Last Rule</span>
                <span className="font-mono font-semibold text-slate-800">
                  {snapshot.lastTransitionRule || 'Initial State'}
                </span>
              </div>
              <p className="pt-1 leading-relaxed text-slate-600">{snapshot.lastReason}</p>
            </div>

            {statusMessage && (
              <div
                className={`mt-3 rounded-lg border p-2.5 text-xs ${
                  statusMessage.type === 'error'
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : statusMessage.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-blue-200 bg-blue-50 text-blue-900'
                }`}
              >
                {statusMessage.text}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
