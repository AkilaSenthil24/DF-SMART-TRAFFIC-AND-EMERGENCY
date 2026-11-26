import { useMemo, useState } from 'react';
import type { DfaDefinition, DfaState } from '../shared/dfaTypes.ts';

interface NodePos {
  x: number;
  y: number;
  shortLabel: string;
}

const NODE_LAYOUT: Record<DfaState, NodePos> = {
  ALL_RED: { x: 175, y: 115, shortLabel: 'ALL_RED (q0)' },
  NORTH_GREEN: { x: 405, y: 75, shortLabel: 'NORTH_GREEN' },
  NORTH_YELLOW: { x: 645, y: 75, shortLabel: 'NORTH_YELLOW' },
  ALL_RED_E: { x: 865, y: 115, shortLabel: 'ALL_RED_E' },
  EAST_GREEN: { x: 935, y: 245, shortLabel: 'EAST_GREEN' },
  EAST_YELLOW: { x: 935, y: 390, shortLabel: 'EAST_YELLOW' },
  ALL_RED_S: { x: 865, y: 520, shortLabel: 'ALL_RED_S' },
  SOUTH_GREEN: { x: 645, y: 560, shortLabel: 'SOUTH_GREEN' },
  SOUTH_YELLOW: { x: 405, y: 560, shortLabel: 'SOUTH_YELLOW' },
  ALL_RED_W: { x: 175, y: 520, shortLabel: 'ALL_RED_W' },
  WEST_GREEN: { x: 105, y: 390, shortLabel: 'WEST_GREEN' },
  WEST_YELLOW: { x: 105, y: 245, shortLabel: 'WEST_YELLOW' },

  EMERGENCY_PREPARATION: { x: 330, y: 318, shortLabel: 'EMG_PREP' },
  EMERGENCY_NORTH_GREEN: { x: 525, y: 205, shortLabel: 'EMG_N_GREEN' },
  EMERGENCY_EAST_GREEN: { x: 555, y: 280, shortLabel: 'EMG_E_GREEN' },
  EMERGENCY_SOUTH_GREEN: { x: 555, y: 358, shortLabel: 'EMG_S_GREEN' },
  EMERGENCY_WEST_GREEN: { x: 525, y: 432, shortLabel: 'EMG_W_GREEN' },
  EMERGENCY_RECOVERY: { x: 740, y: 318, shortLabel: 'EMG_RECOVERY' },
  SYSTEM_FAULT: { x: 525, y: 650, shortLabel: 'SYSTEM_FAULT' },
};

interface DfaStateDiagramSvgProps {
  definition: DfaDefinition;
  currentState: DfaState;
  previousState?: DfaState | null;
  lastInput?: string | null;
  selectedState?: DfaState | null;
  onSelectState?: (state: DfaState) => void;
  compact?: boolean;
}

interface EdgeItem {
  from: DfaState;
  to: DfaState;
  label: string;
  kind: 'normal' | 'emergency' | 'interrupt' | 'fault';
}

export function DfaStateDiagramSvg({
  definition,
  currentState,
  previousState,
  lastInput,
  selectedState,
  onSelectState,
  compact = false,
}: DfaStateDiagramSvgProps) {
  const [showInterruptEdges, setShowInterruptEdges] = useState(true);
  const [showFaultEdges, setShowFaultEdges] = useState(false);

  const edges = useMemo(() => {
    const grouped = new Map<string, { from: DfaState; to: DfaState; inputs: string[] }>();

    for (const state of definition.states) {
      const row = definition.transitionTable[state.id];
      for (const { input } of definition.alphabet) {
        const to = row[input].to;
        if (to === state.id) continue; // omit self-loops from main graph clutter
        const key = `${state.id}->${to}`;
        const existing = grouped.get(key);
        if (existing) {
          existing.inputs.push(input);
        } else {
          grouped.set(key, { from: state.id, to, inputs: [input] });
        }
      }
    }

    const result: EdgeItem[] = [];
    for (const item of grouped.values()) {
      const hasFaultOrReset = item.inputs.every((i) => i === 'FAULT' || i === 'RESET');
      if (hasFaultOrReset) {
        result.push({
          from: item.from,
          to: item.to,
          label: item.inputs.join('/'),
          kind: 'fault',
        });
        continue;
      }

      const filteredInputs = item.inputs.filter((i) => i !== 'FAULT' && i !== 'RESET');
      const label =
        filteredInputs.length >= 4 && filteredInputs.every((i) => i.startsWith('EMERGENCY_'))
          ? 'EMG_*'
          : filteredInputs.join(', ');

      const isEmergencyCore =
        item.from.startsWith('EMERGENCY') || item.to.startsWith('EMERGENCY');

      const isInterruptFromNormal =
        !item.from.startsWith('EMERGENCY') &&
        !item.to.startsWith('EMERGENCY') &&
        filteredInputs.every((i) => i.startsWith('EMERGENCY_'));

      if (isInterruptFromNormal) {
        // Represented on the same Green->Yellow / Yellow->AllRed edges cleanly via combined label
        result.push({
          from: item.from,
          to: item.to,
          label,
          kind: 'interrupt',
        });
      } else {
        result.push({
          from: item.from,
          to: item.to,
          label,
          kind: isEmergencyCore ? 'emergency' : 'normal',
        });
      }
    }

    return result;
  }, [definition]);

  const visibleEdges = edges.filter((e) => {
    if (e.kind === 'fault') return showFaultEdges;
    if (e.kind === 'interrupt') return showInterruptEdges;
    return true;
  });

  const nodeW = 132;
  const nodeH = 40;

  return (
    <div className="flex flex-col gap-3">
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
              Active State ({currentState})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
              Accepting State (ALL_RED)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-red-600" />
              Emergency Edges
            </span>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-1.5 text-slate-700">
              <input
                type="checkbox"
                checked={showInterruptEdges}
                onChange={(e) => setShowInterruptEdges(e.target.checked)}
                className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span>Emergency Preempt Arrows</span>
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 text-slate-700">
              <input
                type="checkbox"
                checked={showFaultEdges}
                onChange={(e) => setShowFaultEdges(e.target.checked)}
                className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span>Global FAULT / RESET Edges</span>
            </label>
          </div>
        </div>
      )}

      <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-2">
        <svg
          viewBox="0 0 1040 695"
          className="h-auto w-full min-w-[740px] select-none"
          role="img"
          aria-label="DFA State Transition Diagram"
        >
          <defs>
            <marker
              id="arrow-normal"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,1 L7,4 L0,7 Z" fill="#64748b" />
            </marker>
            <marker
              id="arrow-emergency"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,1 L7,4 L0,7 Z" fill="#f87171" />
            </marker>
            <marker
              id="arrow-active"
              markerWidth="9"
              markerHeight="9"
              refX="8"
              refY="4.5"
              orient="auto"
            >
              <path d="M0,1 L8,4.5 L0,8 Z" fill="#38bdf8" />
            </marker>
            <marker
              id="arrow-fault"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <path d="M0,1 L6,3.5 L0,6 Z" fill="#fbbf24" />
            </marker>
          </defs>

          {/* Subtle Region Guides */}
          <rect
            x="245"
            y="148"
            width="570"
            height="332"
            rx="14"
            fill="rgba(127, 29, 29, 0.08)"
            stroke="rgba(248, 113, 113, 0.2)"
            strokeDasharray="6 4"
          />
          <text x="260" y="170" fill="#fca5a5" fontSize="11" fontWeight="600">
            Emergency Corridor Sub-Automaton
          </text>

          {/* Initial State Entry Arrow */}
          <line
            x1="55"
            y1="115"
            x2={NODE_LAYOUT.ALL_RED.x - nodeW / 2 - 4}
            y2="115"
            stroke="#38bdf8"
            strokeWidth="2.5"
            markerEnd="url(#arrow-active)"
          />
          <text x="58" y="105" fill="#7dd3fc" fontSize="11" fontWeight="600">
            Start (q0)
          </text>

          {/* Edges */}
          {visibleEdges.map((edge, idx) => {
            const p1 = NODE_LAYOUT[edge.from];
            const p2 = NODE_LAYOUT[edge.to];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.hypot(dx, dy) || 1;
            const ux = dx / dist;
            const uy = dy / dist;

            // Compute rectangle boundary intersections cleanly
            const startX = p1.x + ux * (nodeW / 2 - 4);
            const startY = p1.y + uy * (nodeH / 2 + 2);
            const endX = p2.x - ux * (nodeW / 2 + 6);
            const endY = p2.y - uy * (nodeH / 2 + 6);

            const isJustFired =
              previousState === edge.from && currentState === edge.to && Boolean(lastInput);

            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            const curveOffset = edge.from === 'EMERGENCY_RECOVERY' && edge.to === 'ALL_RED' ? -45 : 0;
            const ctrlX = midX - uy * curveOffset;
            const ctrlY = midY + ux * curveOffset;

            let stroke = '#475569';
            let marker = 'url(#arrow-normal)';
            if (edge.kind === 'emergency') {
              stroke = '#ef4444';
              marker = 'url(#arrow-emergency)';
            } else if (edge.kind === 'fault') {
              stroke = '#d97706';
              marker = 'url(#arrow-fault)';
            }
            if (isJustFired) {
              stroke = '#38bdf8';
              marker = 'url(#arrow-active)';
            }

            const pathD =
              curveOffset !== 0
                ? `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`
                : `M ${startX} ${startY} L ${endX} ${endY}`;

            return (
              <g key={`${edge.from}-${edge.to}-${idx}`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={isJustFired ? 3 : edge.kind === 'fault' ? 1 : 1.6}
                  strokeOpacity={isJustFired ? 1 : edge.kind === 'fault' ? 0.35 : 0.85}
                  markerEnd={marker}
                />
                {edge.kind !== 'fault' && (
                  <text
                    x={curveOffset !== 0 ? ctrlX : midX}
                    y={(curveOffset !== 0 ? ctrlY : midY) - 4}
                    textAnchor="middle"
                    fill={isJustFired ? '#7dd3fc' : edge.kind === 'emergency' ? '#fca5a5' : '#94a3b8'}
                    fontSize="9.5"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight={isJustFired ? '700' : '500'}
                  >
                    {isJustFired ? `${lastInput}` : edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* State Nodes */}
          {definition.states.map((st) => {
            const pos = NODE_LAYOUT[st.id];
            const isCurrent = currentState === st.id;
            const isSelected = selectedState === st.id;

            let fill = '#0f172a';
            let stroke = '#334155';
            let textColor = '#e2e8f0';

            if (st.group === 'EMERGENCY') {
              fill = '#2a0f18';
              stroke = '#dc2626';
            } else if (st.group === 'FAULT') {
              fill = '#2b1808';
              stroke = '#d97706';
            } else if (st.id.includes('GREEN')) {
              fill = '#08261a';
              stroke = '#16a34a';
            } else if (st.id.includes('YELLOW')) {
              fill = '#291e06';
              stroke = '#eab308';
            } else if (st.isAccepting) {
              fill = '#0a223a';
              stroke = '#10b981';
            }

            if (isCurrent) {
              fill = '#1d4ed8';
              stroke = '#38bdf8';
              textColor = '#ffffff';
            } else if (isSelected) {
              stroke = '#93c5fd';
            }

            return (
              <g
                key={st.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onSelectState?.(st.id)}
                className={onSelectState ? 'cursor-pointer' : ''}
              >
                {isCurrent && (
                  <rect
                    x={-nodeW / 2 - 5}
                    y={-nodeH / 2 - 5}
                    width={nodeW + 10}
                    height={nodeH + 10}
                    rx="12"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    opacity="0.85"
                  />
                )}
                {st.isAccepting && (
                  <rect
                    x={-nodeW / 2 - 3}
                    y={-nodeH / 2 - 3}
                    width={nodeW + 6}
                    height={nodeH + 6}
                    rx="10"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                  />
                )}
                <rect
                  x={-nodeW / 2}
                  y={-nodeH / 2}
                  width={nodeW}
                  height={nodeH}
                  rx="8"
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isCurrent ? 2.5 : 1.5}
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill={textColor}
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight={isCurrent ? '700' : '600'}
                >
                  {pos.shortLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
