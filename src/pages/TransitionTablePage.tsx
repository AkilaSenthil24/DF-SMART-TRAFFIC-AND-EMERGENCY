import { useState } from 'react';
import type { DfaDefinition, LiveSystemSnapshot, StateGroup } from '../shared/dfaTypes.ts';

interface TransitionTablePageProps {
  definition: DfaDefinition;
  snapshot: LiveSystemSnapshot;
}

export function TransitionTablePage({ definition, snapshot }: TransitionTablePageProps) {
  const [groupFilter, setGroupFilter] = useState<'ALL' | StateGroup>('ALL');
  const [search, setSearch] = useState('');

  const filteredStates = definition.states.filter((st) => {
    if (groupFilter !== 'ALL' && st.group !== groupFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return st.id.toLowerCase().includes(q) || st.label.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Complete Deterministic Transition Table δ(q, σ)
            </h2>
            <p className="text-xs text-slate-500">
              Generated directly from the backend DFA definition ({definition.tupleSummary.Q_count} states ×{' '}
              {definition.tupleSummary.Sigma_count} inputs = {definition.tupleSummary.delta_count} deterministic entries).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter state..."
              aria-label="Filter states in transition table"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            />
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {(['ALL', 'NORMAL', 'INTER_GREEN', 'EMERGENCY', 'FAULT'] as const).map((grp) => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setGroupFilter(grp)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    groupFilter === grp
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {grp === 'INTER_GREEN' ? 'ALL-RED' : grp}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-900 text-white">
                <th className="sticky left-0 z-10 bg-slate-900 px-3 py-2.5 font-semibold whitespace-nowrap">
                  State (q ∈ Q)
                </th>
                {definition.alphabet.map((item) => (
                  <th
                    key={item.input}
                    className="px-3 py-2.5 font-mono text-[11px] font-semibold whitespace-nowrap"
                  >
                    {item.input}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStates.map((st) => {
                const isActiveRow = st.id === snapshot.currentState;
                const row = definition.transitionTable[st.id];
                return (
                  <tr
                    key={st.id}
                    className={isActiveRow ? 'bg-blue-50' : 'hover:bg-slate-50'}
                  >
                    <td
                      className={`sticky left-0 z-10 border-r border-slate-200 px-3 py-2.5 font-mono font-bold whitespace-nowrap ${
                        isActiveRow ? 'bg-blue-100 text-blue-950' : 'bg-white text-slate-900'
                      }`}
                    >
                      {st.id}
                      {st.isInitial ? ' (q0)' : ''}
                    </td>
                    {definition.alphabet.map(({ input }) => {
                      const nextState = row[input].to;
                      const isLastFired =
                        snapshot.previousState === st.id && snapshot.lastInput === input;
                      return (
                        <td
                          key={input}
                          title={row[input].reason}
                          className={`px-3 py-2.5 font-mono text-[11px] whitespace-nowrap ${
                            isLastFired
                              ? 'bg-blue-700 font-bold text-white'
                              : nextState === 'SYSTEM_FAULT'
                                ? 'text-red-700'
                                : nextState.startsWith('EMERGENCY')
                                  ? 'font-medium text-amber-800'
                                  : 'text-slate-700'
                          }`}
                        >
                          {nextState}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
