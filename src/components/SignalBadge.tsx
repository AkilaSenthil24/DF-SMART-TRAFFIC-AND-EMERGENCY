import type { SignalColor, SignalTuple } from '../shared/dfaTypes.ts';
import { AlertTriangle, CheckCircle2, OctagonAlert, ShieldAlert } from 'lucide-react';

interface SignalLampProps {
  direction: string;
  color: SignalColor;
  compact?: boolean;
}

export function SignalStatusCell({ direction, color, compact = false }: SignalLampProps) {
  const styles: Record<
    SignalColor,
    { bg: string; text: string; border: string; label: string; Icon: typeof OctagonAlert }
  > = {
    RED: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      label: 'RED',
      Icon: OctagonAlert,
    },
    YELLOW: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      label: 'YELLOW',
      Icon: AlertTriangle,
    },
    GREEN: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      label: 'GREEN',
      Icon: CheckCircle2,
    },
    EMERGENCY_GREEN: {
      bg: 'bg-emerald-600',
      text: 'text-white',
      border: 'border-emerald-700',
      label: 'EMG GREEN',
      Icon: ShieldAlert,
    },
  };

  const s = styles[color];
  const Icon = s.Icon;

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg border ${s.border} ${s.bg} ${
        compact ? 'px-2.5 py-1.5' : 'px-3 py-2'
      }`}
    >
      <span className={`text-xs font-semibold ${color === 'EMERGENCY_GREEN' ? 'text-emerald-100' : 'text-slate-600'}`}>
        {direction}
      </span>
      <span className={`inline-flex items-center gap-1 font-mono text-xs font-bold ${s.text} whitespace-nowrap`}>
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{s.label}</span>
      </span>
    </div>
  );
}

export function FourWaySignalGrid({ signals, compact = false }: { signals: SignalTuple; compact?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <SignalStatusCell direction="North" color={signals.NORTH} compact={compact} />
      <SignalStatusCell direction="East" color={signals.EAST} compact={compact} />
      <SignalStatusCell direction="South" color={signals.SOUTH} compact={compact} />
      <SignalStatusCell direction="West" color={signals.WEST} compact={compact} />
    </div>
  );
}
