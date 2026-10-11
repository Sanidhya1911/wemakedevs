import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Edit3, 
  Filter,
  Sparkles,
  Flame,
  Waves,
  Droplet
} from 'lucide-react';
import { api } from '../api';

const getInterventionDomain = (type = '') => {
  const t = (type || '').toLowerCase();
  if (t.includes('pump') || t.includes('drain') || t.includes('flood') || t.includes('waterlog')) {
    return {
      id: 'WATERLOGGING',
      name: 'Waterlogging & Flood',
      badge: '🌊 Flood / Drainage',
      chipClass: 'bg-teal-50 text-teal-800 border-teal-200',
      icon: Waves
    };
  }
  if (t.includes('tanker') || t.includes('scarcity') || t.includes('shortage') || t.includes('potable') || t.includes('supply')) {
    return {
      id: 'WATER_SHORTAGE',
      name: 'Water Supply & Tankers',
      badge: '💧 Water Supply / Tankers',
      chipClass: 'bg-sky-50 text-sky-800 border-sky-200',
      icon: Droplet
    };
  }
  return {
    id: 'HEAT',
    name: 'Heat Refuge & Cooling',
    badge: '🔥 Heat Mitigation',
    chipClass: 'bg-rose-50 text-rose-800 border-rose-200',
    icon: Flame
  };
};

export default function InterventionHistorySection({ actions = [], onActionUpdated, onOpenVerifyModal }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [editingAction, setEditingAction] = useState(null);
  const [patchForm, setPatchForm] = useState({
    execution_status: 'COMPLETED',
    actual_cost_inr: '',
    actual_crew_used: '',
    actual_water_used_l: '',
    failure_reason: '',
    notes: ''
  });
  const [loadingPatch, setLoadingPatch] = useState(false);
  const [patchError, setPatchError] = useState(null);

  const filteredActions = actions.filter(a => {
    const statusMatch = statusFilter === 'ALL' || a.execution_status === statusFilter;
    const domain = getInterventionDomain(a.intervention_type);
    const domainMatch = domainFilter === 'ALL' || domain.id === domainFilter;
    return statusMatch && domainMatch;
  });

  const domainCounts = {
    heat: actions.filter(a => getInterventionDomain(a.intervention_type).id === 'HEAT').length,
    waterlogging: actions.filter(a => getInterventionDomain(a.intervention_type).id === 'WATERLOGGING').length,
    waterShortage: actions.filter(a => getInterventionDomain(a.intervention_type).id === 'WATER_SHORTAGE').length,
  };

  const counts = {
    total: actions.length,
    completed: actions.filter(a => a.execution_status === 'COMPLETED').length,
    inProgress: actions.filter(a => a.execution_status === 'IN_PROGRESS').length,
    scheduled: actions.filter(a => a.execution_status === 'SCHEDULED').length,
    failed: actions.filter(a => a.execution_status === 'FAILED' || a.execution_status === 'CANCELLED').length,
  };

  const handleOpenEdit = (action) => {
    setEditingAction(action);
    setPatchForm({
      execution_status: action.execution_status || 'COMPLETED',
      actual_cost_inr: action.actual_cost_inr ?? '',
      actual_crew_used: action.actual_crew_used ?? '',
      actual_water_used_l: action.actual_water_used_l ?? '',
      failure_reason: action.failure_reason ?? '',
      notes: action.notes ?? ''
    });
    setPatchError(null);
  };

  const handleSavePatch = async (e) => {
    e.preventDefault();
    if (!editingAction) return;
    setLoadingPatch(true);
    setPatchError(null);

    try {
      const payload = {
        execution_status: patchForm.execution_status,
        actual_cost_inr: patchForm.actual_cost_inr !== '' ? Number(patchForm.actual_cost_inr) : undefined,
        actual_crew_used: patchForm.actual_crew_used !== '' ? Number(patchForm.actual_crew_used) : undefined,
        actual_water_used_l: patchForm.actual_water_used_l !== '' ? Number(patchForm.actual_water_used_l) : undefined,
        failure_reason: patchForm.failure_reason ? patchForm.failure_reason.trim() : undefined,
        notes: patchForm.notes ? patchForm.notes.trim() : undefined
      };

      if ((payload.execution_status === 'FAILED' || payload.execution_status === 'CANCELLED') && !payload.failure_reason) {
        throw new Error('Failure reason is strictly required when marking action as FAILED or CANCELLED.');
      }

      await api.patchAction(editingAction.action_id, payload);
      setEditingAction(null);
      if (onActionUpdated) onActionUpdated();
    } catch (err) {
      setPatchError(err.message);
    } finally {
      setLoadingPatch(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} /> Completed
          </span>
        );
      case 'FAILED':
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle size={12} /> {status}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
            <Clock size={12} /> In Progress
          </span>
        );
      case 'SCHEDULED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock size={12} /> Scheduled
          </span>
        );
    }
  };

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-xs mb-6">
      {/* Title & Filter Strip */}
      <div className="flex justify-between items-start flex-wrap gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 flex items-center justify-center font-bold">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-primary">Executed Municipal Field Actions</h3>
            <p className="text-xs text-on-surface-variant">
              Multi-hazard tracking of field interventions across Heat, Waterlogging &amp; Dewatering, and Potable Water Tankers
            </p>
          </div>
        </div>

        {/* Dual Filters: Domain & Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Hazard Domain Filter */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs shadow-2xs">
            <Filter size={14} className="text-outline" />
            <span className="text-[11px] font-semibold text-outline">Domain:</span>
            <select 
              value={domainFilter} 
              onChange={e => setDomainFilter(e.target.value)}
              className="bg-transparent border-none text-xs text-on-surface font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Hazards ({counts.total})</option>
              <option value="HEAT">🔥 Heat Mitigation ({domainCounts.heat})</option>
              <option value="WATERLOGGING">🌊 Waterlogging / Drainage ({domainCounts.waterlogging})</option>
              <option value="WATER_SHORTAGE">💧 Water Supply / Tankers ({domainCounts.waterShortage})</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs shadow-2xs">
            <span className="text-[11px] font-semibold text-outline">Status:</span>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs text-on-surface font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses ({counts.total})</option>
              <option value="COMPLETED">Completed ({counts.completed})</option>
              <option value="IN_PROGRESS">In Progress ({counts.inProgress})</option>
              <option value="SCHEDULED">Scheduled ({counts.scheduled})</option>
              <option value="FAILED">Failed/Cancelled ({counts.failed})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hazard Domain Breakdown Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <button
          onClick={() => setDomainFilter(domainFilter === 'HEAT' ? 'ALL' : 'HEAT')}
          className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
            domainFilter === 'HEAT' 
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-rose-200 hover:bg-rose-50/30'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
              <Flame size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-on-surface">Heatwave Interventions</div>
              <div className="text-[11px] text-outline">Cooling centers, hydration, shade</div>
            </div>
          </div>
          <div className="text-lg font-bold font-mono text-rose-800">{domainCounts.heat}</div>
        </button>

        <button
          onClick={() => setDomainFilter(domainFilter === 'WATERLOGGING' ? 'ALL' : 'WATERLOGGING')}
          className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
            domainFilter === 'WATERLOGGING' 
              ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-500/20 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-teal-200 hover:bg-teal-50/30'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <Waves size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-on-surface">Waterlogging &amp; Dewatering</div>
              <div className="text-[11px] text-outline">Mobile pumps, drain clearance</div>
            </div>
          </div>
          <div className="text-lg font-bold font-mono text-teal-800">{domainCounts.waterlogging}</div>
        </button>

        <button
          onClick={() => setDomainFilter(domainFilter === 'WATER_SHORTAGE' ? 'ALL' : 'WATER_SHORTAGE')}
          className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
            domainFilter === 'WATER_SHORTAGE' 
              ? 'bg-sky-50/80 border-sky-300 ring-2 ring-sky-500/20 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-sky-200 hover:bg-sky-50/30'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center">
              <Droplet size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-on-surface">Water Supply &amp; Tankers</div>
              <div className="text-[11px] text-outline">Potable tankers, supply boost</div>
            </div>
          </div>
          <div className="text-lg font-bold font-mono text-sky-800">{domainCounts.waterShortage}</div>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-[10px] font-mono text-outline uppercase font-semibold">Total Dispatched</div>
          <div className="text-xl font-bold font-mono text-on-surface mt-1">{counts.total}</div>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-[10px] font-mono text-emerald-800 uppercase font-semibold">Completed</div>
          <div className="text-xl font-bold font-mono text-emerald-800 mt-1">{counts.completed}</div>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-[10px] font-mono text-sky-800 uppercase font-semibold">In Progress</div>
          <div className="text-xl font-bold font-mono text-sky-800 mt-1">{counts.inProgress}</div>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-[10px] font-mono text-amber-800 uppercase font-semibold">Scheduled</div>
          <div className="text-xl font-bold font-mono text-amber-800 mt-1">{counts.scheduled}</div>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-[10px] font-mono text-rose-800 uppercase font-semibold">Failed / Cancelled</div>
          <div className="text-xl font-bold font-mono text-rose-800 mt-1">{counts.failed}</div>
        </div>
      </div>

      {/* Table */}
      {filteredActions.length === 0 ? (
        <div className="min-h-[180px] flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-xl text-center">
          <ClipboardCheck className="w-10 h-10 text-slate-400 mb-2" />
          <h4 className="text-sm font-bold text-on-surface mb-1">No Field Actions Recorded</h4>
          <p className="max-w-md text-xs text-on-surface-variant">
            {statusFilter === 'ALL' && domainFilter === 'ALL'
              ? 'No municipal field interventions have been dispatched or logged in the system yet.'
              : `No actions match the active filters (${domainFilter !== 'ALL' ? `Domain: ${domainFilter}, ` : ''}Status: ${statusFilter}).`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono text-outline uppercase tracking-wider">
                <th className="py-2.5 px-3.5 font-semibold text-slate-700">Action ID</th>
                <th className="py-2.5 px-3.5 font-semibold text-slate-700">Ward</th>
                <th className="py-2.5 px-3.5 font-semibold text-slate-700">Intervention Dispatched</th>
                <th className="py-2.5 px-3.5 font-semibold text-slate-700">Authorized By</th>
                <th className="py-2.5 px-3.5 font-semibold text-slate-700">Execution Status</th>
                <th className="py-2.5 px-3.5 font-semibold text-slate-700">Actual Resources Used</th>
                <th className="py-2.5 px-3.5 font-semibold text-slate-700">Failure / Operational Notes</th>
                <th className="py-2.5 px-3.5 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActions.map(action => {
                const domain = getInterventionDomain(action.intervention_type);
                return (
                  <tr key={action.action_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-mono text-xs font-bold text-primary">
                      {action.action_id}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-on-surface">
                      {action.ward_name || action.ward_id}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="capitalize font-semibold text-on-surface">
                          {action.intervention_type.replace(/_/g, ' ')}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${domain.chipClass}`}>
                          {domain.badge}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3.5">
                      <div>
                        <span className="font-semibold text-on-surface">{action.approved_by}</span>
                        <div className="text-[10px] text-outline font-mono">
                          {action.approved_at ? action.approved_at.slice(0, 10) : 'Pre-approved'}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3.5">
                      {getStatusBadge(action.execution_status)}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="text-xs text-on-surface-variant space-y-0.5">
                        {action.actual_cost_inr ? (
                          <div className="font-semibold text-primary">₹{action.actual_cost_inr.toLocaleString()}</div>
                        ) : null}
                        {action.actual_crew_used ? (
                          <div className="text-outline">{action.actual_crew_used} crew</div>
                        ) : null}
                        {action.actual_water_used_l ? (
                          <div className="text-sky-800 font-semibold flex items-center gap-1">
                            <Droplet size={11} /> {action.actual_water_used_l.toLocaleString()} L water
                          </div>
                        ) : null}
                        {!action.actual_cost_inr && !action.actual_crew_used && !action.actual_water_used_l && (
                          <span className="text-slate-400">— Unreported —</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 max-w-[200px]">
                      {action.failure_reason ? (
                        <div className="text-rose-700 text-xs flex items-center gap-1 font-medium">
                          <AlertTriangle size={12} />
                          <span>{action.failure_reason}</span>
                        </div>
                      ) : action.notes ? (
                        <span className="text-outline text-xs">{action.notes}</span>
                      ) : (
                        <span className="text-slate-400 text-xs">None</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleOpenEdit(action)}
                          className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Update field execution status or report completion/failure"
                        >
                          <Edit3 size={12} /> Status
                        </button>
                        {action.execution_status === 'COMPLETED' && (
                          <button 
                            onClick={() => onOpenVerifyModal && onOpenVerifyModal(action)}
                            className="px-2.5 py-1 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-[#1B5742] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Evaluate empirical efficacy using Before-After or DiD"
                          >
                            <Sparkles size={12} /> Verify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Status Patch Modal */}
      {editingAction && (
        <div className="modal-overlay">
          <div className="modal-content p-6 max-w-lg">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
              <h3 className="text-base font-bold text-primary">
                Update Field Execution Status
              </h3>
              <button 
                onClick={() => setEditingAction(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-outline mb-4">
              Action: <strong className="text-primary font-mono">{editingAction.action_id}</strong> | Ward: <strong className="text-on-surface">{editingAction.ward_name || editingAction.ward_id}</strong> ({editingAction.intervention_type})
            </div>

            {patchError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 mb-4 font-mono">
                {patchError}
              </div>
            )}

            <form onSubmit={handleSavePatch} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Execution State *
                </label>
                <select 
                  value={patchForm.execution_status}
                  onChange={e => setPatchForm({ ...patchForm, execution_status: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="SCHEDULED">SCHEDULED (Field crew queued)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Currently deployed)</option>
                  <option value="COMPLETED">COMPLETED (Intervention executed)</option>
                  <option value="FAILED">FAILED (Disruption / equipment breakdown)</option>
                  <option value="CANCELLED">CANCELLED (Superseded or recalled)</option>
                </select>
              </div>

              {(patchForm.execution_status === 'FAILED' || patchForm.execution_status === 'CANCELLED') && (
                <div>
                  <label className="block text-xs font-semibold text-rose-700 mb-1">
                    Documented Failure Reason * (Required by Safety Protocol)
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Pump generator seized; Tanker driver route flooded"
                    value={patchForm.failure_reason}
                    onChange={e => setPatchForm({ ...patchForm, failure_reason: e.target.value })}
                    className="w-full bg-white border border-rose-300 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-rose-200"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Actual Cost (₹)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="0"
                    value={patchForm.actual_cost_inr}
                    onChange={e => setPatchForm({ ...patchForm, actual_cost_inr: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Actual Crew
                  </label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="0"
                    value={patchForm.actual_crew_used}
                    onChange={e => setPatchForm({ ...patchForm, actual_crew_used: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Water Used (L)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="0"
                    value={patchForm.actual_water_used_l}
                    onChange={e => setPatchForm({ ...patchForm, actual_water_used_l: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Operational Notes (Strictly Non-PII)
                </label>
                <textarea 
                  rows="2"
                  placeholder="Deployment notes, field logistics, site conditions (no personal info)..."
                  value={patchForm.notes}
                  onChange={e => setPatchForm({ ...patchForm, notes: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button 
                  type="button" 
                  onClick={() => setEditingAction(null)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  disabled={loadingPatch}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-[#1B5742] shadow-xs cursor-pointer disabled:opacity-60"
                  disabled={loadingPatch}
                >
                  {loadingPatch ? 'Updating...' : 'Commit Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
