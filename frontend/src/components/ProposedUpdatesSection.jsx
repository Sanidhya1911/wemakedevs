import React, { useState } from 'react';
import { 
  GitPullRequest, 
  CheckCheck, 
  XOctagon, 
  UserCheck, 
  ArrowRight
} from 'lucide-react';
import { api } from '../api';

export default function ProposedUpdatesSection({ proposals = [], onProposalUpdated }) {
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'APPROVE' or 'REJECT'
  const [authorityName, setAuthorityName] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const pendingProposals = proposals.filter(p => p.status === 'PENDING_APPROVAL');
  const pastProposals = proposals.filter(p => p.status !== 'PENDING_APPROVAL');

  const handleOpenApprove = (prop) => {
    setSelectedProposal(prop);
    setModalMode('APPROVE');
    setAuthorityName('Municipal Commissioner (AMC)');
    setReviewNotes('Validated against 30-day verified hospital surveillance admissions.');
    setError(null);
  };

  const handleOpenReject = (prop) => {
    setSelectedProposal(prop);
    setModalMode('REJECT');
    setAuthorityName('Disaster Management Authority');
    setReviewNotes('Observed variance deemed temporary due to unseasonal rainfall. Retaining baseline prior.');
    setError(null);
  };

  const handleConfirmDecision = async (e) => {
    e.preventDefault();
    if (!selectedProposal || !modalMode) return;
    setLoading(true);
    setError(null);

    try {
      if (!authorityName.trim()) {
        throw new Error('Named municipal official/role is required for governance authorization.');
      }

      if (modalMode === 'APPROVE') {
        const res = await api.approveProposal(selectedProposal.proposal_id, {
          approved_by: authorityName.trim(),
          review_notes: reviewNotes.trim() || undefined
        });
        setSuccessMsg(`Proposal ${selectedProposal.proposal_id} APPROVED! Created new active model version ${res.new_active_model_version}.`);
      } else {
        if (!reviewNotes.trim()) {
          throw new Error('Documented justification reason is required to reject a parameter proposal.');
        }
        await api.rejectProposal(selectedProposal.proposal_id, {
          reviewed_by: authorityName.trim(),
          review_notes: reviewNotes.trim()
        });
        setSuccessMsg(`Proposal ${selectedProposal.proposal_id} REJECTED. Production parameters remain untouched.`);
      }

      setSelectedProposal(null);
      setModalMode(null);
      if (onProposalUpdated) onProposalUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-xs mb-6">
      {/* Title & Governance Banner */}
      <div className="flex justify-between items-start flex-wrap gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-bold">
            <GitPullRequest size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-primary">Proposed Model Parameter Updates</h3>
            <p className="text-xs text-on-surface-variant">
              Human-in-the-Loop Governance: Model parameters NEVER auto-mutate in production. All proposed weight calibrations require named municipal authorization.
            </p>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
          pendingProposals.length > 0 
            ? 'bg-amber-50 text-amber-800 border border-amber-200' 
            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          {pendingProposals.length > 0 ? `${pendingProposals.length} Pending Approval` : 'All Proposals Resolved'}
        </span>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium mb-4.5">
          {successMsg}
        </div>
      )}

      {/* Pending Proposals Section */}
      <div className="mb-6">
        <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <span>Staged Proposals Awaiting Municipal Approval</span>
          <span className="text-outline font-mono">({pendingProposals.length})</span>
        </h4>

        {pendingProposals.length === 0 ? (
          <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 text-center text-outline">
            <UserCheck size={28} className="text-emerald-600 mx-auto mb-2 opacity-80" />
            <div className="text-xs font-bold text-on-surface mb-0.5">
              No Pending Proposals
            </div>
            <p className="text-[11px] text-outline">
              Production risk parameters are calibrated and in consensus with verified real observations.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingProposals.map(prop => (
              <div 
                key={prop.proposal_id}
                className="bg-amber-50/40 border border-amber-300 rounded-xl p-4 flex justify-between items-start flex-wrap gap-3.5"
              >
                <div className="flex-1 min-w-[280px]">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-primary">
                      {prop.proposal_id}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                      Pending Approval
                    </span>
                    <span className="text-[11px] text-outline">
                      Supporting Evidence: <strong>{prop.supporting_samples_count} real observations</strong>
                    </span>
                  </div>

                  <div className="text-sm font-bold text-on-surface mb-1">
                    Target: {prop.target_parameter_type} for Ward '{prop.target_identifier}'
                  </div>

                  <div className="flex items-center gap-2.5 text-xs font-mono my-2">
                    <span className="text-outline">Current: <strong>{prop.current_value}</strong></span>
                    <ArrowRight size={14} className="text-slate-400" />
                    <span className="text-primary font-bold">Proposed: <strong>{prop.proposed_value}</strong></span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      prop.delta > 0 
                        ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      Delta: {prop.delta > 0 ? `+${prop.delta}` : prop.delta}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {prop.justification}
                  </p>
                </div>

                <div className="flex gap-2 self-center">
                  <button 
                    onClick={() => handleOpenReject(prop)}
                    className="h-8 px-3 bg-white border border-rose-300 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <XOctagon size={13} /> Reject
                  </button>
                  <button 
                    onClick={() => handleOpenApprove(prop)}
                    className="h-8 px-3.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-[#1B5742] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <CheckCheck size={13} /> Authorize &amp; Deploy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historical Resolved Proposals */}
      {pastProposals.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-700 mb-2.5">
            Archived Proposal Resolutions ({pastProposals.length})
          </h4>
          <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono text-outline uppercase tracking-wider">
                  <th className="py-2.5 px-3.5 font-semibold text-slate-700">Proposal ID</th>
                  <th className="py-2.5 px-3.5 font-semibold text-slate-700">Target Parameter</th>
                  <th className="py-2.5 px-3.5 font-semibold text-slate-700">Value Change</th>
                  <th className="py-2.5 px-3.5 font-semibold text-slate-700">Status</th>
                  <th className="py-2.5 px-3.5 font-semibold text-slate-700">Reviewed By</th>
                  <th className="py-2.5 px-3.5 font-semibold text-slate-700">Review Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pastProposals.map(p => (
                  <tr key={p.proposal_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-mono text-xs font-bold text-primary">
                      {p.proposal_id}
                    </td>
                    <td className="py-3 px-3.5 font-medium text-on-surface">
                      {p.target_parameter_type} ({p.target_identifier})
                    </td>
                    <td className="py-3 px-3.5 font-mono text-xs text-outline">
                      {p.current_value} → {p.proposed_value} ({p.delta > 0 ? `+${p.delta}` : p.delta})
                    </td>
                    <td className="py-3 px-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        p.status === 'APPROVED' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 font-medium">
                      {p.reviewed_by || '—'}
                    </td>
                    <td className="py-3 px-3.5 text-outline text-xs max-w-[240px]">
                      {p.review_notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {selectedProposal && modalMode && (
        <div className="modal-overlay">
          <div className="modal-content p-6 max-w-lg">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
              <h3 className="text-base font-bold text-primary">
                {modalMode === 'APPROVE' ? 'Authorize Parameter Update' : 'Reject Parameter Update'}
              </h3>
              <button 
                onClick={() => { setSelectedProposal(null); setModalMode(null); }}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className={`p-3 rounded-lg text-xs font-medium mb-4 ${
              modalMode === 'APPROVE' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              {modalMode === 'APPROVE' 
                ? 'Approving will commit a new immutable model version (e.g. v1.1.0) and activate the new vulnerability offset.' 
                : 'Rejecting will leave production model parameters unchanged and archive the proposal with documented rationale.'}
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 mb-4 font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleConfirmDecision} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Authorizing Municipal Authority / Role *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. AMC Health Officer, Disaster Mgmt Commissioner"
                  value={authorityName}
                  onChange={e => setAuthorityName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <span className="text-[10px] text-outline mt-1 block">
                  Note: Logged for civic audit compliance.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {modalMode === 'APPROVE' ? 'Review / Justification Notes (Optional)' : 'Documented Reason for Rejection *'}
                </label>
                <textarea 
                  rows="3"
                  required={modalMode === 'REJECT'}
                  placeholder={modalMode === 'APPROVE' ? 'Document rationale or supporting context...' : 'Reason for rejecting this calibration proposal...'}
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button 
                  type="button" 
                  onClick={() => { setSelectedProposal(null); setModalMode(null); }}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-60 text-white ${
                    modalMode === 'APPROVE' ? 'bg-primary hover:bg-[#1B5742]' : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : (modalMode === 'APPROVE' ? 'Commit & Activate Version' : 'Confirm Rejection')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
