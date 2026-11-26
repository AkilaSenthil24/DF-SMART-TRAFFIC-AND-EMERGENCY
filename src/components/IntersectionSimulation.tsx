import { useEffect, useRef, useState } from 'react';
import type { DfaState, Direction, SignalColor, SignalTuple } from '../shared/dfaTypes.ts';

interface IntersectionSimulationProps {
  currentState: DfaState;
  signals: SignalTuple;
  simulationRunning: boolean;
  ambulanceDirection: Direction | null;
  ambulancePhase: 'IDLE' | 'APPROACHING' | 'WAITING_AT_RED' | 'CROSSING' | 'CLEARED';
  onAmbulanceCrossed?: () => void;
}

interface CarEntity {
  id: string;
  dir: Direction;
  pos: number; // distance along travel axis from 0..640
  speed: number;
  color: string;
}

const INITIAL_CARS: CarEntity[] = [
  { id: 'N1', dir: 'NORTH', pos: 80, speed: 0, color: '#3b82f6' },
  { id: 'N2', dir: 'NORTH', pos: 155, speed: 0, color: '#60a5fa' },
  { id: 'E1', dir: 'EAST', pos: 85, speed: 0, color: '#0ea5e9' },
  { id: 'E2', dir: 'EAST', pos: 160, speed: 0, color: '#38bdf8' },
  { id: 'S1', dir: 'SOUTH', pos: 75, speed: 0, color: '#6366f1' },
  { id: 'S2', dir: 'SOUTH', pos: 150, speed: 0, color: '#818cf8' },
  { id: 'W1', dir: 'WEST', pos: 90, speed: 0, color: '#14b8a6' },
  { id: 'W2', dir: 'WEST', pos: 165, speed: 0, color: '#2dd4bf' },
];

const STOP_POS = 186; // front bumper stops just before 208px stop line
const BOX_EXIT = 445;

function SignalUnit({
  x,
  y,
  label,
  signal,
}: {
  x: number;
  y: number;
  label: string;
  signal: SignalColor;
}) {
  const isRed = signal === 'RED';
  const isYellow = signal === 'YELLOW';
  const isGreen = signal === 'GREEN' || signal === 'EMERGENCY_GREEN';
  const isEmergency = signal === 'EMERGENCY_GREEN';

  const statusText = isEmergency ? 'EMG' : isGreen ? 'GRN' : isYellow ? 'YEL' : 'RED';
  const statusColor = isEmergency
    ? '#34d399'
    : isGreen
      ? '#4ade80'
      : isYellow
        ? '#fbbf24'
        : '#f87171';

  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x="-17"
        y="-40"
        width="34"
        height="80"
        rx="7"
        fill="#0f172a"
        stroke={isEmergency ? '#34d399' : '#475569'}
        strokeWidth={isEmergency ? 2 : 1.5}
      />
      <circle
        cx="0"
        cy="-24"
        r="7.5"
        fill={isRed ? '#ef4444' : '#3f1515'}
        stroke="#1e293b"
        strokeWidth="1"
      />
      <circle
        cx="0"
        cy="-6"
        r="7.5"
        fill={isYellow ? '#f59e0b' : '#3d2c0b'}
        stroke="#1e293b"
        strokeWidth="1"
      />
      <circle
        cx="0"
        cy="12"
        r="7.5"
        fill={isGreen ? '#22c55e' : '#0f361e'}
        stroke="#1e293b"
        strokeWidth="1"
      />
      <text
        x="0"
        y="32"
        textAnchor="middle"
        fill={statusColor}
        fontSize="8.5"
        fontFamily="JetBrains Mono, monospace"
        fontWeight="700"
      >
        {label}:{statusText}
      </text>
    </g>
  );
}

function getCarTransform(dir: Direction, pos: number, laneOffset = 0): { x: number; y: number; rot: number } {
  // pos is 0 at entry edge, 640 at exit edge
  switch (dir) {
    case 'NORTH': // top -> bottom
      return { x: 266 + laneOffset, y: pos, rot: 180 };
    case 'EAST': // right -> left
      return { x: 640 - pos, y: 266 + laneOffset, rot: 270 };
    case 'SOUTH': // bottom -> top
      return { x: 374 - laneOffset, y: 640 - pos, rot: 0 };
    case 'WEST': // left -> right
      return { x: pos, y: 374 - laneOffset, rot: 90 };
  }
}

export function IntersectionSimulation({
  currentState,
  signals,
  simulationRunning,
  ambulanceDirection,
  ambulancePhase,
  onAmbulanceCrossed,
}: IntersectionSimulationProps) {
  const [cars, setCars] = useState<CarEntity[]>(INITIAL_CARS);
  const [ambPos, setAmbPos] = useState<number>(40);
  const [flashTick, setFlashTick] = useState(false);

  const carsRef = useRef<CarEntity[]>(INITIAL_CARS);
  const ambPosRef = useRef<number>(40);
  const crossedNotifiedRef = useRef<boolean>(false);

  const propsRef = useRef({
    signals,
    simulationRunning,
    ambulanceDirection,
    ambulancePhase,
    currentState,
    onAmbulanceCrossed,
  });
  propsRef.current = {
    signals,
    simulationRunning,
    ambulanceDirection,
    ambulancePhase,
    currentState,
    onAmbulanceCrossed,
  };

  // Reset ambulance position when returning to IDLE
  useEffect(() => {
    if (ambulancePhase === 'IDLE') {
      ambPosRef.current = 36;
      setAmbPos(36);
      crossedNotifiedRef.current = false;
    } else if (ambulancePhase === 'APPROACHING' && ambPosRef.current > STOP_POS + 20) {
      ambPosRef.current = 36;
      setAmbPos(36);
      crossedNotifiedRef.current = false;
    }
  }, [ambulancePhase, ambulanceDirection]);

  // Roof beacon flash interval when emergency is active
  useEffect(() => {
    if (!ambulanceDirection || ambulancePhase === 'IDLE') return;
    const id = window.setInterval(() => setFlashTick((v) => !v), 240);
    return () => window.clearInterval(id);
  }, [ambulanceDirection, ambulancePhase]);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const {
        signals: sig,
        simulationRunning: running,
        ambulanceDirection: ambDir,
        ambulancePhase: ambPh,
        currentState: st,
        onAmbulanceCrossed: notifyCrossed,
      } = propsRef.current;

      // Move normal cars when simulation is running OR when clearing yellow/green in emergency prep
      const shouldMoveCars = running || ambPh !== 'IDLE';

      if (shouldMoveCars && st !== 'SYSTEM_FAULT') {
        const updated = carsRef.current.map((car, _idx, all) => {
          const roadSig = sig[car.dir];
          const canPassStopLine = roadSig === 'GREEN';
          const isBeforeStop = car.pos <= STOP_POS;
          const isInsideBox = car.pos > STOP_POS && car.pos < BOX_EXIT;

          // Check distance to car ahead in same direction
          const sameLaneCars = all.filter((other) => other.dir === car.dir && other.id !== car.id);
          let blockedByCarAhead = false;
          for (const other of sameLaneCars) {
            const gap = other.pos - car.pos;
            if (gap > 0 && gap < 56) {
              blockedByCarAhead = true;
            }
          }

          let targetSpeed = 125; // px/sec
          if (blockedByCarAhead) {
            targetSpeed = 0;
          } else if (isBeforeStop && !canPassStopLine) {
            // Decelerate smoothly and strictly hold behind STOP_POS
            if (car.pos >= STOP_POS - 8) {
              targetSpeed = 0;
            } else if (car.pos >= STOP_POS - 55) {
              targetSpeed = 48;
            }
          } else if (isInsideBox && roadSig === 'YELLOW') {
            // Clear the box promptly on yellow
            targetSpeed = 145;
          }

          let nextPos = car.pos + targetSpeed * dt;

          // Strict hard-stop clamp so no car ever creeps past stop line on RED/YELLOW
          if (isBeforeStop && !canPassStopLine && nextPos > STOP_POS) {
            nextPos = STOP_POS;
          }

          // Wrap around cleanly after exiting viewport
          if (nextPos > 670) {
            const minOther = sameLaneCars.reduce((m, o) => Math.min(m, o.pos), 640);
            nextPos = Math.min(-35, minOther - 78);
          }

          return { ...car, pos: nextPos, speed: targetSpeed };
        });

        carsRef.current = updated;
        setCars(updated);
      }

      // Ambulance kinematics strictly governed by DFA signal output!
      if (ambDir && ambPh !== 'IDLE' && st !== 'SYSTEM_FAULT') {
        const ambSignal = sig[ambDir];
        const hasEmergencyGreen = ambSignal === 'EMERGENCY_GREEN';

        let cur = ambPosRef.current;
        if (ambPh === 'CLEARED') {
          // Finish exiting off the far side if still visible
          if (cur < 690) {
            cur += 210 * dt;
          }
        } else if (hasEmergencyGreen) {
          // DFA granted EMERGENCY_<DIR>_GREEN -> Ambulance crosses!
          cur += 205 * dt;
          if (cur >= 545 && !crossedNotifiedRef.current) {
            crossedNotifiedRef.current = true;
            notifyCrossed?.();
          }
        } else {
          // Signal is RED or YELLOW -> Ambulance approaches stop line and MUST WAIT!
          if (cur < STOP_POS - 6) {
            cur = Math.min(STOP_POS - 6, cur + 150 * dt);
          }
        }

        ambPosRef.current = cur;
        setAmbPos(cur);
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const ambTransform =
    ambulanceDirection && ambulancePhase !== 'IDLE' && ambPos < 685
      ? getCarTransform(ambulanceDirection, ambPos, 32)
      : null;

  const ambHasGreen =
    ambulanceDirection !== null && signals[ambulanceDirection] === 'EMERGENCY_GREEN';

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <svg
        viewBox="0 0 640 640"
        className="mx-auto block h-auto w-full max-w-[640px] select-none"
        role="img"
        aria-label="Four-way smart traffic intersection simulation"
      >
        {/* Urban Quadrant Blocks */}
        <rect x="0" y="0" width="640" height="640" fill="#0f172a" />
        <rect x="14" y="14" width="196" height="196" rx="10" fill="#162238" stroke="#1e293b" />
        <rect x="430" y="14" width="196" height="196" rx="10" fill="#162238" stroke="#1e293b" />
        <rect x="14" y="430" width="196" height="196" rx="10" fill="#162238" stroke="#1e293b" />
        <rect x="430" y="430" width="196" height="196" rx="10" fill="#162238" stroke="#1e293b" />

        {/* Asphalt Roads */}
        <rect x="225" y="0" width="190" height="640" fill="#1e293b" />
        <rect x="0" y="225" width="640" height="190" fill="#1e293b" />
        <rect x="225" y="225" width="190" height="190" fill="#263348" />

        {/* Center Double-Yellow Medians */}
        <line x1="318" y1="0" x2="318" y2="225" stroke="#eab308" strokeWidth="2" strokeDasharray="10 8" />
        <line x1="322" y1="415" x2="322" y2="640" stroke="#eab308" strokeWidth="2" strokeDasharray="10 8" />
        <line x1="0" y1="318" x2="225" y2="318" stroke="#eab308" strokeWidth="2" strokeDasharray="10 8" />
        <line x1="415" y1="322" x2="640" y2="322" stroke="#eab308" strokeWidth="2" strokeDasharray="10 8" />

        {/* Stop Lines */}
        <line x1="227" y1="210" x2="318" y2="210" stroke="#f8fafc" strokeWidth="4" />
        <line x1="430" y1="227" x2="430" y2="318" stroke="#f8fafc" strokeWidth="4" />
        <line x1="322" y1="430" x2="413" y2="430" stroke="#f8fafc" strokeWidth="4" />
        <line x1="210" y1="322" x2="210" y2="413" stroke="#f8fafc" strokeWidth="4" />

        {/* Crosswalk Stripes */}
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} fill="rgba(248, 250, 252, 0.25)">
            <rect x={232 + i * 38} y="216" width="20" height="7" rx="1" />
            <rect x={232 + i * 38} y="417" width="20" height="7" rx="1" />
            <rect x="216" y={232 + i * 38} width="7" height="20" rx="1" />
            <rect x="417" y={232 + i * 38} width="7" height="20" rx="1" />
          </g>
        ))}

        {/* Highlighted Emergency Corridor Lane when Active */}
        {ambulanceDirection === 'NORTH' && ambulancePhase !== 'IDLE' && (
          <rect
            x="286"
            y="0"
            width="28"
            height="640"
            fill={ambHasGreen ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.12)'}
          />
        )}
        {ambulanceDirection === 'EAST' && ambulancePhase !== 'IDLE' && (
          <rect
            x="0"
            y="286"
            width="640"
            height="28"
            fill={ambHasGreen ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.12)'}
          />
        )}
        {ambulanceDirection === 'SOUTH' && ambulancePhase !== 'IDLE' && (
          <rect
            x="326"
            y="0"
            width="28"
            height="640"
            fill={ambHasGreen ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.12)'}
          />
        )}
        {ambulanceDirection === 'WEST' && ambulancePhase !== 'IDLE' && (
          <rect
            x="0"
            y="326"
            width="640"
            height="28"
            fill={ambHasGreen ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.12)'}
          />
        )}

        {/* Direction Road Labels */}
        <text x="320" y="28" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="700" letterSpacing="2">
          NORTH ROAD
        </text>
        <text x="320" y="624" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="700" letterSpacing="2">
          SOUTH ROAD
        </text>
        <text x="580" y="310" textAnchor="end" fill="#94a3b8" fontSize="13" fontWeight="700" letterSpacing="2">
          EAST ROAD
        </text>
        <text x="60" y="310" textAnchor="start" fill="#94a3b8" fontSize="13" fontWeight="700" letterSpacing="2">
          WEST ROAD
        </text>

        {/* Quadrant Info Labels */}
        <text x="112" y="106" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="600">
          DFA CONTROLLER
        </text>
        <text
          x="112"
          y="126"
          textAnchor="middle"
          fill="#e2e8f0"
          fontSize="11.5"
          fontFamily="JetBrains Mono, monospace"
          fontWeight="700"
        >
          {currentState}
        </text>

        <text x="528" y="106" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="600">
          EMERGENCY STATUS
        </text>
        <text
          x="528"
          y="126"
          textAnchor="middle"
          fill={ambHasGreen ? '#34d399' : ambulanceDirection ? '#fca5a5' : '#94a3b8'}
          fontSize="11"
          fontFamily="JetBrains Mono, monospace"
          fontWeight="700"
        >
          {ambulancePhase === 'IDLE'
            ? 'NORMAL TRAFFIC'
            : `${ambulanceDirection}: ${ambulancePhase.replace(/_/g, ' ')}`}
        </text>

        {/* Four Traffic Signal Units */}
        <SignalUnit x={196} y={170} label="N" signal={signals.NORTH} />
        <SignalUnit x={470} y={196} label="E" signal={signals.EAST} />
        <SignalUnit x={444} y={470} label="S" signal={signals.SOUTH} />
        <SignalUnit x={170} y={444} label="W" signal={signals.WEST} />

        {/* Normal Vehicles */}
        {cars.map((car) => {
          const { x, y, rot } = getCarTransform(car.dir, car.pos, 0);
          return (
            <g key={car.id} transform={`translate(${x}, ${y}) rotate(${rot})`}>
              <rect x="-11" y="-18" width="22" height="36" rx="5" fill={car.color} stroke="#0f172a" strokeWidth="1.5" />
              <rect x="-8" y="-12" width="16" height="9" rx="2" fill="#e0f2fe" opacity="0.85" />
              <rect x="-8" y="5" width="16" height="6" rx="1.5" fill="#1e293b" opacity="0.7" />
            </g>
          );
        })}

        {/* Emergency Ambulance */}
        {ambTransform && (
          <g transform={`translate(${ambTransform.x}, ${ambTransform.y}) rotate(${ambTransform.rot})`}>
            {/* Subtle outer halo when active */}
            <rect
              x="-16"
              y="-27"
              width="32"
              height="54"
              rx="7"
              fill="none"
              stroke={ambHasGreen ? '#34d399' : '#f87171'}
              strokeWidth="2"
              opacity="0.85"
            />
            {/* Ambulance Body */}
            <rect x="-13" y="-23" width="26" height="46" rx="5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
            {/* Red Emergency Stripe & Cross */}
            <rect x="-13" y="2" width="26" height="6" fill="#dc2626" />
            <rect x="-2.5" y="-5" width="5" height="14" rx="1" fill="#dc2626" />
            <rect x="-7" y="-0.5" width="14" height="5" rx="1" fill="#dc2626" />
            {/* Windshield */}
            <rect x="-9.5" y="-18" width="19" height="9" rx="2" fill="#0f172a" />
            {/* Flashing Light Bar */}
            <rect x="-9" y="-9" width="9" height="4" rx="1" fill={flashTick ? '#ef4444' : '#7f1d1d'} />
            <rect x="0" y="-9" width="9" height="4" rx="1" fill={flashTick ? '#1e3a8a' : '#38bdf8'} />
          </g>
        )}

        {/* Waiting Alert Banner on Stage when Ambulance Stopped at Red */}
        {ambulanceDirection && !ambHasGreen && ambulancePhase !== 'IDLE' && ambulancePhase !== 'CLEARED' && (
          <g transform="translate(320, 560)">
            <rect x="-215" y="-16" width="430" height="30" rx="6" fill="#7f1d1d" stroke="#f87171" strokeWidth="1.5" />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill="#fef2f2"
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
            >
              AMBULANCE HELD AT RED · WAITING FOR EMERGENCY_{ambulanceDirection}_GREEN
            </text>
          </g>
        )}

        {/* Crossing Banner when DFA Grants Emergency Green */}
        {ambHasGreen && (
          <g transform="translate(320, 560)">
            <rect x="-215" y="-16" width="430" height="30" rx="6" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill="#ecfdf5"
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
            >
              DFA EMERGENCY_{ambulanceDirection}_GREEN · AMBULANCE CROSSING SAFELY
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
