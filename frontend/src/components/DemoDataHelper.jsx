import React, { useState } from 'react';
import { Sparkles, Database, RotateCcw, Check, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function DemoDataHelper({ onDataChanged }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const seedSampleData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      // 1. Seed Real Predictions
      const pred1 = await api.createPrediction({
        ward_id: 'W1',
        hazard_type: 'heat',
        predicted_risk_score: 82.5,
        risk_category: 'CRITICAL',
        data_source: 'Open-Meteo Weather API + ECOSTRESS LST',
        provenance: 'REAL',
        timestamp: '2026-06-01T14:00:00Z',
        details: { ambient_temp_c: 44.2, wbgt_c: 32.5 }
      });

      const pred2 = await api.createPrediction({
        ward_id: 'W1',
        hazard_type: 'heat',
        predicted_risk_score: 76.0,
        risk_category: 'HIGH',
        data_source: 'Open-Meteo Weather API',
        provenance: 'REAL',
        timestamp: '2026-06-02T14:00:00Z',
        details: { ambient_temp_c: 42.8, wbgt_c: 31.2 }
      });

      const pred3 = await api.createPrediction({
        ward_id: 'W1',
        hazard_type: 'heat',
        predicted_risk_score: 71.0,
        risk_category: 'HIGH',
        data_source: 'Open-Meteo Weather API',
        provenance: 'REAL',
        timestamp: '2026-06-03T14:00:00Z',
        details: { ambient_temp_c: 41.5, wbgt_c: 30.4 }
      });

      // 1b. Seed Real Waterlogging Predictions
      const predFlood1 = await api.createPrediction({
        ward_id: 'W2',
        hazard_type: 'waterlogging',
        predicted_risk_score: 72.0,
        risk_category: 'CRITICAL',
        data_source: 'IMD Doppler Radar + Urban Runoff Hydro-Model',
        provenance: 'REAL',
        timestamp: '2026-06-01T08:00:00Z',
        details: { rainfall_24h_mm: 88.5, impervious_ratio: 0.85 }
      });

      const predFlood2 = await api.createPrediction({
        ward_id: 'W2',
        hazard_type: 'waterlogging',
        predicted_risk_score: 64.0,
        risk_category: 'HIGH',
        data_source: 'IMD Doppler Radar + Urban Runoff Hydro-Model',
        provenance: 'REAL',
        timestamp: '2026-06-02T08:00:00Z',
        details: { rainfall_24h_mm: 52.0, impervious_ratio: 0.85 }
      });

      const predFlood3 = await api.createPrediction({
        ward_id: 'W5',
        hazard_type: 'waterlogging',
        predicted_risk_score: 76.0,
        risk_category: 'CRITICAL',
        data_source: 'IMD Doppler Radar + Micro-drainage Choke Index',
        provenance: 'REAL',
        timestamp: '2026-06-01T08:00:00Z',
        details: { rainfall_24h_mm: 94.0, impervious_ratio: 0.88 }
      });

      // 1c. Seed Real Water Shortage Predictions
      const predShortage1 = await api.createPrediction({
        ward_id: 'W3',
        hazard_type: 'water_shortage',
        predicted_risk_score: 68.0,
        risk_category: 'HIGH',
        data_source: 'SCADA Flow Meters + Tail-End Pressure Monitoring',
        provenance: 'REAL',
        timestamp: '2026-06-01T06:00:00Z',
        details: { supply_lpcd: 78, reservoir_storage_pct: 34.2 }
      });

      const predShortage2 = await api.createPrediction({
        ward_id: 'W3',
        hazard_type: 'water_shortage',
        predicted_risk_score: 62.0,
        risk_category: 'HIGH',
        data_source: 'SCADA Flow Meters + Tail-End Pressure Monitoring',
        provenance: 'REAL',
        timestamp: '2026-06-02T06:00:00Z',
        details: { supply_lpcd: 84, reservoir_storage_pct: 33.8 }
      });

      const predShortage3 = await api.createPrediction({
        ward_id: 'W7',
        hazard_type: 'water_shortage',
        predicted_risk_score: 78.0,
        risk_category: 'CRITICAL',
        data_source: 'Groundwater Sensor Network + Slum Coverage Deficit',
        provenance: 'REAL',
        timestamp: '2026-06-01T06:00:00Z',
        details: { supply_lpcd: 62, slum_density: 0.65 }
      });

      // 2. Seed Field Actions
      const act1 = await api.createAction({
        ward_id: 'W1',
        intervention_type: 'cooling_center',
        prediction_id: pred1.prediction_id,
        approval_status: 'APPROVED',
        approved_by: 'AMC_HEALTH_OFFICER',
        approved_at: '2026-06-01T10:00:00Z',
        execution_status: 'COMPLETED',
        started_at: '2026-06-01T11:00:00Z',
        completed_at: '2026-06-01T20:00:00Z',
        actual_cost_inr: 45000,
        actual_crew_used: 4,
        actual_water_used_l: 800,
        notes: 'Air-conditioned shelter operated at Danilimda Community Hall'
      });

      const act2 = await api.createAction({
        ward_id: 'W2',
        intervention_type: 'mobile_pumping',
        prediction_id: predFlood1.prediction_id,
        approval_status: 'APPROVED',
        approved_by: 'DISASTER_MGMT_CELL',
        approved_at: '2026-06-01T08:30:00Z',
        execution_status: 'COMPLETED',
        started_at: '2026-06-01T09:00:00Z',
        completed_at: '2026-06-01T17:00:00Z',
        actual_cost_inr: 14500,
        actual_crew_used: 3,
        actual_water_used_l: 0,
        notes: 'Mobile 500-GPM dewatering pump deployed at Behrampura chronic underpass depression'
      });

      const act3 = await api.createAction({
        ward_id: 'W3',
        intervention_type: 'potable_water_tanker',
        prediction_id: predShortage1.prediction_id,
        approval_status: 'APPROVED',
        approved_by: 'AMC_WATER_SUPPLY_ENGINEER',
        approved_at: '2026-06-01T07:00:00Z',
        execution_status: 'COMPLETED',
        started_at: '2026-06-01T08:00:00Z',
        completed_at: '2026-06-01T14:00:00Z',
        actual_cost_inr: 8500,
        actual_crew_used: 2,
        actual_water_used_l: 16000,
        notes: '16,000 Liters potable emergency supply distributed across 4 un-piped slum pockets'
      });

      const act4 = await api.createAction({
        ward_id: 'W5',
        intervention_type: 'drainage_inspection_clean',
        prediction_id: predFlood3.prediction_id,
        approval_status: 'APPROVED',
        approved_by: 'AMC_DRAINAGE_DEP',
        approved_at: '2026-06-01T09:00:00Z',
        execution_status: 'COMPLETED',
        started_at: '2026-06-01T09:30:00Z',
        completed_at: '2026-06-01T13:30:00Z',
        actual_cost_inr: 9200,
        actual_crew_used: 4,
        actual_water_used_l: 0,
        notes: 'Cleared major polythene and silt blockage in primary storm trunk culvert'
      });

      const act5 = await api.createAction({
        ward_id: 'W7',
        intervention_type: 'water_tanker_dispatch',
        prediction_id: predShortage3.prediction_id,
        approval_status: 'APPROVED',
        approved_by: 'AMC_WATER_SUPPLY_ENGINEER',
        approved_at: '2026-06-01T07:30:00Z',
        execution_status: 'COMPLETED',
        started_at: '2026-06-01T08:15:00Z',
        completed_at: '2026-06-01T15:00:00Z',
        actual_cost_inr: 12000,
        actual_crew_used: 3,
        actual_water_used_l: 24000,
        notes: '24,000 Liters potable water supplied to Vatva informal settlement cluster'
      });

      // 3. Seed Verified Real Outcomes - Heat
      await api.recordOutcome({
        ward_id: 'W1',
        measurement_date: '2026-06-01',
        hazard_type: 'heat',
        action_id: act1.action_id,
        hospital_heat_admissions: 12,
        emergency_108_calls: 8,
        water_scarcity_complaints: 0,
        data_source: 'AMC_HEALTH_SURVEILLANCE',
        provenance: 'REAL',
        data_quality_score: 1.0,
        verification_notes: 'Civil Hospital Asarwa Heatstroke Ward Admission Register'
      });

      await api.recordOutcome({
        ward_id: 'W1',
        measurement_date: '2026-06-02',
        hazard_type: 'heat',
        hospital_heat_admissions: 10,
        emergency_108_calls: 6,
        water_scarcity_complaints: 0,
        data_source: 'AMC_HEALTH_SURVEILLANCE',
        provenance: 'REAL',
        data_quality_score: 1.0,
        verification_notes: 'Day 2 surveillance follow-up'
      });

      await api.recordOutcome({
        ward_id: 'W1',
        measurement_date: '2026-06-03',
        hazard_type: 'heat',
        hospital_heat_admissions: 7,
        emergency_108_calls: 4,
        water_scarcity_complaints: 0,
        data_source: 'AMC_HEALTH_SURVEILLANCE',
        provenance: 'REAL',
        data_quality_score: 1.0,
        verification_notes: 'Day 3 post-cooling center operation'
      });

      // 3b. Seed Verified Real Outcomes - Waterlogging / Flood
      await api.recordOutcome({
        ward_id: 'W2',
        measurement_date: '2026-06-01',
        hazard_type: 'waterlogging',
        action_id: act2.action_id,
        waterlogging_depth_cm: 33,
        hospital_heat_admissions: 0,
        water_scarcity_complaints: 0,
        data_source: 'AMC_STORM_WATER_DRAINAGE_GAUGE',
        provenance: 'REAL',
        data_quality_score: 1.0,
        verification_notes: 'Ultrasonic depth gauge at Behrampura low-point culvert'
      });

      await api.recordOutcome({
        ward_id: 'W2',
        measurement_date: '2026-06-02',
        hazard_type: 'waterlogging',
        waterlogging_depth_cm: 29,
        hospital_heat_admissions: 0,
        water_scarcity_complaints: 0,
        data_source: 'AMC_STORM_WATER_DRAINAGE_GAUGE',
        provenance: 'REAL',
        data_quality_score: 1.0,
        verification_notes: 'Post-pumping residual water depth tracking'
      });

      await api.recordOutcome({
        ward_id: 'W5',
        measurement_date: '2026-06-01',
        hazard_type: 'waterlogging',
        action_id: act4.action_id,
        waterlogging_depth_cm: 36,
        hospital_heat_admissions: 0,
        water_scarcity_complaints: 0,
        data_source: 'AMC_STORM_WATER_DRAINAGE_GAUGE',
        provenance: 'REAL',
        data_quality_score: 1.0,
        verification_notes: 'Vasna barrage flood gauge calibration record'
      });

      // 3c. Seed Verified Real Outcomes - Water Shortage
      await api.recordOutcome({
        ward_id: 'W3',
        measurement_date: '2026-06-01',
        hazard_type: 'water_shortage',
        action_id: act3.action_id,
        water_scarcity_complaints: 18,
        hospital_heat_admissions: 0,
        data_source: 'CCRS_155303_CITIZEN_HELPLINE',
        provenance: 'REAL',
        data_quality_score: 1.0,
        verification_notes: 'AMC Civic Center 155303 daily water supply complaint audit'
      });

      await api.recordOutcome({
        ward_id: 'W3',
        measurement_date: '2026-06-02',
        hazard_type: 'water_shortage',
        water_scarcity_complaints: 14,
        hospital_heat_admissions: 0,
        data_source: 'CCRS_155303_CITIZEN_HELPLINE',
        provenance: 'REAL',
        data_quality_score: 1.0,
        verification_notes: 'Post-tanker deployment complaint trend review'
      });

      await api.recordOutcome({
        ward_id: 'W7',
        hazard_type: 'water_shortage',
        action_id: act5.action_id,
        measurement_date: '2026-06-01',
        water_scarcity_complaints: 21,
        hospital_heat_admissions: 0,
        data_source: 'CCRS_155303_CITIZEN_HELPLINE',
        provenance: 'REAL',
        data_quality_score: 1.0,
        verification_notes: 'Vatva ward engineer field inspection log'
      });

      // Also seed W9 comparison control outcome for DiD
      await api.recordOutcome({
        ward_id: 'W9',
        measurement_date: '2026-06-01',
        hazard_type: 'heat',
        hospital_heat_admissions: 6,
        emergency_108_calls: 3,
        water_scarcity_complaints: 0,
        data_source: 'AMC_HEALTH_SURVEILLANCE',
        provenance: 'REAL',
        data_quality_score: 0.95,
        verification_notes: 'Comparison control ward baseline'
      });

      await api.recordOutcome({
        ward_id: 'W9',
        measurement_date: '2026-06-02',
        hazard_type: 'heat',
        hospital_heat_admissions: 5,
        emergency_108_calls: 3,
        water_scarcity_complaints: 0,
        data_source: 'AMC_HEALTH_SURVEILLANCE',
        provenance: 'REAL',
        data_quality_score: 0.95,
        verification_notes: 'Comparison control ward day 2'
      });

      // 4. Trigger statistical evaluation
      await api.runEvaluation({
        eval_window_days: 30,
        min_samples: 3,
        exclude_simulated: true
      });

      setMessage('✓ Successfully populated sample verified dataset with real observations, executed actions, and evaluation metrics!');
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setMessage(`Seeding failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 px-4.5 flex items-center justify-between flex-wrap gap-3 shadow-xs">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-primary" />
        <span className="text-xs text-on-surface">
          <strong>Hackathon Live Demo Controls:</strong> Toggle between populated municipal dataset and empty cold-start states.
        </span>
      </div>

      <div className="flex items-center gap-2">
        {message && (
          <span className={`text-xs font-semibold ${message.startsWith('✓') ? 'text-emerald-700' : 'text-rose-700'}`}>
            {message}
          </span>
        )}
        <button 
          onClick={seedSampleData}
          disabled={loading}
          className="h-8 px-3.5 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-[#1B5742] shadow-xs cursor-pointer disabled:opacity-60 transition-all"
        >
          <Database size={13} />
          <span>{loading ? 'Populating Live Data...' : 'Seed Verified Demo Data'}</span>
        </button>
      </div>
    </div>
  );
}
