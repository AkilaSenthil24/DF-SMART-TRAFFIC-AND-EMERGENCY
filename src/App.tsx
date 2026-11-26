import { useCallback, useEffect, useState } from 'react';
import type {
  DfaDefinition,
  LiveSystemSnapshot,
  TransitionEventRecord,
} from './shared/dfaTypes.ts';
import { api } from './lib/api.ts';
import { HomeDashboard, type PageId } from './pages/HomeDashboard.tsx';
import { StateManagementPage } from './pages/StateManagementPage.tsx';
import { DfaSimulatorPage } from './pages/DfaSimulatorPage.tsx';
import { TransitionTablePage } from './pages/TransitionTablePage.tsx';
import { StateDiagramPage } from './pages/StateDiagramPage.tsx';
import { LiveSimulationPage } from './pages/LiveSimulationPage.tsx';
import { VerificationPage } from './pages/VerificationPage.tsx';
import { EventHistoryPage } from './pages/EventHistoryPage.tsx';
import { ProjectInfoPage } from './pages/ProjectInfoPage.tsx';
import {
  Activity,
  BookOpen,
  Cpu,
  GitBranch,
  History,
  LayoutDashboard,
  Menu,
  Navigation,
  ShieldCheck,
  TableProperties,
  X,
} from 'lucide-react';

interface NavGroup {
  heading: string;
  items: { id: PageId; label: string; icon: typeof LayoutDashboard }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'Overview',
    items: [{ id: 'home', label: 'Home Dashboard', icon: LayoutDashboard }],
  },
  {
    heading: 'Module 1 · DFA Management',
    items: [
      { id: 'state-management', label: 'DFA State Management', icon: Cpu },
      { id: 'simulator', label: 'DFA Simulator', icon: Activity },
      { id: 'transition-table', label: 'DFA Transition Table', icon: TableProperties },
      { id: 'state-diagram', label: 'DFA State Diagram', icon: GitBranch },
    ],
  },
  {
    heading: 'Module 2 · Ambulance Sim',
    items: [
      { id: 'simulation', label: 'Live Traffic Simulation', icon: Navigation },
      { id: 'verification', label: 'Emergency Verification', icon: ShieldCheck },
    ],
  },
  {
    heading: 'Logs & Documentation',
    items: [
      { id: 'history', label: 'Event History', icon: History },
      { id: 'project-info', label: 'Project Information', icon: BookOpen },
    ],
  },
];

const PAGE_TITLES: Record<PageId, string> = {
  home: 'Home Dashboard',
  'state-management': 'DFA State Management',
  simulator: 'DFA Simulator',
  'transition-table': 'DFA Transition Table',
  'state-diagram': 'DFA State Diagram',
  simulation: 'Live Traffic Simulation',
  verification: 'Emergency Verification',
  history: 'Event History',
  'project-info': 'Project Information',
};

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [definition, setDefinition] = useState<DfaDefinition | null>(null);
  const [snapshot, setSnapshot] = useState<LiveSystemSnapshot | null>(null);
  const [events, setEvents] = useState<TransitionEventRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshHistory = useCallback(async () => {
    try {
      const res = await api.getHistory('ALL', 200);
      setEvents(res.events);
    } catch (err) {
      console.error('Failed to refresh history', err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        const [def, state, hist] = await Promise.all([
          api.getDefinition(),
          api.getState(),
          api.getHistory('ALL', 200),
        ]);
        if (cancelled) return;
        setDefinition(def);
        setSnapshot(state);
        setEvents(hist.events);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Unable to connect to DFA backend.');
        }
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNavigate = (page: PageId) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  const handleGlobalReset = async () => {
    try {
      const res = await api.resetDfa();
      setSnapshot(res.snapshot);
      refreshHistory();
    } catch (err) {
      console.error(err);
    }
  };

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center">
          <h1 className="text-lg font-bold text-red-700">Backend Connection Error</h1>
          <p className="mt-2 text-sm text-slate-600">{loadError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!definition || !snapshot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="text-sm font-medium text-slate-600">
          Loading Formal DFA Engine and Simulation State...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop Sidebar (Deep Navy) */}
      <aside className="hidden w-64 shrink-0 flex-col bg-[#0B1E3B] text-slate-100 lg:flex">
        <div className="border-b border-slate-800/80 px-5 py-5">
          <button
            type="button"
            onClick={() => handleNavigate('home')}
            className="text-left font-display text-base font-bold tracking-tight text-white whitespace-nowrap"
          >
            DFA Traffic Control
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Primary Sidebar">
          {NAV_GROUPS.map((group) => (
            <div key={group.heading}>
              <div className="px-3 text-[11px] font-semibold tracking-wide text-slate-400">
                {group.heading}
              </div>
              <div className="mt-1.5 space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigate(item.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-800/80 px-5 py-4 text-xs text-slate-300">
          <div className="text-[11px] text-slate-400">Current DFA State</div>
          <div className="mt-0.5 font-mono font-bold text-sky-300">{snapshot.currentState}</div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 flex w-72 flex-col bg-[#0B1E3B] text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <span className="font-display text-base font-bold text-white">DFA Traffic Control</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
              {NAV_GROUPS.map((group) => (
                <div key={group.heading}>
                  <div className="px-3 text-[11px] font-semibold text-slate-400">
                    {group.heading}
                  </div>
                  <div className="mt-1 space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = activePage === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNavigate(item.id)}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium ${
                            active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Clean 3-Zone Top Header */}
        <header className="flex items-center justify-between gap-8 border-b border-slate-200 bg-white px-4 py-3.5 sm:px-6">
          {/* Zone 1: Active Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <span className="truncate font-display text-base font-bold text-slate-900 whitespace-nowrap">
              {PAGE_TITLES[activePage]}
            </span>
          </div>

          {/* Zone 2: Concise Module Links */}
          <nav className="hidden items-center gap-6 text-xs font-medium text-slate-600 md:flex">
            <button
              type="button"
              onClick={() => handleNavigate('home')}
              className={`hover:text-slate-900 whitespace-nowrap shrink-0 ${
                activePage === 'home' ? 'font-semibold text-blue-700' : ''
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('simulator')}
              className={`hover:text-slate-900 whitespace-nowrap shrink-0 ${
                activePage === 'simulator' ? 'font-semibold text-blue-700' : ''
              }`}
            >
              DFA Simulator
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('transition-table')}
              className={`hover:text-slate-900 whitespace-nowrap shrink-0 ${
                activePage === 'transition-table' ? 'font-semibold text-blue-700' : ''
              }`}
            >
              Transition Table
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('simulation')}
              className={`hover:text-slate-900 whitespace-nowrap shrink-0 ${
                activePage === 'simulation' ? 'font-semibold text-blue-700' : ''
              }`}
            >
              Live Simulation
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('verification')}
              className={`hover:text-slate-900 whitespace-nowrap shrink-0 ${
                activePage === 'verification' ? 'font-semibold text-blue-700' : ''
              }`}
            >
              Verification
            </button>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleGlobalReset}
              className="rounded-lg bg-[#0B1E3B] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-900 whitespace-nowrap shrink-0"
            >
              Reset DFA
            </button>
          </div>
        </header>

        {/* Active Page Viewport */}
        <main className="mx-auto w-full max-w-[1320px] flex-1 p-4 sm:p-6">
          {activePage === 'home' && (
            <HomeDashboard
              definition={definition}
              snapshot={snapshot}
              recentEvents={events}
              onNavigate={handleNavigate}
            />
          )}
          {activePage === 'state-management' && (
            <StateManagementPage definition={definition} snapshot={snapshot} />
          )}
          {activePage === 'simulator' && (
            <DfaSimulatorPage
              definition={definition}
              snapshot={snapshot}
              events={events}
              onStateChange={setSnapshot}
              onRefreshHistory={refreshHistory}
            />
          )}
          {activePage === 'transition-table' && (
            <TransitionTablePage definition={definition} snapshot={snapshot} />
          )}
          {activePage === 'state-diagram' && (
            <StateDiagramPage definition={definition} snapshot={snapshot} />
          )}
          {activePage === 'simulation' && (
            <LiveSimulationPage
              snapshot={snapshot}
              onStateChange={setSnapshot}
              onRefreshHistory={refreshHistory}
              onNavigate={handleNavigate}
            />
          )}
          {activePage === 'verification' && (
            <VerificationPage
              snapshot={snapshot}
              onStateChange={setSnapshot}
              onRefreshHistory={refreshHistory}
              onNavigate={handleNavigate}
            />
          )}
          {activePage === 'history' && (
            <EventHistoryPage events={events} onRefreshHistory={refreshHistory} />
          )}
          {activePage === 'project-info' && <ProjectInfoPage />}
        </main>
      </div>
    </div>
  );
}
