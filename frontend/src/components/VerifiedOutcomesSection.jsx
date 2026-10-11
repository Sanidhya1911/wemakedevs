import React, { useState } from 'react';
import { 
  ShieldCheck, 
  PlusCircle, 
  Lock, 
  Database, 
  Activity,
  PhoneCall,
  Droplets,
  Waves
} from 'lucide-react';
import { api } from '../api';

export default function VerifiedOutcomesSection({ outcomes = [], wards = [], onOutcomeRecorded }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    ward_id: wards[0]?.id || 'W1',
    measurement_date: new Date().toISOString().slice(0, 10),
    hazard_type: 'heat',
    measurement_window_hours: 24,
    hospital_heat_admissions: 0,
    mortality_count: 0,
    emergency_108_calls: 0,
    water_scarcity_complaints: 0,
    waterlogging_depth_cm: '',
    data_source: 'AMC_HEALTH_SURVEILLANCE',
    provenance: 'REAL',
    data_quality_score: 1.0,
    verification_notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const realCount = outcomes.filter(o => o.provenance === 'REAL').length;
  const simCount = outcomes.filter(o => o.provenance === 'SIMULATED').length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ward_id: form.ward_id,
        measurement_date: form.measurement_date,
        hazard_type: form.hazard_type,
        measurement_window_hours: Number(form.measurement_window_hours),
        hospital_heat_admissions: Number(form.hospital_heat_admissions || 0),
        mortality_count: Number(form.mortality_count || 0),
        emergency_108_calls: Number(form.emergency_108_calls || 0),
        water_scarcity_complaints: Number(form.water_scarcity_complaints || 0),
        waterlogging_depth_cm: form.waterlogging_depth_cm !== '' ? Number(form.waterlogging_depth_cm) : undefined,
        data_source: form.data_source,
        provenance: form.provenance,
        data_quality_score: Number(form.data_quality_score),
        verification_notes: form.verification_notes ? form.verification_notes.trim() : undefined
      };

      await api.recordOutcome(payload);
      setShowAddModal(false);
      if (onOutcomeRecorded) onOutcomeRecorded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-xs mb-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-primary">Ground-Truth Municipal Outcomes</h3>
            <p className="text-xs text-on-surface-variant">
              Aggregated post-intervention civic observations from AMC Health Surveillance, 108 Emergency Services, and CCRS 155303
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 items-center">
          <button 
            onClick={() => setShowAddModal(true)}
            className="h-8 px-3.5 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-[#1B5742] shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle size={15} /> Log Municipal Outcome
          </button>
        </div>
      </div>

      {/* Privacy Guarantee & Stats Bar */}
      <div className="flex justify-between items-center flex-wrap gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-100/60 text-emerald-800 border border-emerald-200">
            <Lock size={14} />
          </div>
          <div>
            <div className="text-xs font-bold text-primary">
              Privacy &amp; Non-PII Compliance Verified
            </div>
            <div className="text-[11px] text-outline">
              All records are strictly aggregate ward counts. Names, contact numbers, and patient IDs are rejected at the API barrier.
            </div>
          </div>
        </div>

        <div className="flex gap-3 items-center text-xs">
          <span className="text-outline">
            Total Observations: <strong className="text-on-surface">{outcomes.length}</strong>
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {realCount} Empirical Real
          </span>
          {simCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
              {simCount} Demo Simulated
            </span>
          )}
        </div>
      </div>

      {/* Table / Empty State */}
      {outcomes.length === 0 ? (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-xl text-center">
          <Database className="w-10 h-10 text-slate-400 mb-2" />
          <h4 className="text-sm font-bold text-on-surface mb-1">No Verified Outcomes Recorded</h4>
          <p className="max-w-md text-xs text-on-surface-variant mb-3">
            Ground-truth hospital admissions, 108 emergency calls, and water complaint logs have not been ingested yet.
          </p>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="h-8 px-3.5 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-[#1B5742] shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle size={14} /> Submit First Municipal Observation
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono text-outline uppercase tracking-wider">
                <th className="py-2.5 px-3.5 font-semibold text-slate-700">Outcome ID</th>
                <th className="py-2.5 px-3.5 font-semibold text-slate-700">Ward</th>
                <th className="py-2.5 px-3.5 font-semibold text-slate-700">Measurement Date</th>
                <th className="py-2.5 px-3.5 font-semibold text-slate-700">Domain</th>
                <th className="py-2.5 px-3.5 font-semibold text-slate-700">Observed Health &amp; Civic Indicators</th>
                <th className="py-2.5 px-3.5 font-semibold text-slate-700">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {outcomes.map(o => (
                <tr key={o.outcome_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3.5 font-mono text-xs font-bold text-primary">
                    {o.outcome_id}
                  </td>
                  <td className="py-3 px-3.5 font-semibold text-on-surface">
                    {o.ward_name || o.ward_id}
                  </td>
                  <td className="py-3 px-3.5 font-mono text-xs text-outline">
                    {(o.measurement_date || '').slice(0, 10)}
                    <span className="text-[10px] text-slate-400 block font-sans">
                      Window: {o.measurement_window_hours || 24}h
                    </span>
                  </td>
                  <td className="py-3 px-3.5 capitalize text-on-surface-variant font-medium">
                    {o.hazard_type}
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="flex flex-col gap-1 text-xs">
                      {o.hospital_heat_admissions > 0 && (
                        <div className="flex items-center gap-1.5 text-rose-700 font-medium">
                          <Activity size={13} />
                          <span><strong>{o.hospital_heat_admissions}</strong> heatstroke inpatient cases</span>
                        </div>
                      )}
                      {o.emergency_108_calls > 0 && (
                        <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                          <PhoneCall size={13} />
                          <span><strong>{o.emergency_108_calls}</strong> 108 ambulance dispatches</span>
                        </div>
                      )}
                      {o.water_scarcity_complaints > 0 && (
                        <div className="flex items-center gap-1.5 text-sky-700 font-medium">
                          <Droplets size={13} />
                          <span><strong>{o.water_scarcity_complaints}</strong> CCRS 155303 complaints</span>
                        </div>
                      )}
                      {o.waterlogging_depth_cm !== null && o.waterlogging_depth_cm !== undefined && (
                        <div className="flex items-center gap-1.5 text-teal-700 font-medium">
                          <Waves size={13} />
                          <span><strong>{o.waterlogging_depth_cm} cm</strong> flood surcharge depth</span>
                        </div>
                      )}
                      {o.hospital_heat_admissions === 0 && o.emergency_108_calls === 0 && o.water_scarcity_complaints === 0 && !o.waterlogging_depth_cm && (
                        <span className="text-emerald-700 text-xs font-semibold">✓ Zero adverse events reported</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-11 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${(o.data_quality_score || 1.0) >= 0.8 ? 'bg-emerald-600' : 'bg-amber-500'}`}
                          style={{ width: `${Math.round((o.data_quality_score || 1.0) * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-outline font-semibold">
                        {Math.round((o.data_quality_score || 1.0) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Outcome Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content p-6 max-w-xl">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
              <h3 className="text-base font-bold text-primary">
                Ingest Verified Ground-Truth Outcome
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-xs text-emerald-800 mb-4">
              🔒 <strong>Non-PII Enforcement Active:</strong> Record only aggregate municipal metrics. Any personal names or telephone numbers will trigger strict rejection.
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 mb-4 font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ahmedabad Ward *
                  </label>
                  <select 
                    value={form.ward_id}
                    onChange={e => setForm({ ...form, ward_id: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {wards.map(w => (
                      <option key={w.id || w.name} value={w.id || w.name}>
                        {w.name} ({w.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Measurement Date *
                  </label>
                  <input 
                    type="date"
                    required
                    value={form.measurement_date}
                    onChange={e => setForm({ ...form, measurement_date: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hazard Domain *
                  </label>
                  <select 
                    value={form.hazard_type}
                    onChange={e => setForm({ ...form, hazard_type: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="heat">Heatwave Surveillance</option>
                    <option value="waterlogging">Waterlogging / Pluvial Flood</option>
                    <option value="water_shortage">Potable Water Deficit</option>
                    <option value="compound">Compound Multi-Hazard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Measurement Window
                  </label>
                  <select 
                    value={form.measurement_window_hours}
                    onChange={e => setForm({ ...form, measurement_window_hours: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value={24}>24 Hours Aggregate</option>
                    <option value={48}>48 Hours Post-Event</option>
                    <option value={72}>72 Hours Evaluation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Hospital Heat Inpatients (cases)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    value={form.hospital_heat_admissions}
                    onChange={e => setForm({ ...form, hospital_heat_admissions: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    108 Ambulance Dispatches (calls)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    value={form.emergency_108_calls}
                    onChange={e => setForm({ ...form, emergency_108_calls: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Water Complaints (CCRS 155303)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    value={form.water_scarcity_complaints}
                    onChange={e => setForm({ ...form, water_scarcity_complaints: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Waterlogging Depth (cm)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Optional cm"
                    value={form.waterlogging_depth_cm}
                    onChange={e => setForm({ ...form, waterlogging_depth_cm: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Verification Audit Notes
                </label>
                <input 
                  type="text"
                  placeholder="Official surveillance reference or hospital ward notice"
                  value={form.verification_notes}
                  onChange={e => setForm({ ...form, verification_notes: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-[#1B5742] shadow-xs cursor-pointer disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? 'Recording...' : 'Persist Municipal Observation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
