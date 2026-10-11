import React from 'react';
import { 
  History, 
  AlertTriangle, 
  FileText, 
  DatabaseZap
} from 'lucide-react';

export default function PerformanceTrendsSection({ evaluations = [], predictions = [], outcomes = [], wards = [] }) {
  // Compute known data gaps
  const wardsWithFewObservations = wards.filter(w => {
    const realForWard = outcomes.filter(o => o.ward_id === w.id && o.provenance === 'REAL');
    return realForWard.length < 3;
  });

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-xs mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 flex items-center justify-center font-bold">
          <History size={20} />
        </div>
        <div>
          <h3 className="text-base font-bold text-primary">Performance Trends &amp; Data Gaps</h3>
          <p className="text-xs text-on-surface-variant">
            Audit trail of historical model evaluation runs and transparent disclosure of observational coverage deficits
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Left Column: Data Gap Disclosures */}
        <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-3 text-amber-800">
            <AlertTriangle size={18} />
            <h4 className="text-sm font-bold text-on-surface">Identified Municipal Data Gaps</h4>
          </div>

          <div className="flex flex-col gap-2.5 text-xs">
            <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-lg">
              <div className="text-amber-900 font-semibold mb-1">
                Sparse Ward Surveillance ({wardsWithFewObservations.length} of {wards.length} Wards)
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Wards with fewer than 3 verified real observations cannot reliably calibrate vulnerability priors. The learning engine strictly enforces an N ≥ 3 threshold before proposing updates.
              </p>
              {wardsWithFewObservations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {wardsWithFewObservations.slice(0, 8).map(w => (
                    <span key={w.id} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-700 font-medium">
                      {w.name} ({w.id})
                    </span>
                  ))}
                  {wardsWithFewObservations.length > 8 && (
                    <span className="text-[10px] text-outline self-center font-semibold">
                      +{wardsWithFewObservations.length - 8} more
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="bg-sky-50/60 border border-sky-200 p-3 rounded-lg">
              <div className="text-sky-900 font-semibold mb-1">
                Counterfactual Control Limitations
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Difference-in-Differences causal estimates require an un-intervened comparison ward measured contemporaneously. In citywide heat alerts where all wards receive shade/hydration, causal estimation falls back to correlational before-and-after tracking.
              </p>
            </div>

            <div className="bg-purple-50/60 border border-purple-200 p-3 rounded-lg">
              <div className="text-purple-900 font-semibold mb-1">
                Synthetic Data Isolation
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Simulated demonstration data ({outcomes.filter(o => o.provenance === 'SIMULATED').length} records) is isolated in audit tables and prevented from contributing to real-world model parameter updates.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Historical Evaluation Runs */}
        <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-3 text-primary">
            <DatabaseZap size={18} />
            <h4 className="text-sm font-bold text-on-surface">Historical Model Evaluation Runs</h4>
          </div>

          {evaluations.length === 0 ? (
            <div className="text-center py-8 text-outline">
              <FileText size={28} className="mx-auto mb-2 opacity-50" />
              <div className="text-xs font-semibold text-on-surface">No Evaluation History Yet</div>
              <p className="text-[11px] text-outline mt-1 max-w-xs mx-auto">
                Click "Run Statistical Evaluation" in the accuracy section above to generate the first evaluation audit report.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
              {evaluations.map(ev => (
                <div 
                  key={ev.evaluation_id} 
                  className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center shadow-2xs hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="font-mono text-xs font-bold text-primary">
                      {ev.evaluation_id}
                    </div>
                    <div className="text-[11px] text-outline mt-0.5">
                      {(ev.timestamp || '').slice(0, 16).replace('T', ' ')} UTC • Window: {ev.eval_window_days}d
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Real Pairs: <strong>{ev.sample_count_real}</strong> | Excluded: {ev.sample_count_excluded}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-outline uppercase font-semibold">Overall MAE</div>
                    <div className={`text-base font-bold font-mono ${
                      ev.overall_mae !== null ? (ev.overall_mae <= 12 ? 'text-emerald-800' : 'text-amber-800') : 'text-slate-400'
                    }`}>
                      {ev.overall_mae !== null ? `${ev.overall_mae} pts` : 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
