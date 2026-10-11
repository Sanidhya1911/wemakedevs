import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  TrendingUp, 
  ClipboardCheck, 
  CheckCircle2, 
  BarChart3, 
  History, 
  GitPullRequest, 
  GitCommit, 
  RefreshCw, 
  AlertCircle
} from 'lucide-react';
import { api } from '../api';
import RiskTimeSeriesSection from './RiskTimeSeriesSection';
import InterventionHistorySection from './InterventionHistorySection';
import VerifiedOutcomesSection from './VerifiedOutcomesSection';
import PerformanceMetricsSection from './PerformanceMetricsSection';
import PerformanceTrendsSection from './PerformanceTrendsSection';
import ProposedUpdatesSection from './ProposedUpdatesSection';
import ModelVersionsSection from './ModelVersionsSection';
import ImpactVerificationModal from './ImpactVerificationModal';
import DemoDataHelper from './DemoDataHelper';

export default function LearningLoopDashboard() {
  const [activeTab, setActiveTab] = useState('timeseries'); // 'timeseries', 'actions', 'outcomes', 'metrics', 'trends', 'proposals', 'versions'
  
  // Data State
  const [predictions, setPredictions] = useState([]);
  const [actions, setActions] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [versions, setVersions] = useState([]);
  const [activeParams, setActiveParams] = useState(null);
  const [wards, setWards] = useState([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('CONNECTING');
  const [verifyingAction, setVerifyingAction] = useState(null);

  // Fetch all Learning Loop data
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Health check
      const health = await api.checkHealth();
      setBackendStatus(health.status === 'OPERATIONAL' ? 'ONLINE' : 'OFFLINE');

      // 2. Fetch parallel datasets
      const [
        predsRes,
        actionsRes,
        outcomesRes,
        evalsRes,
        propsRes,
        versRes,
        activeRes,
        wardsRes
      ] = await Promise.all([
        api.getPredictions({ limit: 300 }).catch(() => ({ predictions: [] })),
        api.getActions({ limit: 200 }).catch(() => ({ actions: [] })),
        api.getOutcomes({ limit: 200 }).catch(() => ({ outcomes: [] })),
        api.getEvaluations(20).catch(() => ({ evaluations: [] })),
        api.getProposals().catch(() => ({ proposals: [] })),
        api.getVersions().catch(() => ({ versions: [] })),
        api.getActiveParameters().catch(() => null),
        api.getWards().catch(() => ({ wards: [] }))
      ]);

      setPredictions(predsRes.predictions || []);
      setActions(actionsRes.actions || []);
      setOutcomes(outcomesRes.outcomes || []);
      setEvaluations(evalsRes.evaluations || []);
      setProposals(propsRes.proposals || []);
      setVersions(versRes.versions || []);
      setActiveParams(activeRes);
      setWards(wardsRes.wards || []);
    } catch (err) {
      setError(err.message);
      setBackendStatus('OFFLINE');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const latestEvaluation = evaluations[0] || null;
  const pendingProposalsCount = proposals.filter(p => p.status === 'PENDING_APPROVAL').length;
  const realOutcomesCount = outcomes.filter(o => o.provenance === 'REAL').length;

  return (
    <div className="space-y-6">
      {/* Page Header (Matches Other App Pages) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-outline-variant">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-outline mb-0.5 uppercase tracking-wider">
            <span>AMC Command Center</span>
            <span>/</span>
            <span className="text-primary font-bold">Learning Loop & Model Governance</span>
          </div>
          <h1 className="text-headline-md font-headline-md text-primary font-bold">
            ClimateShield Learning Loop
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Ahmedabad Municipal Corporation Closed-Loop Calibration &amp; Model Governance
          </p>
        </div>

        {/* Status Indicators & Refresh */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${backendStatus === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className={backendStatus === 'ONLINE' ? 'text-emerald-800 font-semibold' : 'text-rose-800 font-semibold'}>
              {backendStatus === 'ONLINE' ? 'FastAPI Connected' : 'Backend Offline'}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant text-xs font-mono">
            <span className="text-outline">Active Model:</span>
            <span className="text-primary font-bold">{activeParams?.version_id || 'v1.0.0'}</span>
          </div>

          <button
            onClick={loadAllData}
            disabled={loading}
            className="h-9 px-4 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-[#1B5742] shadow-sm transition-all cursor-pointer disabled:opacity-60"
            title="Reload live database records"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Demo Controls Bar */}
      <DemoDataHelper onDataChanged={loadAllData} />

      {/* Global Summary KPI Bar (5-Card Grid matching ImpactVerificationPage) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-outline uppercase tracking-wider font-bold">
              RISK PREDICTIONS
            </span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200">
              <span className="material-symbols-outlined text-[18px]">query_stats</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="text-display-lg font-display-lg text-primary font-bold leading-none tabular-nums">
              {predictions.length}
            </div>
            <div className="text-title-sm font-title-sm text-on-surface mt-1 font-semibold">
              Forecast Records
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
            <span className="text-outline">Database Archive</span>
            <span className="text-primary font-semibold">Live Stored</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-outline uppercase tracking-wider font-bold">
              DISPATCHED ACTIONS
            </span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
              <span className="material-symbols-outlined text-[18px]">campaign</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="text-display-lg font-display-lg text-indigo-800 font-bold leading-none tabular-nums">
              {actions.length}
            </div>
            <div className="text-title-sm font-title-sm text-on-surface mt-1 font-semibold">
              Municipal Interventions
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
            <span className="text-outline">Execution Status</span>
            <span className="text-emerald-800 font-semibold">{actions.filter(a => a.execution_status === 'COMPLETED').length} Completed</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-outline uppercase tracking-wider font-bold">
              OBSERVED OUTCOMES
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="text-display-lg font-display-lg text-emerald-800 font-bold leading-none tabular-nums">
              {outcomes.length}
            </div>
            <div className="text-title-sm font-title-sm text-on-surface mt-1 font-semibold">
              Ground-Truth Observations
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
            <span className="text-outline">Verified Real</span>
            <span className="text-emerald-800 font-semibold">{realOutcomesCount} Non-PII</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-outline uppercase tracking-wider font-bold">
              CALIBRATION STATUS
            </span>
            <span className={`p-1.5 rounded-lg border ${pendingProposalsCount > 0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
              <span className="material-symbols-outlined text-[18px]">tune</span>
            </span>
          </div>
          <div className="mt-2">
            <div className={`text-display-lg font-display-lg font-bold leading-none tabular-nums ${pendingProposalsCount > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
              {pendingProposalsCount > 0 ? `${pendingProposalsCount} Staged` : 'Stable'}
            </div>
            <div className="text-title-sm font-title-sm text-on-surface mt-1 font-semibold">
              Parameter Consensus
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
            <span className="text-outline">Governance</span>
            <span className={pendingProposalsCount > 0 ? 'text-amber-800 font-semibold' : 'text-emerald-800 font-semibold'}>
              {pendingProposalsCount > 0 ? 'Pending sign-off' : 'In Consensus'}
            </span>
          </div>
        </div>
      </section>

      {/* Tab Navigation Strip (Clean Light UI) */}
      <div className="flex items-center gap-1.5 bg-surface-container-lowest p-1.5 rounded-xl border border-outline-variant overflow-x-auto shadow-xs">
        {[
          { id: 'timeseries', label: 'Predicted vs. Observed Risk', icon: TrendingUp },
          { id: 'actions', label: `Intervention History (${actions.length})`, icon: ClipboardCheck },
          { id: 'outcomes', label: `Verified Outcomes (${outcomes.length})`, icon: CheckCircle2 },
          { id: 'metrics', label: 'Multi-Hazard Accuracy', icon: BarChart3 },
          { id: 'trends', label: 'Trends & Data Gaps', icon: History },
          { id: 'proposals', label: 'Proposed Updates', icon: GitPullRequest, badge: pendingProposalsCount },
          { id: 'versions', label: `Model Versions (${versions.length})`, icon: GitCommit },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-slate-100'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white text-primary' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-error">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span className="font-mono"><strong>Backend Connection Notice:</strong> {error}</span>
          </div>
          <button
            onClick={loadAllData}
            className="px-3 py-1 bg-white border border-red-300 rounded font-mono font-bold hover:bg-red-50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Active Tab View */}
      {activeTab === 'timeseries' && (
        <RiskTimeSeriesSection 
          predictions={predictions}
          outcomes={outcomes}
          wards={wards}
        />
      )}

      {activeTab === 'actions' && (
        <InterventionHistorySection 
          actions={actions}
          onActionUpdated={loadAllData}
          onOpenVerifyModal={(act) => setVerifyingAction(act)}
        />
      )}

      {activeTab === 'outcomes' && (
        <VerifiedOutcomesSection 
          outcomes={outcomes}
          wards={wards}
          onOutcomeRecorded={loadAllData}
        />
      )}

      {activeTab === 'metrics' && (
        <PerformanceMetricsSection 
          latestEvaluation={latestEvaluation}
          onEvaluationTriggered={loadAllData}
        />
      )}

      {activeTab === 'trends' && (
        <PerformanceTrendsSection 
          evaluations={evaluations}
          predictions={predictions}
          outcomes={outcomes}
          wards={wards}
        />
      )}

      {activeTab === 'proposals' && (
        <ProposedUpdatesSection 
          proposals={proposals}
          onProposalUpdated={loadAllData}
        />
      )}

      {activeTab === 'versions' && (
        <ModelVersionsSection 
          versions={versions}
          activeVersion={activeParams}
          onVersionRollback={loadAllData}
        />
      )}

      {/* Impact Verification Modal */}
      {verifyingAction && (
        <ImpactVerificationModal 
          action={verifyingAction}
          wards={wards}
          onClose={() => setVerifyingAction(null)}
        />
      )}
    </div>
  );
}
