import React, { useState } from 'react';
import { 
  ShieldCheck, 
  PlusCircle, 
  Lock, 
  HelpCircle, 
  Database, 
  AlertCircle,
  Activity,
  PhoneCall,
  Droplets,
  Waves,
  Building2
} from 'lucide-react';
import ProvenanceBadge from './ProvenanceBadge';
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

  const [selectedDomain, setSelectedDomain] = useState('ALL'); // 'ALL', 'heat', 'waterlogging', 'water_shortage'
  const [selectedWard, setSelectedWard] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const heatCount = outcomes.filter(o => o.hazard_type === 'heat').length;
  const waterloggingCount = outcomes.filter(o => o.hazard_type === 'waterlogging').length;
  const waterShortageCount = outcomes.filter(o => o.hazard_type === 'water_shortage').length;

  const realCount = outcomes.filter(o => o.provenance === 'REAL').length;
  const simCount = outcomes.filter(o => o.provenance === 'SIMULATED').length;

  // Multi-Hazard filtering
  const filteredOutcomes = outcomes.filter(o => {
    if (selectedDomain !== 'ALL' && o.hazard_type !== selectedDomain) return false;
    if (selectedWard !== 'ALL' && o.ward_id !== selectedWard && o.ward_name !== selectedWard) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = (o.outcome_id || '').toLowerCase().includes(q);
      const matchWard = (o.ward_id || '').toLowerCase().includes(q) || (o.ward_name || '').toLowerCase().includes(q);
      const matchSource = (o.data_source || '').toLowerCase().includes(q);
      const matchNotes = (o.verification_notes || '').toLowerCase().includes(q);
      if (!matchId && !matchWard && !matchSource && !matchNotes) return false;
    }
    return true;
  });

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
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '8px', borderRadius: '8px' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', fontWeight: 600 }}>Ground-Truth Municipal Outcomes</h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              Aggregated post-intervention civic observations from AMC Health Surveillance, 108 Emergency Services, and CCRS 155303
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.82rem' }}
          >
            <PlusCircle size={15} /> Log Municipal Outcome
          </button>
        </div>
      </div>

      {/* Multi-Hazard Domain Filters & Search Toolbar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '12px',
        marginBottom: '16px',
        background: 'rgba(15, 23, 42, 0.4)',
        padding: '10px 14px',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* Domain Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginRight: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
            Domain:
          </span>
          <button
            onClick={() => setSelectedDomain('ALL')}
            className={`btn ${selectedDomain === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: '0.76rem' }}
          >
            All Domains ({outcomes.length})
          </button>
          <button
            onClick={() => setSelectedDomain('heat')}
            className={`btn ${selectedDomain === 'heat' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              padding: '4px 10px', 
              fontSize: '0.76rem',
              borderColor: selectedDomain === 'heat' ? '#f43f5e' : undefined,
              color: selectedDomain === 'heat' ? '#fff' : '#fda4af'
            }}
          >
            ☀️ Extreme Heat ({heatCount})
          </button>
          <button
            onClick={() => setSelectedDomain('waterlogging')}
            className={`btn ${selectedDomain === 'waterlogging' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              padding: '4px 10px', 
              fontSize: '0.76rem',
              borderColor: selectedDomain === 'waterlogging' ? '#06b6d4' : undefined,
              color: selectedDomain === 'waterlogging' ? '#fff' : '#67e8f9'
            }}
          >
            🌊 Waterlogging ({waterloggingCount})
          </button>
          <button
            onClick={() => setSelectedDomain('water_shortage')}
            className={`btn ${selectedDomain === 'water_shortage' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              padding: '4px 10px', 
              fontSize: '0.76rem',
              borderColor: selectedDomain === 'water_shortage' ? '#0284c7' : undefined,
              color: selectedDomain === 'water_shortage' ? '#fff' : '#7dd3fc'
            }}
          >
            💧 Water Shortage ({waterShortageCount})
          </button>
        </div>

        {/* Ward & Search Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="input-field"
            style={{ padding: '4px 8px', fontSize: '0.76rem', width: 'auto', minWidth: '110px' }}
          >
            <option value="ALL">All Wards</option>
            {Array.from(new Set(outcomes.map(o => o.ward_id))).sort().map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search records / ID / notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ padding: '4px 10px', fontSize: '0.76rem', width: '180px' }}
          />
        </div>
      </div>

      {/* Privacy Guarantee & Provenance Stats Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '12px',
        background: 'rgba(15, 23, 42, 0.6)', 
        padding: '12px 16px', 
        borderRadius: '10px', 
        border: '1px solid var(--border-subtle)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '4px', borderRadius: '4px', color: '#34d399' }}>
            <Lock size={14} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f8fafc' }}>
              Privacy &amp; Non-PII Compliance Verified
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              All records are strictly aggregate ward counts. Names, contact numbers, and patient IDs are rejected at the API barrier.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.78rem' }}>
          <span style={{ color: '#cbd5e1' }}>
            Showing: <strong>{filteredOutcomes.length}</strong> of {outcomes.length}
          </span>
          <span className="badge badge-real">
            {realCount} Empirical Real
          </span>
          {simCount > 0 && (
            <span className="badge badge-simulated">
              {simCount} Demo Simulated
            </span>
          )}
        </div>
      </div>

      {/* Table / Empty State */}
      {filteredOutcomes.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '200px' }}>
          <Database className="empty-state-icon" />
          <h4 style={{ fontSize: '1rem', color: '#f8fafc', marginBottom: '6px' }}>No Verified Outcomes Matching Filter</h4>
          <p style={{ maxWidth: '440px', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '16px' }}>
            No records matched the selected domain ({selectedDomain}) or ward criteria.
          </p>
          <button 
            onClick={() => { setSelectedDomain('ALL'); setSelectedWard('ALL'); setSearchQuery(''); }} 
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Outcome ID</th>
                <th>Ward</th>
                <th>Measurement Date</th>
                <th>Domain</th>
                <th>Observed Health &amp; Civic Indicators</th>
                <th>Data Source</th>
                <th>Confidence</th>
                <th>Provenance Tier</th>
              </tr>
            </thead>
            <tbody>
              {filteredOutcomes.map(o => (
                <tr key={o.outcome_id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#38bdf8' }}>
                    {o.outcome_id}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{o.ward_name || o.ward_id}</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#cbd5e1' }}>
                    {(o.measurement_date || '').slice(0, 10)}
                    <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>
                      Window: {o.measurement_window_hours || 24}h
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: o.hazard_type === 'waterlogging' 
                        ? 'rgba(6, 182, 212, 0.15)' 
                        : o.hazard_type === 'water_shortage' 
                        ? 'rgba(56, 189, 248, 0.15)' 
                        : 'rgba(244, 63, 94, 0.15)',
                      color: o.hazard_type === 'waterlogging'
                        ? '#22d3ee'
                        : o.hazard_type === 'water_shortage'
                        ? '#38bdf8'
                        : '#fb7185',
                      border: `1px solid ${
                        o.hazard_type === 'waterlogging'
                          ? 'rgba(6, 182, 212, 0.3)'
                          : o.hazard_type === 'water_shortage'
                          ? 'rgba(56, 189, 248, 0.3)'
                          : 'rgba(244, 63, 94, 0.3)'
                      }`
                    }}>
                      {o.hazard_type === 'waterlogging' ? '🌊 Waterlogging' : o.hazard_type === 'water_shortage' ? '💧 Water Shortage' : '☀️ Heat'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.78rem' }}>
                      {o.hospital_heat_admissions > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fb7185' }}>
                          <Activity size={12} />
                          <span><strong>{o.hospital_heat_admissions}</strong> heatstroke inpatient cases</span>
                        </div>
                      )}
                      {o.emergency_108_calls > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
                          <PhoneCall size={12} />
                          <span><strong>{o.emergency_108_calls}</strong> 108 ambulance dispatches</span>
                        </div>
                      )}
                      {o.water_scarcity_complaints > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
                          <Droplets size={12} />
                          <span><strong>{o.water_scarcity_complaints}</strong> CCRS 155303 complaints</span>
                        </div>
                      )}
                      {o.waterlogging_depth_cm !== null && o.waterlogging_depth_cm !== undefined && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#06b6d4' }}>
                          <Waves size={12} />
                          <span><strong>{o.waterlogging_depth_cm} cm</strong> flood surcharge depth</span>
                        </div>
                      )}
                      {o.hospital_heat_admissions === 0 && o.emergency_108_calls === 0 && o.water_scarcity_complaints === 0 && !o.waterlogging_depth_cm && (
                        <span style={{ color: '#10b981', fontSize: '0.75rem' }}>✓ Zero adverse events reported</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                      {o.data_source || 'AMC_HEALTH_SURVEILLANCE'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ 
                        width: '42px', 
                        height: '6px', 
                        background: 'rgba(255,255,255,0.1)', 
                        borderRadius: '3px',
                        overflow: 'hidden' 
                      }}>
                        <div style={{ 
                          width: `${Math.round((o.data_quality_score || 1.0) * 100)}%`, 
                          height: '100%', 
                          background: (o.data_quality_score || 1.0) >= 0.8 ? '#10b981' : '#f59e0b' 
                        }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                        {Math.round((o.data_quality_score || 1.0) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <ProvenanceBadge provenance={o.provenance} />
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
          <div className="modal-content" style={{ padding: '24px', maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#f8fafc' }}>
                Ingest Verified Ground-Truth Outcome
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              border: '1px solid rgba(16, 185, 129, 0.25)', 
              padding: '8px 12px', 
              borderRadius: '8px', 
              fontSize: '0.75rem', 
              color: '#34d399',
              marginBottom: '16px'
            }}>
              🔒 <strong>Non-PII Enforcement Active:</strong> Record only aggregate municipal metrics. Any personal names or telephone numbers will trigger strict rejection.
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: '#fb7185', fontSize: '0.82rem', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '4px' }}>
                    Ahmedabad Ward *
                  </label>
                  <select 
                    value={form.ward_id}
                    onChange={e => setForm({ ...form, ward_id: e.target.value })}
                    className="form-select"
                  >
                    {wards.map(w => (
                      <option key={w.id || w.name} value={w.id || w.name}>
                        {w.name} ({w.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '4px' }}>
                    Measurement Date *
                  </label>
                  <input 
                    type="date"
                    required
                    value={form.measurement_date}
                    onChange={e => setForm({ ...form, measurement_date: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '4px' }}>
                    Hazard Domain *
                  </label>
                  <select 
                    value={form.hazard_type}
                    onChange={e => setForm({ ...form, hazard_type: e.target.value })}
                    className="form-select"
                  >
                    <option value="heat">Heatwave Surveillance</option>
                    <option value="waterlogging">Waterlogging / Pluvial Flood</option>
                    <option value="water_shortage">Potable Water Deficit</option>
                    <option value="compound">Compound Multi-Hazard</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '4px' }}>
                    Data Provenance Tier *
                  </label>
                  <select 
                    value={form.provenance}
                    onChange={e => setForm({ ...form, provenance: e.target.value })}
                    className="form-select"
                  >
                    <option value="REAL">REAL (Empirical municipal surveillance)</option>
                    <option value="SIMULATED">SIMULATED (Hackathon drill / test)</option>
                    <option value="ESTIMATED">ESTIMATED (Analytical proxy)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Hospital Heat Inpatients (cases)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    value={form.hospital_heat_admissions}
                    onChange={e => setForm({ ...form, hospital_heat_admissions: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                    108 Ambulance Dispatches (calls)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    value={form.emergency_108_calls}
                    onChange={e => setForm({ ...form, emergency_108_calls: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Water Complaints (CCRS 155303)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    value={form.water_scarcity_complaints}
                    onChange={e => setForm({ ...form, water_scarcity_complaints: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Waterlogging Depth (cm)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Optional cm"
                    value={form.waterlogging_depth_cm}
                    onChange={e => setForm({ ...form, waterlogging_depth_cm: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Reporting Source / Agency
                  </label>
                  <input 
                    type="text"
                    value={form.data_source}
                    onChange={e => setForm({ ...form, data_source: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Confidence Score (0.0 to 1.0)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={form.data_quality_score}
                    onChange={e => setForm({ ...form, data_quality_score: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
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
