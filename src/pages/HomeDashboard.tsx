import type { DfaDefinition, LiveSystemSnapshot, TransitionEventRecord } from '../shared/dfaTypes.ts';
import { FourWaySignalGrid } from '../components/SignalBadge.tsx';
import { ArrowRight, Cpu, Navigation, ShieldCheck, TableProperties } from 'lucide-react';

export type PageId =
  | 'home'
  | 'state-management'
  | 'simulator'
  | 'transition-table'
  | 'state-diagram'
  | 'simulation'
  | 'verification'
  | 'history'
  | 'project-info';

interface HomeDashboardProps {
  definition: DfaDefinition;
  snapshot: LiveSystemSnapshot;
  recentEvents: TransitionEventRecord[];
  onNavigate: (page: PageId) => void;
}

export function HomeDashboard({
  definition,
  snapshot,
  recentEvents,
  onNavigate,
}: HomeDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Hero Summary Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-8">
            <p className="text-xs font-semibold tracking-wide text-blue-700">
              Theory of Computation Capstone · Formal Model M = (Q, Σ, δ, q0, F)
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl text-balance">
              DFA-Based Smart Traffic Signal Management &amp; Emergency Ambulance Control
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              A deterministic finite automaton governs every traffic signal transition across four
              road approaches. Normal phases advance on timer inputs, while verified emergency
              ambulances preempt conflicting greens safely through Yellow and All-Red clearance
              states before crossing.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('simulator')}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap"
              >
                <span>Open DFA Simulator</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('simulation')}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap"
              >
                <span>Launch Live Intersection</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-white lg:col-span-4">
            <div className="text-xs font-medium text-slate-400">Formal 5-Tuple Specification</div>
            <div className="mt-3 space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">States |Q|</span>
                <span className="font-semibold text-sky-300">{definition.tupleSummary.Q_count} states</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Alphabet |Σ|</span>
                <span className="font-semibold text-sky-300">{definition.tupleSummary.Sigma_count} inputs</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Transitions |δ|</span>
                <span className="font-semibold text-sky-300">{definition.tupleSummary.delta_count} total rules</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Initial q0</span>
                <span className="font-semibold text-emerald-300">{definition.tupleSummary.q0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Accepting F</span>
                <span className="font-semibold text-emerald-300">
                  {'{'}
                  {definition.tupleSummary.F.join(', ')}
                  {'}'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live DFA KPI Strip (4 columns full width) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Current DFA State</div>
          <div className="mt-1.5 font-mono text-base font-bold text-blue-900">
            {snapshot.currentState}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Previous: <span className="font-mono">{snapshot.previousState || 'NONE'}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Last Processed Input</div>
          <div className="mt-1.5 font-mono text-base font-bold text-slate-900">
            {snapshot.lastInput || 'INITIALIZED'}
          </div>
          <div className="mt-1 text-xs text-slate-500 truncate">
            {snapshot.lastTransitionRule || 'Awaiting first DFA input'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Ambulance Corridor Status</div>
          <div className="mt-1.5 font-mono text-base font-bold text-slate-900">
            {snapshot.ambulancePhase}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Verified:{' '}
            <span className={snapshot.verification.verified ? 'font-semibold text-emerald-700' : 'text-slate-600'}>
              {snapshot.verification.verified
                ? `${snapshot.verification.vehicleId} (${snapshot.verification.driverName})`
                : 'Not Verified'}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Executed Transitions</div>
          <div className="mt-1.5 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {snapshot.stepCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Queued Emergencies: <span className="font-mono">{snapshot.emergencyQueue.length}</span>
          </div>
        </div>
      </section>

      {/* Current Signal Output */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Live 4-Way Signal Output</h2>
            <p className="text-xs text-slate-500">{snapshot.lastReason}</p>
          </div>
          <span className="font-mono text-xs text-slate-600">
            Active State: <strong>{snapshot.currentState}</strong>
          </span>
        </div>
        <FourWaySignalGrid signals={snapshot.signals} />
      </section>

      {/* Two Core Project Modules */}
      <section className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-blue-800">
              <Cpu className="h-5 w-5" aria-hidden="true" />
              <h2 className="text-lg font-bold text-slate-900">
                Module 1 · DFA Traffic Signal State Management
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Implements the formal finite automaton (Q, Σ, δ, q0, F) with 19 states, 8 inputs,
              and 152 deterministic transition rules. Guarantees zero conflicting greens, mandatory
              yellow clearance, and safe rejection of invalid inputs.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => onNavigate('state-management')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
            >
              Formal Definition
            </button>
            <button
              type="button"
              onClick={() => onNavigate('simulator')}
              className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
            >
              DFA Simulator
            </button>
            <button
              type="button"
              onClick={() => onNavigate('transition-table')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
            >
              Transition Table
            </button>
            <button
              type="button"
              onClick={() => onNavigate('state-diagram')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
            >
              State Diagram
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-blue-800">
              <Navigation className="h-5 w-5" aria-hidden="true" />
              <h2 className="text-lg font-bold text-slate-900">
                Module 2 · Ambulance Movement &amp; Intersection Simulation
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Visualizes a four-way road intersection driven strictly by the backend DFA output.
              Normal cars and approaching ambulances obey stop lines on Red/Yellow and proceed only
              when the DFA transitions to the matching Green or Emergency Green state.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => onNavigate('simulation')}
              className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
            >
              Live Traffic Simulation
            </button>
            <button
              type="button"
              onClick={() => onNavigate('verification')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
              <span>Emergency Verification</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('project-info')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
            >
              <TableProperties className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
              <span>Viva Guide</span>
            </button>
          </div>
        </div>
      </section>

      {/* Recent Transitions Preview */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Recent DFA Event Log</h2>
            <p className="text-xs text-slate-500">Latest deterministic state transitions stored in SQLite</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('history')}
            className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap"
          >
            View Full History
          </button>
        </div>

        {recentEvents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No DFA transitions recorded yet. Start the DFA Simulator or Live Simulation to log transitions.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4 font-semibold">Previous State</th>
                  <th className="py-2 pr-4 font-semibold">Input</th>
                  <th className="py-2 pr-4 font-semibold">Next State</th>
                  <th className="py-2 pr-4 font-semibold">Category</th>
                  <th className="py-2 font-semibold">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentEvents.slice(0, 5).map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pr-4 font-mono text-slate-700">{ev.previousState}</td>
                    <td className="py-2.5 pr-4 font-mono font-semibold text-blue-800">{ev.receivedInput}</td>
                    <td className="py-2.5 pr-4 font-mono font-semibold text-slate-900">{ev.nextState}</td>
                    <td className="py-2.5 pr-4 font-mono text-slate-600">{ev.category}</td>
                    <td className="py-2.5 text-slate-600">{ev.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
