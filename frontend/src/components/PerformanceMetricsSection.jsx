import React, { useState } from 'react';
import { 
  BarChart3, 
  Flame, 
  Droplet, 
  Waves, 
  RefreshCw, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { api } from '../api';

export default function PerformanceMetricsSection({ latestEvaluation, onEvaluationTriggered }) {
  const [runningEval, setRunningEval] = useState(false);
  const [evalMsg, setEvalMsg] = useState(null);

  const handleRunEvaluation = async () => {
    setRunningEval(true);
    setEvalMsg(null);
    try {
      const res = await api.runEvaluation({
        eval_window_days: 30,
        min_samples: 3,
        exclude_simulated: true
      });
      setEvalMsg({ type: 'success', text: `Evaluation complete! Status: ${res.status}. Real pairs evaluated: ${res.sample_counts?.verified_real_pairs || 0}` });
      if (onEvaluationTriggered) onEvaluationTriggered();
    } catch (err) {
      setEvalMsg({ type: 'error', text: err.message });
    } finally {
      setRunningEval(false);
    }
  };

  const heatMetrics = latestEvaluation?.heat_metrics || latestEvaluation?.accuracy_by_hazard?.heat;
  const floodMetrics = latestEvaluation?.waterlogging_metrics || latestEvaluation?.accuracy_by_hazard?.waterlogging;
  const shortageMetrics = latestEvaluation?.water_shortage_metrics || latestEvaluation?.accuracy_by_hazard?.water_shortage;

  const renderMetricCard = (title, icon, metrics, colorTheme) => {
    const hasData = metrics && metrics.sample_count > 0 && metrics.status !== 'INSUFFICIENT_DATA';

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4.5 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-colors">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${colorTheme.bg} ${colorTheme.color}`}>
                {icon}
              </div>
              <h4 className="text-sm font-bold text-on-surface">{title}</h4>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              hasData ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {hasData ? `${metrics.sample_count} Samples` : 'Insufficient Data'}
            </span>
          </div>

          {/* Metrics Values */}
          {hasData ? (
            <div>
              <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="text-[11px] text-outline font-semibold">MAE (Mean Error)</div>
                  <div className="text-lg font-bold font-mono text-primary mt-0.5">
                    {metrics.mae} <span className="text-[11px] text-outline font-sans">pts</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="text-[11px] text-outline font-semibold">RMSE (Root Mean Sq)</div>
                  <div className="text-lg font-bold font-mono text-primary mt-0.5">
                    {metrics.rmse} <span className="text-[11px] text-outline font-sans">pts</span>
                  </div>
                </div>
              </div>

              {/* Classification Metrics */}
              <div className="grid grid-cols-3 gap-1.5 mb-3.5">
                <div className="text-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-outline font-semibold uppercase">Precision</div>
                  <div className="text-sm font-bold font-mono text-sky-800 mt-0.5">
                    {Math.round((metrics.precision || 0) * 100)}%
                  </div>
                </div>
                <div className="text-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-outline font-semibold uppercase">Recall</div>
                  <div className="text-sm font-bold font-mono text-emerald-800 mt-0.5">
                    {Math.round((metrics.recall || 0) * 100)}%
                  </div>
                </div>
                <div className="text-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-outline font-semibold uppercase">F1 Score</div>
                  <div className="text-sm font-bold font-mono text-amber-800 mt-0.5">
                    {metrics.f1_score ?? '0.00'}
                  </div>
                </div>
              </div>

              {/* Confusion Matrix Breakdown */}
              {metrics.confusion_matrix && (
                <div className="text-[11px] text-on-surface-variant bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex justify-between">
                    <span>True Positives (Correct alerts):</span>
                    <strong className="text-emerald-800 font-mono">{metrics.confusion_matrix.true_positives}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>False Positives (Unneeded alerts):</span>
                    <strong className="text-amber-800 font-mono">{metrics.confusion_matrix.false_positives}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>False Negatives (Missed spikes):</span>
                    <strong className="text-rose-800 font-mono">{metrics.confusion_matrix.false_negatives}</strong>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 text-center text-outline">
              <AlertTriangle size={24} className="text-amber-600 mx-auto mb-2 opacity-80" />
              <div className="text-xs font-semibold text-on-surface mb-1">
                Evidence Below Threshold
              </div>
              <p className="text-[11px] text-outline">
                Requires minimum 3 verified real observations to compute statistical accuracy. Simulated demonstration data is excluded.
              </p>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-outline font-mono">
          Alert boundary: Risk score ≥ 50 pts
        </div>
      </div>
    );
  };

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-xs mb-6">
      {/* Header and Trigger Button */}
      <div className="flex justify-between items-start flex-wrap gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-bold">
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-primary">Multi-Hazard Prediction Accuracy Metrics</h3>
            <p className="text-xs text-on-surface-variant">
              Separately evaluates Heatwave, Pluvial Flood, and Water Scarcity models against verified municipal outcomes
            </p>
          </div>
        </div>

        <button 
          onClick={handleRunEvaluation}
          disabled={runningEval}
          className="h-8 px-3.5 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-[#1B5742] shadow-xs cursor-pointer disabled:opacity-60 transition-all"
        >
          <RefreshCw size={14} className={runningEval ? 'animate-spin' : ''} />
          <span>{runningEval ? 'Evaluating Real Pairs...' : 'Run Statistical Evaluation'}</span>
        </button>
      </div>

      {/* Evaluation Feedback Message */}
      {evalMsg && (
        <div className={`p-3 rounded-xl border text-xs mb-4.5 font-medium ${
          evalMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {evalMsg.text}
        </div>
      )}

      {/* Epistemic Guardrail Notice */}
      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-5 text-xs text-on-surface-variant">
        <Info size={16} className="text-primary shrink-0" />
        <span>
          <strong>Scientific Integrity Guardrail:</strong> Accuracy metrics are computed strictly against empirical real observations. Simulated data and incomplete actions are safely filtered out to prevent artificial metric inflation.
        </span>
      </div>

      {/* Hazard-Specific Accuracy Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderMetricCard(
          'Heatwave Risk Accuracy',
          <Flame size={18} />,
          heatMetrics,
          { bg: 'bg-rose-50', color: 'text-rose-800' }
        )}

        {renderMetricCard(
          'Waterlogging / Flood Accuracy',
          <Waves size={18} />,
          floodMetrics,
          { bg: 'bg-teal-50', color: 'text-teal-800' }
        )}

        {renderMetricCard(
          'Water Shortage Accuracy',
          <Droplet size={18} />,
          shortageMetrics,
          { bg: 'bg-sky-50', color: 'text-sky-800' }
        )}
      </div>
    </div>
  );
}
