import { useEffect, useRef, useState } from 'react';
import type {
  DfaDefinition,
  DfaInput,
  LiveSystemSnapshot,
  TransitionEventRecord,
} from '../shared/dfaTypes.ts';
import { api } from '../lib/api.ts';
import { DfaStateDiagramSvg } from '../components/DfaStateDiagramSvg.tsx';
import { FourWaySignalGrid } from '../components/SignalBadge.tsx';
import { AlertCircle, Pause, Play, RotateCcw, SkipForward, Zap } from 'lucide-react';

interface DfaSimulatorPageProps {
  definition: DfaDefinition;
  snapshot: LiveSystemSnapshot;
  events: TransitionEventRecord[];
  onStateChange: (snapshot: LiveSystemSnapshot) => void;
  onRefreshHistory: () => void;
}

export function DfaSimulatorPage({
  definition,
  snapshot,
  events,
  onStateChange,
  onRefreshHistory,
}: DfaSimulatorPageProps) {
  const [selectedInput, setSelectedInput] = useState<DfaInput>('TIMER');
  const [customInput, setCustomInput] = useState('');
  const [autoRunning, setAutoRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [feedback, setFeedback] = useState<{
    accepted: boolean;
    message: string;
    safetyNote?: string;
  } | null>(null);
  const timerRef = useRef<number | null>(null);

  const executeInput = async (inputStr: string) => {
    try {
      const res = await api.stepDfa(inputStr);
      onStateChange(res.snapshot);
      onRefreshHistory();
      setFeedback({
        accepted: res.accepted,
        message: res.result.reason,
        safetyNote: res.result.safetyNote,
      });
    } catch (err) {
      setFeedback({
        accepted: false,
        message: err instanceof Error ? err.message : 'Failed to process DFA input.',
      });
    }
  };

  useEffect(() => {
    if (autoRunning && !paused) {
      timerRef.current = window.setInterval(() => {
        executeInput(selectedInput);
      }, 1400);
    }
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [autoRunning, paused, selectedInput]);

  const handleReset = async () => {
    setAutoRunning(false);
    setPaused(false);
    const res = await api.resetDfa();
    onStateChange(res.snapshot);
    onRefreshHistory();
    setFeedback({
      accepted: true,
      message: 'DFA reset deterministically to initial state ALL_RED (q0).',
      safetyNote: 'All signals set RED.',
    });
  };

  const currentRow = definition.transitionTable[snapshot.currentState];
  const previewRule = currentRow[selectedInput];

  return (
    <div className="space-y-6">
      {/* Top Controls & Interactive Input Alphabet */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Interactive DFA Simulator</h2>
            <p className="text-xs text-slate-500">
              Select an input symbol from Σ, step through δ(q, σ) manually or automatically, or test invalid input rejection.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!autoRunning ? (
              <button
                type="button"
                onClick={() => {
                  setAutoRunning(true);
                  setPaused(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Start</span>
              </button>
            ) : paused ? (
              <button
                type="button"
                onClick={() => setPaused(false)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPaused(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-700 whitespace-nowrap"
              >
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Pause</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => executeInput(selectedInput)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
            >
              <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Step Forward ({selectedInput})</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Input Alphabet Selector */}
        <div className="mt-4">
          <div className="mb-2 text-xs font-semibold text-slate-700">
            Input Alphabet Σ (Select input &amp; click Step Forward, or double-click / use quick trigger)
          </div>
          <div className="flex flex-wrap gap-2">
            {definition.alphabet.map((item) => {
              const active = selectedInput === item.input;
              return (
                <button
                  key={item.input}
                  type="button"
                  onClick={() => setSelectedInput(item.input)}
                  className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'border-blue-700 bg-blue-700 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {item.input}
                </button>
              );
            })}
          </div>
        </div>

        {/* Emergency Trace Preset Helper + Invalid Input Tester */}
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 lg:grid-cols-2">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div>
              <div className="text-xs font-semibold text-slate-800">
                Faculty Demo Preset: NORTH_GREEN + EMERGENCY_EAST
              </div>
              <div className="text-[11px] text-slate-500">
                Steps to NORTH_GREEN and selects EMERGENCY_EAST so you can trace Yellow → All-Red → Prep → East Emergency Green.
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                setAutoRunning(false);
                await api.resetDfa();
                const res = await api.stepDfa('TIMER');
                onStateChange(res.snapshot);
                onRefreshHistory();
                setSelectedInput('EMERGENCY_EAST');
                setFeedback({
                  accepted: true,
                  message:
                    'Preset ready at NORTH_GREEN with EMERGENCY_EAST selected. Click "Step Forward (EMERGENCY_EAST)" 4 times to watch the complete safe transition chain!',
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
            >
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Load Trace Demo</span>
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customInput.trim()) {
                executeInput(customInput.trim());
              }
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
          >
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Test invalid input (e.g. JUMP_GREEN)"
              aria-label="Test custom or invalid DFA input"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
            >
              Test Input
            </button>
          </form>
        </div>

        {/* Live Feedback Banner */}
        {feedback && (
          <div
            className={`mt-4 flex items-start gap-2.5 rounded-lg border p-3 text-xs ${
              feedback.accepted
                ? 'border-blue-200 bg-blue-50 text-blue-950'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <div className="font-semibold">{feedback.message}</div>
              {feedback.safetyNote && (
                <div className="mt-0.5 text-[11px] opacity-80">{feedback.safetyNote}</div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Live 5-Field Transition Trace + Next Preview */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-7">
          <h3 className="mb-3 text-sm font-bold text-slate-900">
            Last Executed Transition (Live DFA Output)
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">Previous State</div>
              <div className="mt-0.5 font-mono text-sm font-bold text-slate-800">
                {snapshot.previousState || '—'}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">Received Input</div>
              <div className="mt-0.5 font-mono text-sm font-bold text-blue-800">
                {snapshot.lastInput || '—'}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
              <div className="text-[11px] text-slate-500">Transition Function Applied</div>
              <div className="mt-0.5 font-mono text-sm font-bold text-slate-900">
                {snapshot.lastTransitionRule || `Current state initialized at ${snapshot.currentState}`}
              </div>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 sm:col-span-2">
              <div className="text-[11px] text-blue-700">Current / Next State</div>
              <div className="mt-0.5 font-mono text-base font-bold text-blue-950">
                {snapshot.currentState}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <FourWaySignalGrid signals={snapshot.signals} compact />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5">
          <h3 className="mb-2 text-sm font-bold text-slate-900">
            Lookahead: Next Transition for Selected Input
          </h3>
          <p className="mb-3 text-xs text-slate-500">
            Shows what δ({snapshot.currentState}, {selectedInput}) will produce when you click Step Forward.
          </p>
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="font-mono text-xs text-slate-700">
              δ(<strong>{snapshot.currentState}</strong>,{' '}
              <strong className="text-blue-700">{selectedInput}</strong>) ={' '}
              <strong className="text-emerald-700">{previewRule.to}</strong>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">{previewRule.reason}</p>
            <p className="border-t border-slate-200 pt-2 text-[11px] text-slate-500">
              Safety Rule: {previewRule.safetyNote}
            </p>
          </div>
        </div>
      </section>

      {/* Synchronized State Diagram */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3">
          <h3 className="text-sm font-bold text-slate-900">Synchronized DFA State Diagram</h3>
          <p className="text-xs text-slate-500">
            Generated from the same backend DFA definition; highlights active state and last fired edge.
          </p>
        </div>
        <DfaStateDiagramSvg
          definition={definition}
          currentState={snapshot.currentState}
          previousState={snapshot.previousState}
          lastInput={snapshot.lastInput}
          compact
        />
      </section>

      {/* Active Row of Transition Table + Transition History */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-bold text-slate-900">
            Current State Transition Row · δ({snapshot.currentState}, σ)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Input (σ)</th>
                  <th className="py-2 pr-3 font-semibold">Target State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {definition.alphabet.map(({ input }) => {
                  const isSel = input === selectedInput;
                  return (
                    <tr key={input} className={isSel ? 'bg-blue-50' : ''}>
                      <td className="py-2 pr-3 font-mono font-semibold text-blue-800">{input}</td>
                      <td className="py-2 pr-3 font-mono font-semibold text-slate-900">
                        {currentRow[input].to}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Transition History (Latest 8)</h3>
          {events.length === 0 ? (
            <p className="text-xs text-slate-500">No transitions logged yet.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-2 font-semibold">Prev</th>
                    <th className="py-2 pr-2 font-semibold">Input</th>
                    <th className="py-2 font-semibold">Next</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events.slice(0, 8).map((ev) => (
                    <tr key={ev.id}>
                      <td className="py-2 pr-2 font-mono text-slate-700">{ev.previousState}</td>
                      <td className="py-2 pr-2 font-mono font-semibold text-blue-700">
                        {ev.receivedInput}
                      </td>
                      <td className="py-2 font-mono font-semibold text-slate-900">
                        {ev.nextState}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
