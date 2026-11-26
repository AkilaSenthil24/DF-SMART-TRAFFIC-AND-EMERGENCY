import { useState } from 'react';
import type { TransitionEventRecord } from '../shared/dfaTypes.ts';
import { api } from '../lib/api.ts';
import { Download, Trash2 } from 'lucide-react';

interface EventHistoryPageProps {
  events: TransitionEventRecord[];
  onRefreshHistory: () => void;
}

const CATEGORIES = ['ALL', 'NORMAL', 'EMERGENCY', 'VERIFICATION', 'INVALID', 'FAULT', 'RESET'] as const;

export function EventHistoryPage({ events, onRefreshHistory }: EventHistoryPageProps) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('ALL');
  const [search, setSearch] = useState('');

  const filtered = events.filter((ev) => {
    if (category !== 'ALL' && ev.category !== category) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        ev.previousState.toLowerCase().includes(q) ||
        ev.receivedInput.toLowerCase().includes(q) ||
        ev.nextState.toLowerCase().includes(q) ||
        ev.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCsv = () => {
    const header = [
      'ID',
      'Timestamp',
      'PreviousState',
      'ReceivedInput',
      'NextState',
      'TransitionRule',
      'Category',
      'Accepted',
      'Reason',
    ].join(',');

    const rows = filtered.map((ev) =>
      [
        ev.id,
        ev.timestamp,
        ev.previousState,
        `"${ev.receivedInput.replace(/"/g, '""')}"`,
        ev.nextState,
        `"${ev.transitionRule.replace(/"/g, '""')}"`,
        ev.category,
        ev.accepted,
        `"${ev.reason.replace(/"/g, '""')}"`,
      ].join(','),
    );

    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dfa_traffic_event_history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = async () => {
    await api.clearHistory();
    onRefreshHistory();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              DFA Transition &amp; Verification Event History
            </h2>
            <p className="text-xs text-slate-500">
              Persistent SQLite audit log recording all transitions, rejected inputs, verification checks, and faults.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={events.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Clear Log</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  category === cat
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search state, input, or reason..."
            aria-label="Search event history"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none sm:w-64"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            No matching events found in the database. Run the DFA Simulator or Live Traffic Simulation to populate logs.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-3 font-semibold">#</th>
                  <th className="py-2.5 pr-3 font-semibold">Time</th>
                  <th className="py-2.5 pr-3 font-semibold">Previous State</th>
                  <th className="py-2.5 pr-3 font-semibold">Input</th>
                  <th className="py-2.5 pr-3 font-semibold">Next State</th>
                  <th className="py-2.5 pr-3 font-semibold">Category</th>
                  <th className="py-2.5 pr-3 font-semibold">Status</th>
                  <th className="py-2.5 font-semibold">Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pr-3 font-mono text-slate-500 tabular-nums">{ev.id}</td>
                    <td className="py-2.5 pr-3 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-slate-700">{ev.previousState}</td>
                    <td className="py-2.5 pr-3 font-mono font-semibold text-blue-800">
                      {ev.receivedInput}
                    </td>
                    <td className="py-2.5 pr-3 font-mono font-semibold text-slate-900">
                      {ev.nextState}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-slate-600">{ev.category}</td>
                    <td
                      className={`py-2.5 pr-3 font-mono font-semibold ${
                        ev.accepted ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {ev.accepted ? 'ACCEPTED' : 'REJECTED'}
                    </td>
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
