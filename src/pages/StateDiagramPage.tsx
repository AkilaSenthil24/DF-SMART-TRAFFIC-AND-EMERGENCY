import { useState } from 'react';
import type { DfaDefinition, DfaState, LiveSystemSnapshot } from '../shared/dfaTypes.ts';
import { DfaStateDiagramSvg } from '../components/DfaStateDiagramSvg.tsx';
import { FourWaySignalGrid } from '../components/SignalBadge.tsx';

interface StateDiagramPageProps {
  definition: DfaDefinition;
  snapshot: LiveSystemSnapshot;
}

export function StateDiagramPage({ definition, snapshot }: StateDiagramPageProps) {
  const [selectedState, setSelectedState] = useState<DfaState>(snapshot.currentState);
  const inspected =
    definition.states.find((s) => s.id === selectedState) || definition.states[0];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Formal DFA State Diagram</h2>
            <p className="text-xs text-slate-500">
              Click any node in the graph to inspect its signal tuple and outgoing transition edges.
            </p>
          </div>
          <div className="font-mono text-xs text-slate-700">
            Live State: <strong className="text-blue-700">{snapshot.currentState}</strong>
          </div>
        </div>

        <DfaStateDiagramSvg
          definition={definition}
          currentState={snapshot.currentState}
          previousState={snapshot.previousState}
          lastInput={snapshot.lastInput}
          selectedState={selectedState}
          onSelectState={setSelectedState}
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-medium text-slate-500">
              Selected Node · {inspected.group}
            </div>
            <h3 className="font-mono text-lg font-bold text-slate-900">{inspected.id}</h3>
            <p className="mt-1 text-sm text-slate-600">{inspected.description}</p>
          </div>
        </div>
        <div className="mt-4">
          <FourWaySignalGrid signals={inspected.signals} compact />
        </div>
      </section>
    </div>
  );
}
