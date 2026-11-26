import { useEffect, useState } from 'react';
import type { AmbulanceCredential, LiveSystemSnapshot } from '../shared/dfaTypes.ts';
import { api } from '../lib/api.ts';
import type { PageId } from './HomeDashboard.tsx';
import { AlertCircle, CheckCircle2, Info, LogOut, ShieldCheck } from 'lucide-react';

interface VerificationPageProps {
  snapshot: LiveSystemSnapshot;
  onStateChange: (snapshot: LiveSystemSnapshot) => void;
  onRefreshHistory: () => void;
  onNavigate: (page: PageId) => void;
}

export function VerificationPage({
  snapshot,
  onStateChange,
  onRefreshHistory,
  onNavigate,
}: VerificationPageProps) {
  const [ambulances, setAmbulances] = useState<AmbulanceCredential[]>([]);
  const [driverName, setDriverName] = useState('Ravi Kumar');
  const [driverId, setDriverId] = useState('DRV-101');
  const [vehicleId, setVehicleId] = useState('AMB-101');
  const [resultBanner, setResultBanner] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .getAmbulances()
      .then((res) => setAmbulances(res.ambulances))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResultBanner(null);
    try {
      const res = await api.verifyEmergency({ driverName, driverId, vehicleId });
      onStateChange(res.snapshot);
      onRefreshHistory();
      setResultBanner({ ok: true, message: res.message });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed.';
      setResultBanner({ ok: false, message: msg });
      const fresh = await api.getState();
      onStateChange(fresh);
      onRefreshHistory();
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    const res = await api.logoutVerification();
    onStateChange(res.snapshot);
    setResultBanner({
      ok: false,
      message: 'Verification session cleared. Emergency triggers are now locked again.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Academic Disclaimer */}
      <section className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-950">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
        <div>
          <strong>Simulated Verification Notice:</strong> This module demonstrates role-based
          emergency credential verification using sample project records stored in SQLite. It is for
          academic Theory of Computation demonstration only and is not connected to real-world
          hospital or municipal dispatch systems.
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Verification Form */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Ambulance &amp; Driver Verification Gate
              </h2>
              <p className="text-xs text-slate-500">
                Only verified accounts can convert emergency requests into DFA inputs.
              </p>
            </div>
            <ShieldCheck className="h-6 w-6 text-blue-700" aria-hidden="true" />
          </div>

          {snapshot.verification.verified && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900">
              <div>
                <div className="font-bold">Active Verified Session</div>
                <div className="mt-0.5">
                  {snapshot.verification.driverName} · {snapshot.verification.driverId} ·{' '}
                  {snapshot.verification.vehicleId} ({snapshot.verification.organization})
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('simulation')}
                  className="rounded-lg bg-emerald-700 px-3 py-1.5 font-semibold text-white hover:bg-emerald-800 whitespace-nowrap"
                >
                  Open Simulation
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 font-semibold text-emerald-900 hover:bg-emerald-100 whitespace-nowrap"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Revoke</span>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="driverName" className="block text-xs font-semibold text-slate-700">
                Driver Name
              </label>
              <input
                id="driverName"
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="driverId" className="block text-xs font-semibold text-slate-700">
                  Driver ID
                </label>
                <input
                  id="driverId"
                  type="text"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="vehicleId" className="block text-xs font-semibold text-slate-700">
                  Vehicle ID
                </label>
                <input
                  id="vehicleId"
                  type="text"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60 whitespace-nowrap"
              >
                {submitting ? 'Verifying...' : 'Verify Ambulance Credentials'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDriverName('Ravi Kumar');
                  setDriverId('DRV-101');
                  setVehicleId('AMB-101');
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                Fill Valid Sample (Ravi Kumar)
              </button>
              <button
                type="button"
                onClick={() => {
                  setDriverName('Vikram Rao');
                  setDriverId('DRV-999');
                  setVehicleId('AMB-999');
                }}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100 whitespace-nowrap"
              >
                Fill Suspended Sample
              </button>
            </div>
          </form>

          {resultBanner && (
            <div
              className={`mt-4 flex items-start gap-2 rounded-lg border p-3 text-xs ${
                resultBanner.ok
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-red-200 bg-red-50 text-red-900'
              }`}
            >
              {resultBanner.ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <div>
                <div className="font-semibold">{resultBanner.message}</div>
                <div className="mt-0.5 text-[11px] opacity-85">
                  Current DFA Signal State: <span className="font-mono">{snapshot.currentState}</span>{' '}
                  {!resultBanner.ok && '(Unchanged)'}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Sample Database Records */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6">
          <h3 className="text-base font-bold text-slate-900">
            Sample Ambulance Registry (SQLite Database)
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Click any row to load its credentials into the verification form for live testing.
          </p>

          <div className="mt-4 space-y-3">
            {ambulances.map((amb) => {
              const isAuth = amb.accountStatus === 'Authorized';
              return (
                <button
                  key={amb.id}
                  type="button"
                  onClick={() => {
                    setDriverName(amb.driverName);
                    setDriverId(amb.driverId);
                    setVehicleId(amb.vehicleId);
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition-colors hover:border-blue-400 hover:bg-blue-50/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900">{amb.driverName}</span>
                    <span
                      className={`font-mono text-xs font-bold ${
                        isAuth ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {amb.accountStatus}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-3">
                    <div>
                      Driver ID: <span className="font-mono font-semibold">{amb.driverId}</span>
                    </div>
                    <div>
                      Vehicle ID: <span className="font-mono font-semibold">{amb.vehicleId}</span>
                    </div>
                    <div>Type: {amb.vehicleType}</div>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Organization: {amb.organization}</div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
