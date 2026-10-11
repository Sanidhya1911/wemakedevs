import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  MapPin, 
  Layers, 
  Info, 
  AlertCircle,
  Database
} from 'lucide-react';

export default function RiskTimeSeriesSection({ predictions = [], outcomes = [], wards = [] }) {
  const [selectedWard, setSelectedWard] = useState('ALL');
  const [selectedHazard, setSelectedHazard] = useState('ALL');

  // Filter predictions
  const filteredPredictions = useMemo(() => {
    return predictions.filter(p => {
      const matchWard = selectedWard === 'ALL' || p.ward_id === selectedWard;
      const matchHazard = selectedHazard === 'ALL' || p.hazard_type === selectedHazard;
      return matchWard && matchHazard;
    }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [predictions, selectedWard, selectedHazard]);

  // Filter outcomes
  const filteredOutcomes = useMemo(() => {
    return outcomes.filter(o => {
      const matchWard = selectedWard === 'ALL' || o.ward_id === selectedWard;
      const matchHazard = selectedHazard === 'ALL' || o.hazard_type === selectedHazard || o.hazard_type === 'compound';
      return matchWard && matchHazard;
    }).sort((a, b) => new Date(a.measurement_date) - new Date(b.measurement_date));
  }, [outcomes, selectedWard, selectedHazard]);

  // Normalize outcomes into equivalent risk scale (0-100) exactly as backend learning engine does
  const outcomeRiskPoints = useMemo(() => {
    return filteredOutcomes.map(o => {
      let riskVal = 0;
      const hazard = o.hazard_type || 'heat';
      if (hazard === 'heat') {
        const admissions = Number(o.hospital_heat_admissions || 0);
        const calls = Number(o.emergency_108_calls || 0);
        riskVal = Math.min(100, (admissions * 8.0) + (calls * 4.0));
      } else if (hazard === 'waterlogging') {
        const depth = Number(o.waterlogging_depth_cm || 0);
        riskVal = Math.min(100, depth * 2.0);
      } else if (hazard === 'water_shortage') {
        const complaints = Number(o.water_scarcity_complaints || 0);
        riskVal = Math.min(100, complaints * 4.0);
      } else {
        const admissions = Number(o.hospital_heat_admissions || 0);
        const depth = Number(o.waterlogging_depth_cm || 0);
        riskVal = Math.min(100, (admissions * 6.0) + (depth * 1.5));
      }

      return {
        ...o,
        computedRiskScore: Math.round(riskVal * 10) / 10,
        dateStr: (o.measurement_date || '').slice(0, 10)
      };
    });
  }, [filteredOutcomes]);

  const hasRealOutcomes = outcomeRiskPoints.some(o => o.provenance === 'REAL');
  const hasAnyOutcomes = outcomeRiskPoints.length > 0;
  const hasPredictions = filteredPredictions.length > 0;

  // Build merged timeline points for rendering the SVG chart
  const timelineDates = useMemo(() => {
    const dates = new Set();
    filteredPredictions.forEach(p => {
      if (p.timestamp) dates.add(p.timestamp.slice(0, 10));
    });
    outcomeRiskPoints.forEach(o => {
      if (o.dateStr) dates.add(o.dateStr);
    });
    return Array.from(dates).sort();
  }, [filteredPredictions, outcomeRiskPoints]);

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-xs mb-6">
      {/* Header and Controls */}
      <div className="flex justify-between items-start flex-wrap gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 flex items-center justify-center font-bold">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-primary">Predicted vs. Observed Risk Timeline</h3>
            <p className="text-xs text-on-surface-variant">
              Relational calibration connecting model forecasts with empirical ground-truth hospital morbidity and civic outcomes
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2.5 items-center flex-wrap">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs">
            <MapPin size={14} className="text-outline" />
            <select 
              value={selectedWard} 
              onChange={e => setSelectedWard(e.target.value)}
              className="bg-transparent border-none text-xs text-on-surface font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Ahmedabad Wards</option>
              {wards.map(w => (
                <option key={w.id || w.name} value={w.id || w.name}>
                  {w.name} ({w.id})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs">
            <Layers size={14} className="text-outline" />
            <select 
              value={selectedHazard} 
              onChange={e => setSelectedHazard(e.target.value)}
              className="bg-transparent border-none text-xs text-on-surface font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Hazards</option>
              <option value="heat">Heatwaves</option>
              <option value="waterlogging">Waterlogging / Pluvial Flood</option>
              <option value="water_shortage">Potable Water Deficit</option>
              <option value="compound">Compound Multi-Hazard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Epistemic Status Banner */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-5 text-xs">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Info size={16} className="text-primary" />
          <span>
            Data Filter: <strong>{filteredPredictions.length}</strong> Predictions recorded | <strong>{filteredOutcomes.length}</strong> Observed outcomes ({outcomeRiskPoints.filter(o => o.provenance === 'REAL').length} Verified Real)
          </span>
        </div>
        <div className="flex gap-3 items-center text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block"></span>
            <span className="text-outline text-[11px]">Predicted Risk (Forecast)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block"></span>
            <span className="text-outline text-[11px]">Observed Ground Truth (Real)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-purple-500 inline-block"></span>
            <span className="text-outline text-[11px]">Observed (Simulated Drill)</span>
          </div>
        </div>
      </div>

      {/* Main Chart Area or Informative Empty State */}
      {!hasPredictions && !hasAnyOutcomes ? (
        <div className="min-h-[220px] flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-xl text-center">
          <Database className="w-10 h-10 text-slate-400 mb-2" />
          <h4 className="text-sm font-bold text-on-surface mb-1">No Data Available for Selection</h4>
          <p className="max-w-md text-xs text-on-surface-variant mb-3">
            No prediction records or observed municipal outcomes match the current ward or hazard filter.
          </p>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Awaiting municipal telemetry ingestion
          </span>
        </div>
      ) : !hasAnyOutcomes ? (
        /* Empty State: Predictions exist but NO verified outcomes recorded yet */
        <div className="bg-amber-50/50 rounded-xl border border-dashed border-amber-300 p-8 text-center mb-5">
          <AlertCircle size={32} className="text-amber-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-amber-900 mb-1">
            Awaiting Ground-Truth Outcome Verification
          </h4>
          <p className="max-w-xl mx-auto mb-3 text-xs text-amber-800">
            There are <strong>{filteredPredictions.length}</strong> active risk forecasts for this selection, but <strong>no verified municipal outcomes have been recorded yet</strong>.
          </p>
          <div className="inline-flex bg-white px-4 py-2 rounded-lg border border-amber-200 text-xs text-slate-700 text-left gap-3">
            <div><strong>Required Surveillance Data:</strong></div>
            <div>• Heat: AMC Hospital Inpatient Admissions &amp; 108 Dispatches</div>
            <div>• Water: Civic CCRS 155303 Complaints &amp; Flood Surcharge Depth</div>
          </div>
        </div>
      ) : (
        /* Render SVG Time-Series Chart */
        <div className="mb-6">
          <div className="w-full h-60 bg-white rounded-xl border border-slate-200 p-4 relative overflow-hidden">
            <svg viewBox="0 0 800 200" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {/* Grid Lines */}
              <line x1="50" y1="20" x2="780" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="50" y1="60" x2="780" y2="60" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="50" y1="100" x2="780" y2="100" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="50" y1="140" x2="780" y2="140" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="50" y1="180" x2="780" y2="180" stroke="#e2e8f0" />

              {/* Y-Axis Labels */}
              <text x="40" y="24" fill="#94a3b8" fontSize="10" textAnchor="end">100</text>
              <text x="40" y="64" fill="#94a3b8" fontSize="10" textAnchor="end">75</text>
              <text x="40" y="104" fill="#94a3b8" fontSize="10" textAnchor="end">50</text>
              <text x="40" y="144" fill="#94a3b8" fontSize="10" textAnchor="end">25</text>
              <text x="40" y="184" fill="#94a3b8" fontSize="10" textAnchor="end">0</text>

              {/* Threshold 50 line (Severe / Alert threshold) */}
              <line x1="50" y1="100" x2="780" y2="100" stroke="#f59e0b" strokeDasharray="4 4" strokeWidth="1.5" strokeOpacity="0.6" />
              <text x="775" y="96" fill="#d97706" fontSize="9" textAnchor="end" fontWeight="600">Alert Threshold (50)</text>

              {/* Prediction Points & Path */}
              {timelineDates.length > 0 && (
                <>
                  {/* Lines for predictions */}
                  <polyline
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    points={timelineDates.map((date, idx) => {
                      const matchPred = filteredPredictions.find(p => (p.timestamp || '').slice(0, 10) === date);
                      const val = matchPred ? matchPred.predicted_risk_score : 0;
                      const x = 60 + (idx / Math.max(1, timelineDates.length - 1)) * 710;
                      const y = 180 - (val / 100) * 160;
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  {/* Lines for observed outcomes */}
                  <polyline
                    fill="none"
                    stroke={hasRealOutcomes ? "#059669" : "#7c3aed"}
                    strokeWidth="2.5"
                    points={timelineDates.map((date, idx) => {
                      const matchOut = outcomeRiskPoints.find(o => o.dateStr === date);
                      const val = matchOut ? matchOut.computedRiskScore : 0;
                      const x = 60 + (idx / Math.max(1, timelineDates.length - 1)) * 710;
                      const y = 180 - (val / 100) * 160;
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  {/* Prediction Circles */}
                  {timelineDates.map((date, idx) => {
                    const matchPred = filteredPredictions.find(p => (p.timestamp || '').slice(0, 10) === date);
                    if (!matchPred) return null;
                    const x = 60 + (idx / Math.max(1, timelineDates.length - 1)) * 710;
                    const y = 180 - (matchPred.predicted_risk_score / 100) * 160;
                    return (
                      <g key={`p-${idx}`}>
                        <circle cx={x} cy={y} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                      </g>
                    );
                  })}

                  {/* Outcome Circles */}
                  {timelineDates.map((date, idx) => {
                    const matchOut = outcomeRiskPoints.find(o => o.dateStr === date);
                    if (!matchOut) return null;
                    const x = 60 + (idx / Math.max(1, timelineDates.length - 1)) * 710;
                    const y = 180 - (matchOut.computedRiskScore / 100) * 160;
                    const color = matchOut.provenance === 'REAL' ? '#059669' : '#7c3aed';
                    return (
                      <g key={`o-${idx}`}>
                        <circle cx={x} cy={y} r="6" fill={color} stroke="#ffffff" strokeWidth="2" />
                      </g>
                    );
                  })}

                  {/* X-axis date labels */}
                  {timelineDates.map((date, idx) => {
                    if (timelineDates.length > 8 && idx % 2 !== 0 && idx !== timelineDates.length - 1) return null;
                    const x = 60 + (idx / Math.max(1, timelineDates.length - 1)) * 710;
                    return (
                      <text key={`lbl-${idx}`} x={x} y="195" fill="#64748b" fontSize="9" textAnchor="middle">
                        {date.slice(5)}
                      </text>
                    );
                  })}
                </>
              )}
            </svg>
          </div>
        </div>
      )}

      {/* Contemporaneous Observation Comparison Table (Without Data Source & Provenance Column) */}
      {timelineDates.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <span className="text-xs font-bold text-primary">Observation Comparison Log</span>
            <span className="text-[11px] font-mono text-outline">({timelineDates.length} chronological timestamps)</span>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-mono text-outline uppercase tracking-wider">
                <th className="py-2.5 px-3.5 font-semibold text-slate-700">Date</th>
                <th className="py-2.5 px-3.5 font-semibold text-slate-700">Ward</th>
                <th className="py-2.5 px-3.5 font-semibold text-slate-700">Hazard</th>
                <th className="py-2.5 px-3.5 font-semibold text-slate-700">Predicted Risk</th>
                <th className="py-2.5 px-3.5 font-semibold text-slate-700">Observed Outcome Proxy</th>
                <th className="py-2.5 px-3.5 font-semibold text-slate-700">Model Residual (Error)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timelineDates.map(date => {
                const pred = filteredPredictions.find(p => (p.timestamp || '').slice(0, 10) === date);
                const out = outcomeRiskPoints.find(o => o.dateStr === date);

                const predScore = pred ? pred.predicted_risk_score : null;
                const outScore = out ? out.computedRiskScore : null;
                const residual = (predScore !== null && outScore !== null) 
                  ? Math.round((outScore - predScore) * 10) / 10 
                  : null;

                return (
                  <tr key={date} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-mono text-xs text-outline">{date}</td>
                    <td className="py-3 px-3.5 font-semibold text-on-surface">
                      {pred?.ward_name || out?.ward_name || pred?.ward_id || out?.ward_id || 'All Wards'}
                    </td>
                    <td className="py-3 px-3.5 capitalize text-on-surface-variant">
                      {pred?.hazard_type || out?.hazard_type || 'General'}
                    </td>
                    <td className="py-3 px-3.5">
                      {predScore !== null ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold font-mono ${
                            predScore >= 70 ? 'text-rose-700' : (predScore >= 50 ? 'text-amber-700' : 'text-sky-700')
                          }`}>
                            {predScore}
                          </span>
                          <span className="text-[10px] text-outline font-semibold">({pred?.risk_category})</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">— No Forecast —</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      {outScore !== null ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold font-mono text-emerald-800">{outScore}</span>
                          <span className="text-[11px] text-outline">
                            ({out.hospital_heat_admissions} adm / {out.emergency_108_calls} calls / {out.water_scarcity_complaints} comp)
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">— Pending Outcome —</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      {residual !== null ? (
                        <span className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                          Math.abs(residual) <= 8 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : (residual > 0 ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-sky-50 text-sky-800 border border-sky-200')
                        }`}>
                          {residual > 0 ? `+${residual}` : residual} pts
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
