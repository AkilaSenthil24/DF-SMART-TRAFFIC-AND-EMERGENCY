import { useEffect, useState } from 'react';
import type { DfaDefinition, DfaState, LiveSystemSnapshot } from '../shared/dfaTypes.ts';
import { api, type InvariantReport } from '../lib/api.ts';
import { FourWaySignalGrid } from '../components/SignalBadge.tsx';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

interface StateManagementPageProps {
  definition: DfaDefinition;
  snapshot: LiveSystemSnapshot;
}

export function StateManagementPage({ definition, snapshot }: StateManagementPageProps) {
  const [selectedStateId, setSelectedStateId] = useState<DfaState>(snapshot.currentState);
  const [invariants, setInvariants] = useState<InvariantReport | null>(null);

  useEffect(() => {
    api.verifyInvariants().then(setInvariants).catch(console.error);
  }, []);

  const selectedMeta =
    definition.states.find((s) => s.id === selectedStateId) || definition.states[0];
  const outgoingRules = definition.transitionTable[selectedMeta.id];

  return (
    <div className="space-y-6">
      {/* Formal 5-Tuple Definition */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Formal DFA Definition · M = (Q, Σ, δ, q0, F)
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Every traffic light phase and emergency clearance sequence is governed exclusively by this
          deterministic 5-tuple automaton.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="font-mono text-xs font-bold text-blue-800">Q · Finite Set of States</div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              {definition.tupleSummary.Q_count} states covering normal Greens, mandatory Yellows,
              phase-encoded All-Red buffers, Emergency Preparation, 4 Emergency Greens, Emergency
              Recovery, and System Fault.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="font-mono text-xs font-bold text-blue-800">Σ · Input Alphabet</div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              {definition.tupleSummary.Sigma_count} valid symbols: TIMER, EMERGENCY_NORTH,
              EMERGENCY_EAST, EMERGENCY_SOUTH, EMERGENCY_WEST, EMERGENCY_CLEARED, RESET, FAULT.
              Any other symbol is rejected safely.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="font-mono text-xs font-bold text-blue-800">
              δ, q0, F · Function, Start &amp; Accept
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              Total function δ: Q × Σ → Q ({definition.tupleSummary.delta_count} rules). Initial
              state q0 = ALL_RED. {definition.tupleSummary.acceptingJustification}
            </p>
          </div>
        </div>
      </section>

      {/* Automated Safety Invariant Proof */}
      {invariants && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
            <h3 className="text-base font-bold text-slate-900">
              Backend Mathematical Safety Verification
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Total Determinism</span>
              </div>
              <div className="mt-1 font-mono text-xs text-emerald-900">
                {invariants.totalDefinedPairs} / {invariants.expectedPairs} pairs defined
              </div>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Zero Conflicting Greens</span>
              </div>
              <div className="mt-1 font-mono text-xs text-emerald-900">
                {invariants.zeroConflictingGreens ? 'PASS · 0 conflicts' : 'FAIL'}
              </div>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Yellow Clearance Guard</span>
              </div>
              <div className="mt-1 font-mono text-xs text-emerald-900">
                {invariants.yellowSafetyEnforced ? 'PASS · Enforced on all Greens' : 'FAIL'}
              </div>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Fault Fail-Safe Lock</span>
              </div>
              <div className="mt-1 font-mono text-xs text-emerald-900">
                {invariants.faultIsolationVerified ? 'PASS · Requires RESET' : 'FAIL'}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Interactive State & Alphabet Inspector */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* States List */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5">
          <h3 className="text-sm font-bold text-slate-900">Select a State from Q ({definition.states.length})</h3>
          <p className="mb-3 text-xs text-slate-500">Click any state to inspect its signal outputs and δ rules.</p>
          <div className="max-h-[460px] space-y-1.5 overflow-y-auto pr-1">
            {definition.states.map((st) => {
              const isSelected = st.id === selectedMeta.id;
              const isLive = st.id === snapshot.currentState;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStateId(st.id)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? 'border-blue-700 bg-blue-50 text-blue-950'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-mono font-semibold">{st.id}</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {isLive ? 'LIVE · ' : ''}
                    {st.group}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Selected State Details */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs font-medium text-slate-500">
                State Inspector · {selectedMeta.group}
                {selectedMeta.isInitial ? ' · Initial (q0)' : ''}
                {selectedMeta.isAccepting ? ' · Accepting (F)' : ''}
              </div>
              <h3 className="mt-0.5 font-mono text-xl font-bold text-slate-900">
                {selectedMeta.id}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{selectedMeta.description}</p>
            </div>
          </div>

          <div className="my-4">
            <div className="mb-2 text-xs font-semibold text-slate-700">Signal Outputs in this State</div>
            <FourWaySignalGrid signals={selectedMeta.signals} compact />
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold text-slate-700">
              Deterministic Outgoing Transitions δ({selectedMeta.id}, σ)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Input (σ)</th>
                    <th className="py-2 pr-3 font-semibold">Next State</th>
                    <th className="py-2 font-semibold">Rule Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {definition.alphabet.map(({ input }) => {
                    const rule = outgoingRules[input];
                    return (
                      <tr key={input}>
                        <td className="py-2 pr-3 font-mono font-semibold text-blue-800">{input}</td>
                        <td className="py-2 pr-3 font-mono font-semibold text-slate-900">{rule.to}</td>
                        <td className="py-2 text-slate-600">{rule.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
