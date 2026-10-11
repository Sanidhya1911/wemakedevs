import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle
} from 'lucide-react';
import { api } from '../api';

const getHazardDomain = (type = '') => {
  const t = (type || '').toLowerCase();
  if (t.includes('pump') || t.includes('drain') || t.includes('flood') || t.includes('waterlog')) {
    return { id: 'waterlogging', name: 'Waterlogging & Drainage', badge: '🌊 Waterlogging / Drainage', color: 'bg-teal-50 text-teal-800 border-teal-200' };
  }
  if (t.includes('tanker') || t.includes('scarcity') || t.includes('shortage') || t.includes('potable')) {
    return { id: 'water_shortage', name: 'Water Scarcity & Tankers', badge: '💧 Water Supply & Tankers', color: 'bg-sky-50 text-sky-800 border-sky-200' };
  }
  return { id: 'heat', name: 'Extreme Heat Refuge', badge: '🔥 Heat Risk Mitigation', color: 'bg-rose-50 text-rose-800 border-rose-200' };
};

const getInitialMetric = (type = '') => {
  const domain = getHazardDomain(type);
  if (domain.id === 'waterlogging') return 'waterlogging_depth_cm';
  if (domain.id === 'water_shortage') return 'water_scarcity_complaints';
  return 'hospital_heat_admissions';
};

export default function ImpactVerificationModal({ action, wards = [], onClose }) {
  const domain = getHazardDomain(action?.intervention_type);
  const [controlWard, setControlWard] = useState('W9');
  const [primaryMetric, setPrimaryMetric] = useState(() => getInitialMetric(action?.intervention_type));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRunVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        action_id: action.action_id,
        primary_metric: primaryMetric,
        control_ward_id: controlWard === 'NONE' ? undefined : controlWard
      };
      const res = await api.verifyImpact(payload);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content p-6 max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            <h3 className="text-base font-bold text-primary">
              Intervention Impact Verification
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Target Action Summary */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 text-xs space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-outline">Action ID:</span>
            <span className="font-mono font-bold text-primary">{action.action_id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-outline">Intervention Dispatched:</span>
            <div className="flex items-center gap-1.5">
              <strong className="text-on-surface capitalize font-semibold">
                {action.intervention_type?.replace(/_/g, ' ')}
              </strong>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${domain.color}`}>
                {domain.badge}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-outline">Treated Ward:</span>
            <strong className="text-emerald-800">{action.ward_name || action.ward_id} ({action.ward_id})</strong>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 mb-4 font-mono">
            {error}
          </div>
        )}

        {/* Evaluation Configuration */}
        {!result && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Evaluation Indicator *
              </label>
              <select 
                value={primaryMetric}
                onChange={e => setPrimaryMetric(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="hospital_heat_admissions">Hospital Heatstroke Inpatient Admissions (AMC)</option>
                <option value="emergency_108_calls">108 Emergency Ambulance Heat Dispatches</option>
                <option value="water_scarcity_complaints">Civic CCRS 155303 Water Complaints</option>
                <option value="waterlogging_depth_cm">Waterlogging Depth at Chronic Surcharge Points (cm)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Comparison Control Ward (For Difference-in-Differences Causal Estimation)
              </label>
              <select 
                value={controlWard}
                onChange={e => setControlWard(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="NONE">— Simple Before &amp; After (Correlational Only) —</option>
                {wards.filter(w => w.id !== action.ward_id).map(w => (
                  <option key={w.id || w.name} value={w.id || w.name}>
                    {w.name} ({w.id}) — Control Ward
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-outline mt-1 block">
                Select an un-intervened comparison ward to calculate the net treatment effect and control for background weather changes.
              </span>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button 
                type="button" 
                onClick={onClose}
                className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={handleRunVerification}
                className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-[#1B5742] shadow-xs cursor-pointer disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Evaluating Observations...' : 'Run Impact Verification'}
              </button>
            </div>
          </div>
        )}

        {/* Verification Result Display */}
        {result && (
          <div className="space-y-4">
            <div className={`p-3.5 rounded-xl border ${
              result.status === 'VERIFIED_COMPLETED' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold font-mono">
                  Status: {result.status}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                  Methodology: {result.evaluation_methodology || 'N/A'}
                </span>
              </div>
              <p className="text-xs leading-relaxed mt-1">
                {result.explanation}
              </p>
            </div>

            {/* Causal Attribution Guardrail Disclaimer */}
            <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-lg text-xs text-rose-800">
              <strong>Epistemic Guardrail:</strong> {result.causal_disclaimer || result.disclaimer}
            </div>

            {/* Comparison Metrics if Verified */}
            {result.baseline_measurement && result.followup_measurement && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-outline font-semibold">Baseline Measurement</div>
                  <div className="text-xl font-bold font-mono text-on-surface mt-0.5">
                    {result.baseline_measurement.value}
                  </div>
                  <div className="text-[10px] text-outline mt-0.5 font-mono">
                    Date: {result.baseline_measurement.date}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-outline font-semibold">Follow-up Measurement</div>
                  <div className="text-xl font-bold font-mono text-emerald-800 mt-0.5">
                    {result.followup_measurement.value}
                  </div>
                  <div className="text-[10px] text-outline mt-0.5 font-mono">
                    Date: {result.followup_measurement.date}
                  </div>
                </div>
              </div>
            )}

            {/* DiD Specific Estimate */}
            {result.difference_in_differences && result.difference_in_differences.eligible && (
              <div className="bg-teal-50 border border-teal-200 p-3.5 rounded-xl">
                <div className="text-xs font-bold text-teal-900 mb-1">
                  Net Difference-in-Differences Treatment Effect (vs {result.difference_in_differences.control_ward_id})
                </div>
                <div className="text-xl font-bold font-mono text-teal-900">
                  {result.difference_in_differences.did_estimate} <span className="text-xs font-normal text-teal-700">net units prevented</span>
                </div>
                <div className="text-[11px] text-teal-800 mt-1">
                  95% Confidence Interval: [{result.difference_in_differences.confidence_interval_95?.lower}, {result.difference_in_differences.confidence_interval_95?.upper}]
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button 
                onClick={() => setResult(null)}
                className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Re-evaluate
              </button>
              <button 
                onClick={onClose}
                className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-[#1B5742] shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
