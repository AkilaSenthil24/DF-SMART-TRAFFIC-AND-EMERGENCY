import { ArrowRight } from 'lucide-react';

const WORKFLOW_STEPS = [
  'NORMAL TRAFFIC',
  'EMERGENCY REQUEST',
  'VERIFICATION',
  'DFA INPUT PROCESSING',
  'SAFE SIGNAL TRANSITIONS',
  'EMERGENCY GREEN',
  'AMBULANCE CROSSING',
  'EMERGENCY CLEARED',
  'NORMAL TRAFFIC',
];

export function ProjectInfoPage() {
  return (
    <div className="space-y-6">
      {/* Beginner-Friendly Overview */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold text-slate-900">
          Project Information &amp; Beginner-Friendly Explanation
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          This B.Tech Theory of Computation capstone demonstrates how a{' '}
          <strong>Deterministic Finite Automaton (DFA)</strong> acts as the mathematical brain of a
          smart four-way traffic intersection. Smart traffic management is the application domain,
          and the ambulance simulation is the visual proof that the DFA produces safe, collision-free
          decisions.
        </p>

        {/* Visual Process Pipeline */}
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5 text-white">
          <div className="mb-3 text-xs font-semibold text-sky-300">
            End-to-End Emergency Workflow Pipeline
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {WORKFLOW_STEPS.map((step, idx) => (
              <div key={`${step}-${idx}`} className="flex items-center gap-2">
                <span className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-slate-100">
                  {idx + 1}. {step}
                </span>
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple English Q&A Cards */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-bold text-slate-900">1. What is a DFA &amp; why use it here?</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            A Deterministic Finite Automaton (DFA) is an abstract machine with a finite number of
            states. For any current state and valid input, there is{' '}
            <strong>exactly one guaranteed next state</strong>. In traffic control, determinism is
            vital because random or ambiguous light changes cause accidents.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-bold text-slate-900">2. What are States (Q) and Inputs (Σ)?</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            <strong>States (Q)</strong> represent exact traffic light configurations—such as{' '}
            <code className="font-mono">ALL_RED</code>, <code className="font-mono">NORTH_GREEN</code>
            , <code className="font-mono">NORTH_YELLOW</code>, and{' '}
            <code className="font-mono">EMERGENCY_EAST_GREEN</code>. <strong>Inputs (Σ)</strong> are
            events entering the controller: <code className="font-mono">TIMER</code>, verified{' '}
            <code className="font-mono">EMERGENCY_NORTH/EAST/SOUTH/WEST</code>,{' '}
            <code className="font-mono">EMERGENCY_CLEARED</code>, <code className="font-mono">FAULT</code>,
            and <code className="font-mono">RESET</code>.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-bold text-slate-900">3. What is the Transition Function (δ)?</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            The transition function <code className="font-mono">δ(currentState, input) = nextState</code>{' '}
            is a complete lookup table of 152 rules. Because every state-input pair is defined, the
            controller never guesses or enters an undefined state.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-bold text-slate-900">
            4. How does the Normal Sequence stay strictly deterministic?
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            A pure DFA has no hidden counter variable. By using distinct inter-green states (
            <code className="font-mono">ALL_RED</code>, <code className="font-mono">ALL_RED_E</code>,{' '}
            <code className="font-mono">ALL_RED_S</code>, <code className="font-mono">ALL_RED_W</code>),
            each <code className="font-mono">TIMER</code> tick deterministically advances North →
            East → South → West → back to <code className="font-mono">ALL_RED</code>.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-bold text-slate-900">
            5. How does an Emergency safely interrupt Normal Traffic?
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Suppose North is green and an ambulance approaches from East. The DFA never jumps from{' '}
            <code className="font-mono">NORTH_GREEN</code> directly to{' '}
            <code className="font-mono">EMERGENCY_EAST_GREEN</code>. Instead, it steps{' '}
            <code className="font-mono">NORTH_GREEN → NORTH_YELLOW → ALL_RED_E → EMERGENCY_PREPARATION → EMERGENCY_EAST_GREEN</code>
            . Meanwhile, the ambulance visibly waits at the red stop line until Emergency Green opens.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-bold text-slate-900">
            6. How does recovery &amp; multi-emergency queuing work?
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            When the user clicks <strong>Emergency Cleared</strong>, the DFA moves to{' '}
            <code className="font-mono">EMERGENCY_RECOVERY</code> (all signals Red). If another
            verified ambulance is waiting in the deterministic FIFO queue, it enters{' '}
            <code className="font-mono">EMERGENCY_PREPARATION</code> next; otherwise,{' '}
            <code className="font-mono">TIMER</code> returns to <code className="font-mono">ALL_RED</code>{' '}
            and normal traffic resumes.
          </p>
        </div>
      </section>

      {/* Faculty Presentation Module Summary */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-base font-bold text-slate-900">
          Faculty Viva Summary (Two Core Modules)
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold text-blue-800">
              Module 1 · DFA-Based Traffic Signal State Management
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              Contains the formal 5-tuple model, 19×8 deterministic transition table, interactive
              step-by-step DFA simulator, SVG state transition diagram, safety invariant verifier,
              and invalid-input rejection proof.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold text-blue-800">
              Module 2 · Ambulance Movement &amp; Traffic Signal Simulation
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              Contains the simulated ambulance credential verification gate (SQLite-backed), the
              animated four-way intersection connected strictly to backend DFA states, FIFO
              multi-emergency queue, and full SQLite event audit history.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
