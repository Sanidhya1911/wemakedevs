import React, { useState } from 'react';
import { 
  GitCommit, 
  RotateCcw, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import { api } from '../api';

export default function ModelVersionsSection({ versions = [], activeVersion, onVersionRollback }) {
  const [expandedVersion, setExpandedVersion] = useState(null);
  const [rollbackTarget, setRollbackTarget] = useState(null);
  const [rollbackOfficial, setRollbackOfficial] = useState('AMC Disaster Cell Lead');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleRollback = async (e) => {
    e.preventDefault();
    if (!rollbackTarget) return;
    setLoading(true);
    setError(null);
    try {
      if (!rollbackOfficial.trim()) {
        throw new Error('Authorizing official name is required to execute a model version rollback.');
      }
      await api.rollbackVersion(rollbackTarget.version_id, {
        approved_by: rollbackOfficial.trim()
      });
      setSuccess(`Model rolled back successfully to version ${rollbackTarget.version_id}.`);
      setRollbackTarget(null);
      if (onVersionRollback) onVersionRollback();
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
            <GitCommit size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-primary">Immutable Model Version History</h3>
            <p className="text-xs text-on-surface-variant">
              Append-only audit ledger of production model weights, human sign-offs, and instant rollback capability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-outline">Currently Active:</span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 font-mono">
            <ShieldCheck size={13} /> {activeVersion?.version_id || 'v1.0.0'}
          </span>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium mb-4">
          {success}
        </div>
      )}

      {/* Version History List */}
      <div className="flex flex-col gap-3">
        {versions.map(v => {
          const isActive = v.is_active || v.version_id === activeVersion?.version_id;
          const isExpanded = expandedVersion === v.version_id;
          const offsets = v.parameters?.ward_vulnerability_offsets || {};
          const offsetCount = Object.keys(offsets).length;

          return (
            <div 
              key={v.version_id}
              className={`p-4.5 rounded-xl border transition-all ${
                isActive 
                  ? 'bg-emerald-50/40 border-emerald-300 shadow-2xs' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-center flex-wrap gap-2.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`font-mono font-bold text-sm ${isActive ? 'text-emerald-800' : 'text-on-surface'}`}>
                    {v.version_id}
                  </span>
                  {isActive ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                      Active In Production
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                      Archived
                    </span>
                  )}
                  <span className="text-xs text-outline">
                    Authorized by: <strong className="text-on-surface">{v.approved_by || 'System Genesis'}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-outline">
                    {(v.approved_at || '').slice(0, 16).replace('T', ' ')} UTC
                  </span>
                  {!isActive && (
                    <button 
                      onClick={() => setRollbackTarget(v)}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1"
                      title="Reactivate this vetted model configuration"
                    >
                      <RotateCcw size={12} /> Rollback
                    </button>
                  )}
                  <button 
                    onClick={() => setExpandedVersion(isExpanded ? null : v.version_id)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {v.change_summary || 'Initial production baseline weights and empirical hazard priors.'}
              </p>

              {/* Collapsible Parameter Details */}
              {isExpanded && (
                <div className="mt-3.5 pt-3 border-t border-slate-200">
                  <div className="text-xs font-semibold text-slate-700 mb-2">
                    Active Vulnerability Offsets ({offsetCount} Wards Calibrated):
                  </div>
                  {offsetCount === 0 ? (
                    <div className="text-xs text-outline italic">
                      Standard baseline priors (0.00 offset across all Ahmedabad wards).
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {Object.entries(offsets).map(([ward, val]) => (
                        <span 
                          key={ward} 
                          className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${
                            Number(val) > 0 
                              ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {ward}: {Number(val) > 0 ? `+${val}` : val}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 overflow-x-auto">
                    <pre className="text-[11px] font-mono text-slate-700 m-0">
                      {JSON.stringify(v.parameters, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rollback Confirmation Modal */}
      {rollbackTarget && (
        <div className="modal-overlay">
          <div className="modal-content p-6 max-w-lg">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
              <h3 className="text-base font-bold text-primary">
                Confirm Model Rollback to {rollbackTarget.version_id}
              </h3>
              <button 
                onClick={() => setRollbackTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium mb-4">
              ⚠️ <strong>Rollback Advisory:</strong> This will instantly switch live production risk scoring back to parameters from <strong>{rollbackTarget.version_id}</strong>.
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 mb-4 font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleRollback} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Authorizing Official Name / Role *
                </label>
                <input 
                  type="text"
                  required
                  value={rollbackOfficial}
                  onChange={e => setRollbackOfficial(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button 
                  type="button" 
                  onClick={() => setRollbackTarget(null)}
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
                  {loading ? 'Rolling back...' : 'Confirm Rollback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
