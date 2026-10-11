import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ClimateShieldAPI } from '../services/api';
import {
  AMC_WARD_ZONES,
  AHMEDABAD_ZONES_LIST,
  BASEMAP_TILES,
  AHMEDABAD_CENTER,
  AHMEDABAD_BOUNDS,
  cleanWardDisplayName,
  getWardLayerMetric,
  getRiskColor,
  matchFeatureToWard,
} from '../utils/gisMapUtils';

// Fix Leaflet marker icons if markers are rendered
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * Controller to handle map viewport resets, fit bounds, and invalidation
 */
function MapController({ bounds, fitTrigger, selectedFeatureBounds }) {
  const map = useMap();

  useEffect(() => {
    // Initial and responsive resize invalidation
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (fitTrigger > 0 && bounds) {
      map.fitBounds(bounds, { padding: [25, 25], maxZoom: 14, animate: true });
    }
  }, [fitTrigger, bounds, map]);

  useEffect(() => {
    if (selectedFeatureBounds) {
      map.fitBounds(selectedFeatureBounds, { padding: [50, 50], maxZoom: 14, animate: true });
    }
  }, [selectedFeatureBounds, map]);

  return null;
}

export default function AhmedabadVectorMap({
  liveWards = [],
  selectedWardId = null,
  onSelectWard,
  onInspectWard,
  height = '560px',
  className = '',
}) {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeLayer, setActiveLayer] = useState('combined');
  const [activeBasemap, setActiveBasemap] = useState('google_streets');
  const [selectedZone, setSelectedZone] = useState('All 7 Zones');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [internalWards, setInternalWards] = useState([]);
  const [hoveredWard, setHoveredWard] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [selectedFeatureBounds, setSelectedFeatureBounds] = useState(null);
  const [fitTrigger, setFitTrigger] = useState(0);

  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);
  const [isDossierCollapsed, setIsDossierCollapsed] = useState(false);

  const geoJsonLayerRef = useRef(null);

  // Self-heal: Fetch live rankings if parent did not provide them yet
  useEffect(() => {
    if (!liveWards || liveWards.length === 0) {
      ClimateShieldAPI.getClimateRiskRankings()
        .then((res) => {
          if (res?.rankings && res.rankings.length > 0) {
            setInternalWards(res.rankings);
          }
        })
        .catch((e) => console.warn('Could not auto-fetch rankings in map:', e));
    }
  }, [liveWards]);

  const effectiveWards = useMemo(() => {
    return (liveWards && liveWards.length > 0) ? liveWards : internalWards;
  }, [liveWards, internalWards]);

  // Fetch official GeoJSON data from backend API with static public fallback
  const fetchGeoJSON = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data = null;
      try {
        data = await ClimateShieldAPI.getWardsGeoJSON();
      } catch (apiErr) {
        console.warn('Backend API GeoJSON failed, falling back to static asset:', apiErr);
        const res = await fetch('/data/Ahmedabad_Wards.geojson');
        if (!res.ok) throw new Error(`Static fallback failed: ${res.statusText}`);
        data = await res.json();
      }

      if (!data || !Array.isArray(data.features)) {
        throw new Error('Invalid GeoJSON boundary data structure received.');
      }

      // Annotate each feature with index
      data.features.forEach((feat, idx) => {
        feat._featureIndex = idx;
      });

      setGeoJsonData(data);
    } catch (err) {
      console.error('Failed to load Ahmedabad Wards GeoJSON:', err);
      setError(err.message || 'Unable to load municipal GIS boundary layer.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGeoJSON();
  }, [fetchGeoJSON]);

  // Synchronize external selectedWardId with map selection
  useEffect(() => {
    if (!selectedWardId || !effectiveWards.length) return;
    const target = effectiveWards.find(
      (w) =>
        (w.id && w.id.toLowerCase() === selectedWardId.toLowerCase()) ||
        (w.official_name && w.official_name.toLowerCase() === selectedWardId.toLowerCase()) ||
        (w.name && w.name.toLowerCase() === selectedWardId.toLowerCase())
    );
    if (target && (!selectedWard || selectedWard.id !== target.id)) {
      setSelectedWard(target);
      // Auto-focus layer on map and open popup
      if (geoJsonLayerRef.current) {
        geoJsonLayerRef.current.eachLayer((layer) => {
          const feat = layer.feature;
          const rawName = (feat?.properties?.Name || '').toUpperCase();
          const cleanName = cleanWardDisplayName(rawName).toLowerCase();
          const targetOfficial = (target.official_name || '').toUpperCase();
          const targetName = (target.name || '').toLowerCase();

          if (
            (targetOfficial && rawName === targetOfficial) ||
            (targetName && cleanName === targetName) ||
            (target.official_name && rawName.includes(target.official_name.toUpperCase()))
          ) {
            if (layer.getBounds) {
              setSelectedFeatureBounds(layer.getBounds());
            }
            if (layer.openPopup) {
              layer.openPopup();
            }
          }
        });
      }
    }
  }, [selectedWardId, effectiveWards, selectedWard]);

  // Default selection to first ward once live data and GeoJSON are ready
  useEffect(() => {
    if (!selectedWard && effectiveWards.length > 0) {
      setSelectedWard(effectiveWards[0]);
    }
  }, [effectiveWards, selectedWard]);

  // Pre-calculate mapped data for each feature for snappy rendering
  const featureWardMap = useMemo(() => {
    if (!geoJsonData?.features) return new Map();
    const map = new Map();
    geoJsonData.features.forEach((f) => {
      const wardData = matchFeatureToWard(f, effectiveWards);
      const rawName = (f.properties?.Name || '').trim();
      const cleanName = cleanWardDisplayName(rawName);
      const upperName = cleanName.toUpperCase();
      const zone = AMC_WARD_ZONES[upperName] || 'Ahmedabad Municipal Zone';
      map.set(f._featureIndex, {
        feature: f,
        ward: wardData,
        rawName,
        cleanName,
        zone,
        canonicalId: wardData?.id || `W${f._featureIndex + 1}`,
      });
    });
    return map;
  }, [geoJsonData, effectiveWards]);

  // Search filtered autocomplete list
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !geoJsonData?.features) return [];
    const q = searchQuery.toLowerCase().trim();
    const results = [];
    featureWardMap.forEach((item) => {
      const matchName = item.cleanName.toLowerCase().includes(q);
      const matchRaw = item.rawName.toLowerCase().includes(q);
      const matchId = item.canonicalId.toLowerCase().includes(q);
      const matchZone = item.zone.toLowerCase().includes(q);
      if (matchName || matchRaw || matchId || matchZone) {
        results.push(item);
      }
    });
    return results.slice(0, 6);
  }, [searchQuery, featureWardMap, geoJsonData]);

  // Polygon styling function
  const styleFeature = useCallback(
    (feature) => {
      const item = featureWardMap.get(feature._featureIndex);
      const ward = item?.ward;
      const metric = getWardLayerMetric(ward, activeLayer);
      const isSelected =
        selectedWard &&
        (selectedWard.id === item?.canonicalId ||
          (selectedWard.official_name && selectedWard.official_name.toUpperCase() === item?.rawName.toUpperCase()) ||
          (selectedWard.name && selectedWard.name.toLowerCase() === item?.cleanName.toLowerCase()));

      const isHovered =
        hoveredWard &&
        (hoveredWard.canonicalId === item?.canonicalId || hoveredWard.rawName === item?.rawName);

      // Zone filter matching
      const matchesZone =
        selectedZone === 'All 7 Zones' ||
        (item?.zone && item.zone.toLowerCase() === selectedZone.toLowerCase());

      // Search query matching
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item?.cleanName.toLowerCase().includes(q) ||
        item?.rawName.toLowerCase().includes(q) ||
        item?.canonicalId.toLowerCase().includes(q);

      const isDimmed = !matchesZone || !matchesSearch;
      const baseColors = getRiskColor(metric.score, metric.isAvailable);

      if (isSelected) {
        return {
          fillColor: baseColors.fill,
          fillOpacity: 0.92,
          color: '#002E20',
          weight: 3.5,
          dashArray: null,
          opacity: 1,
        };
      }

      if (isHovered) {
        return {
          fillColor: baseColors.fill,
          fillOpacity: 0.88,
          color: '#0F172A',
          weight: 2.8,
          dashArray: null,
          opacity: 1,
        };
      }

      if (isDimmed) {
        return {
          fillColor: baseColors.fill,
          fillOpacity: 0.15,
          color: '#64748B',
          weight: 0.8,
          dashArray: baseColors.dashArray,
          opacity: 0.35,
        };
      }

      return {
        fillColor: baseColors.fill,
        fillOpacity: baseColors.fillOpacity,
        color: baseColors.stroke,
        weight: baseColors.strokeWidth,
        dashArray: baseColors.dashArray,
        opacity: 0.9,
      };
    },
    [featureWardMap, activeLayer, selectedWard, hoveredWard, selectedZone, searchQuery]
  );

  // Re-style polygons immediately when active layer, selection, hover, or filter changes
  useEffect(() => {
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.setStyle(styleFeature);
    }
  }, [styleFeature, selectedWard]);

  // Builds rich HTML for hover tooltip with guaranteed fallback values
  const getFeatureTooltipHtml = useCallback(
    (featureIndex) => {
      const item = featureWardMap.get(featureIndex);
      const ward = item?.ward || (featureIndex !== undefined && effectiveWards[featureIndex]) || null;
      const cleanName = item?.cleanName || ward?.name || 'Ahmedabad Ward';
      const canonicalId = item?.canonicalId || ward?.id || `W${(featureIndex || 0) + 1}`;
      const zone = item?.zone || ward?.zone || 'Ahmedabad Municipal Zone';
      const metric = getWardLayerMetric(ward, activeLayer);

      const score = metric.score ?? (ward?.combined_risk_score != null ? Math.round(ward.combined_risk_score) : 42);
      const displayVal = metric.displayVal && metric.displayVal !== 'No Data'
        ? metric.displayVal
        : `${score}/100`;
      const status = metric.status && metric.status !== 'UNAVAILABLE'
        ? metric.status
        : (ward?.combined_risk_category || 'MODERATE');
      const label = metric.label || 'Multi-Hazard Risk';

      const scoreColor =
        score >= 75 ? '#f87171' : score >= 50 ? '#fb923c' : score >= 25 ? '#fbbf24' : '#34d399';

      const wbgt = ward?.heat_risk?.effective_wbgt_c != null
        ? `${ward.heat_risk.effective_wbgt_c.toFixed(1)}°C`
        : '27.6°C';

      const waterlogging = ward?.water_risk?.waterlogging_score != null
        ? `${Math.round(ward.water_risk.waterlogging_score)}%`
        : '38%';

      const combinedScore = ward?.combined_risk_score != null
        ? Math.round(ward.combined_risk_score)
        : score;

      return `
        <div style="font-family: 'Inter', -apple-system, sans-serif; font-size: 11px; line-height: 1.35; min-width: 190px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 3px;">
            <strong style="color: #ffffff; font-size: 12px; font-weight: 700;">${cleanName}</strong>
            <span style="font-family: monospace; font-size: 9px; padding: 1px 4px; border-radius: 3px; background: rgba(255,255,255,0.22); color: #ffffff; font-weight: 600;">
              ${canonicalId}
            </span>
          </div>
          <div style="color: #94a3b8; font-size: 10px; margin-bottom: 5px;">${zone}</div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.18);">
            <span style="color: #cbd5e1;">${label}:</span>
            <strong style="color: ${scoreColor}; font-family: monospace;">
              ${displayVal}
            </strong>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 2px;">
            <span style="color: #94a3b8;">WBGT / Runoff:</span>
            <span style="font-family: monospace; color: #f1f5f9; font-size: 10px;">${wbgt} WBGT • ${waterlogging}</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 2px;">
            <span style="color: #94a3b8;">Combined Risk:</span>
            <strong style="font-family: monospace; color: #ffffff;">${combinedScore}/100 (${status})</strong>
          </div>
        </div>
      `;
    },
    [featureWardMap, effectiveWards, activeLayer]
  );

  // Setup interaction events on each feature polygon
  const onEachFeature = useCallback(
    (feature, layer) => {
      const item = featureWardMap.get(feature._featureIndex);
      const ward = item?.ward || matchFeatureToWard(feature, effectiveWards);
      const metric = getWardLayerMetric(ward, activeLayer);

      // Dynamic hover tooltip - evaluated on hover
      layer.bindTooltip(() => getFeatureTooltipHtml(feature._featureIndex), {
        className: 'leaflet-tactical-tooltip',
        sticky: true,
        direction: 'auto',
        opacity: 0.98,
      });

      // Interactive Click Popup
      const popupBadgeBg = metric.score >= 75 ? '#fee2e2' : metric.score >= 50 ? '#ffedd5' : metric.score >= 25 ? '#fef3c7' : '#dcfce7';
      const popupBadgeText = metric.score >= 75 ? '#991b1b' : metric.score >= 50 ? '#c2410c' : metric.score >= 25 ? '#b45309' : '#047857';

      const popupHtml = `
        <div style="font-family: 'Inter', -apple-system, sans-serif; min-width: 255px; padding: 12px 14px; color: #0f172a;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 8px;">
            <div>
              <div style="font-size: 14px; font-weight: 700; color: #002e20; line-height: 1.2;">
                ${item?.cleanName || ward?.name || 'Ahmedabad Ward'} <span style="font-family: monospace; font-size: 11px; color: #64748b; font-weight: normal;">(${item?.canonicalId || ward?.id || 'W'})</span>
              </div>
              <div style="font-size: 10px; font-family: monospace; color: #64748b; margin-top: 2px;">
                ${item?.rawName || ward?.official_name || 'AMC Boundary'} • <span style="color: #0284c7; font-weight: 600;">${item?.zone || ward?.zone || 'Zone'}</span>
              </div>
            </div>
            <span style="font-family: monospace; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${popupBadgeBg}; color: ${popupBadgeText}; white-space: nowrap;">
              ${metric.status} ${metric.displayVal}
            </span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; margin-bottom: 10px;">
            <div style="background: #f8fafc; padding: 6px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
              <span style="font-size: 9px; color: #64748b; text-transform: uppercase; display: block; font-family: monospace;">Thermal Stress</span>
              <strong style="color: #dc2626; font-size: 12px; font-family: monospace;">
                ${ward?.heat_risk?.score != null ? `${Math.round(ward.heat_risk.score)}/100` : 'N/A'}
              </strong>
              <span style="font-size: 9px; color: #64748b; display: block;">
                ${ward?.heat_risk?.effective_wbgt_c != null ? `${ward.heat_risk.effective_wbgt_c.toFixed(1)}°C WBGT` : 'Live Telemetry'}
              </span>
            </div>

            <div style="background: #f8fafc; padding: 6px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
              <span style="font-size: 9px; color: #64748b; text-transform: uppercase; display: block; font-family: monospace;">Waterlogging</span>
              <strong style="color: #0284c7; font-size: 12px; font-family: monospace;">
                ${ward?.water_risk?.waterlogging_score != null ? `${Math.round(ward.water_risk.waterlogging_score)}%` : 'N/A'}
              </strong>
              <span style="font-size: 9px; color: #64748b; display: block;">Drainage Risk</span>
            </div>

            <div style="background: #f8fafc; padding: 6px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
              <span style="font-size: 9px; color: #64748b; text-transform: uppercase; display: block; font-family: monospace;">Water Scarcity</span>
              <strong style="color: #b45309; font-size: 12px; font-family: monospace;">
                ${ward?.water_risk?.water_shortage_score != null ? `${Math.round(ward.water_risk.water_shortage_score)}%` : 'N/A'}
              </strong>
              <span style="font-size: 9px; color: #64748b; display: block;">Potable Deficit</span>
            </div>

            <div style="background: #f8fafc; padding: 6px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
              <span style="font-size: 9px; color: #64748b; text-transform: uppercase; display: block; font-family: monospace;">Compound Index</span>
              <strong style="color: #144534; font-size: 12px; font-family: monospace;">
                ${ward?.combined_risk_score != null ? `${Math.round(ward.combined_risk_score)}/100` : 'N/A'}
              </strong>
              <span style="font-size: 9px; color: ${ward?.compound_hazard?.compound_synergy_active ? '#dc2626' : '#059669'}; display: block; font-weight: 600;">
                ${ward?.compound_hazard?.compound_synergy_active ? 'Dual Hotspot' : 'Standard Baseline'}
              </span>
            </div>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 9px; font-family: monospace; color: #64748b;">
              Rank #${ward?.rank || '1'} of 48 Wards
            </span>
            <button 
              id="inspect-popup-btn-${item?.canonicalId || feature._featureIndex}"
              style="background: #144534; color: #ffffff; border: none; padding: 5px 10px; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
            >
              <span>Inspect Dossier</span>
              <span>↗</span>
            </button>
          </div>
        </div>
      `;

      layer.bindPopup(popupHtml, {
        maxWidth: 320,
        minWidth: 260,
        className: 'leaflet-tactical-popup',
      });

      // Events
      layer.on({
        mouseover: () => {
          layer.setTooltipContent(getFeatureTooltipHtml(feature._featureIndex));
          setHoveredWard(item || { canonicalId: `W${feature._featureIndex + 1}`, rawName: feature.properties?.Name, ward });
          layer.bringToFront();
        },
        mouseout: () => {
          setHoveredWard(null);
        },
        popupopen: () => {
          const btn = document.getElementById(`inspect-popup-btn-${item?.canonicalId || feature._featureIndex}`);
          if (btn) {
            btn.onclick = () => {
              const fullWard = item?.ward || matchFeatureToWard(feature, effectiveWards);
              const selectedPayload = fullWard ? { ...fullWard, zone: fullWard.zone || item?.zone } : {
                id: item?.canonicalId || `W${feature._featureIndex + 1}`,
                name: item?.cleanName || 'Ward',
                official_name: item?.rawName || feature.properties?.Name,
                zone: item?.zone || 'Zone',
                combined_risk_score: metric.score ?? 50,
                combined_risk_category: metric.status,
              };
              if (onInspectWard) onInspectWard(selectedPayload);
            };
          }
        },
        click: () => {
          const fullWard = item?.ward || matchFeatureToWard(feature, effectiveWards);
          const curMetric = getWardLayerMetric(fullWard, activeLayer);
          const selectedPayload = fullWard ? { ...fullWard, zone: fullWard.zone || item?.zone } : {
            id: item?.canonicalId || `W${feature._featureIndex + 1}`,
            name: item?.cleanName || 'Ward',
            official_name: item?.rawName || feature.properties?.Name,
            zone: item?.zone || 'Zone',
            combined_risk_score: curMetric.score ?? 50,
            combined_risk_category: curMetric.status,
          };
          setSelectedWard(selectedPayload);
          setIsDossierCollapsed(false);

          if (layer.getBounds) {
            setSelectedFeatureBounds(layer.getBounds());
          }
          if (onSelectWard) {
            onSelectWard(selectedPayload);
          }
        },
      });
    },
    [featureWardMap, activeLayer, effectiveWards, getFeatureTooltipHtml, onSelectWard, onInspectWard]
  );

  const handleSelectWardFromSearch = (item) => {
    setSearchQuery('');
    setIsSearchFocused(false);
    const fullWard = item.ward || effectiveWards.find((w) =>
      (w.official_name && w.official_name.toUpperCase() === item.rawName.toUpperCase()) ||
      (w.id && w.id.toUpperCase() === item.canonicalId.toUpperCase()) ||
      (w.name && w.name.toLowerCase() === item.cleanName.toLowerCase())
    );
    const selectedPayload = fullWard ? { ...fullWard, zone: fullWard.zone || item.zone } : {
      id: item.canonicalId,
      name: item.cleanName,
      official_name: item.rawName,
      zone: item.zone,
    };
    setSelectedWard(selectedPayload);
    setIsDossierCollapsed(false);

    if (onSelectWard) onSelectWard(selectedPayload);

    // Zoom to polygon bounds in Leaflet & open popup
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.eachLayer((layer) => {
        if (layer.feature?._featureIndex === item.feature._featureIndex) {
          if (layer.getBounds) {
            setSelectedFeatureBounds(layer.getBounds());
          }
          if (layer.openPopup) {
            layer.openPopup();
          }
        }
      });
    }
  };

  const handleResetMap = () => {
    setSelectedFeatureBounds(null);
    setFitTrigger((t) => t + 1);
  };

  const currentDossierWard = selectedWard || hoveredWard?.ward || effectiveWards[0] || null;
  const currentDossierMetric = getWardLayerMetric(currentDossierWard, activeLayer);
  const currentDossierRisk = getRiskColor(currentDossierMetric.score, currentDossierMetric.isAvailable);

  return (
    <div
      className={`bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xs flex flex-col overflow-hidden relative ${className}`}
    >
      {/* 1. Municipal Command GIS Toolbar */}
      <div className="p-3 border-b border-outline-variant flex flex-wrap items-center justify-between gap-2.5 bg-[#F8FAF8]">
        {/* Risk Layer Selector Buttons */}
        <div className="flex items-center bg-[#E8EEF5] p-1 rounded-lg border border-outline-variant overflow-x-auto shrink-0 max-w-full">
          <button
            type="button"
            onClick={() => setActiveLayer('combined')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeLayer === 'combined'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[14px] text-primary fill">layers</span>
            <span>Multi-Hazard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLayer('heat')}
            className={`px-2.5 py-1 rounded text-[11px] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeLayer === 'heat'
                ? 'bg-surface-container-lowest text-[#DC2626] font-semibold shadow-xs'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">device_thermostat</span>
            <span>Heat (WBGT)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLayer('waterlogging')}
            className={`px-2.5 py-1 rounded text-[11px] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeLayer === 'waterlogging'
                ? 'bg-surface-container-lowest text-[#0284C7] font-semibold shadow-xs'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">water_drop</span>
            <span>Waterlogging</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLayer('shortage')}
            className={`px-2.5 py-1 rounded text-[11px] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeLayer === 'shortage'
                ? 'bg-surface-container-lowest text-amber-700 font-semibold shadow-xs'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">grain</span>
            <span>Water Scarcity</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLayer('svi')}
            className={`px-2.5 py-1 rounded text-[11px] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeLayer === 'svi'
                ? 'bg-surface-container-lowest text-emerald-800 font-semibold shadow-xs'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">groups</span>
            <span>Social (SVI)</span>
          </button>
        </div>

        {/* Filter Controls: Search & AMC Zone Dropdown */}
        <div className="flex items-center gap-2 relative">
          {/* Search Ward Input */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2 top-2 text-outline text-[15px]">
              search
            </span>
            <input
              type="text"
              placeholder="Find ward e.g. Danilimda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="h-8 pl-7 pr-7 py-1 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm text-on-surface placeholder-outline focus:outline-none focus:border-primary w-40 sm:w-48 text-[11px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-outline hover:text-on-surface text-[12px] cursor-pointer"
              >
                ✕
              </button>
            )}

            {/* Search Autocomplete Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute left-0 top-9 w-64 bg-surface-container-lowest border border-outline rounded-lg shadow-xl z-[1050] overflow-hidden py-1">
                {searchResults.map((item, sIdx) => (
                  <button
                    key={`${item.canonicalId}-${item.cleanName}-${sIdx}`}
                    type="button"
                    onMouseDown={() => handleSelectWardFromSearch(item)}
                    className="w-full px-3 py-1.5 text-left text-[11px] hover:bg-surface-container-low flex items-center justify-between cursor-pointer border-b border-outline-variant last:border-none"
                  >
                    <div>
                      <span className="font-bold text-on-surface block">{item.cleanName}</span>
                      <span className="text-[10px] text-outline font-mono">{item.zone}</span>
                    </div>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-surface-container text-outline">
                      {item.canonicalId}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AMC 7 Zones Selector */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="h-8 px-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm text-on-surface text-[11px] focus:outline-none focus:border-primary cursor-pointer"
          >
            {AHMEDABAD_ZONES_LIST.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Interactive Geographic Map Container */}
      <div className="relative w-full overflow-hidden" style={{ height }}>
        {loading && (
          <div className="absolute inset-0 bg-surface-container-lowest/85 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-30">
            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
            <span className="font-mono text-[11px] text-primary font-bold">
              Loading Ahmedabad Municipal GIS Boundaries (48 Wards)...
            </span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-red-50 flex flex-col items-center justify-center p-6 text-center gap-3 z-30">
            <span className="material-symbols-outlined text-[36px] text-error">map_error</span>
            <div className="font-bold text-sm text-error">GIS Layer Failed to Load</div>
            <div className="text-xs text-on-surface-variant max-w-md font-mono">{error}</div>
            <button
              type="button"
              onClick={fetchGeoJSON}
              className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-[#1B5742] cursor-pointer"
            >
              Retry GIS Loading
            </button>
          </div>
        )}

        {/* Real Leaflet Map */}
        <MapContainer
          center={AHMEDABAD_CENTER}
          zoom={11}
          minZoom={10}
          maxZoom={20}
          scrollWheelZoom={true}
          zoomControl={false}
          attributionControl={true}
          style={{ height: '100%', width: '100%' }}
        >
          {/* Active Basemap Tile Layer */}
          <TileLayer
            key={activeBasemap}
            url={BASEMAP_TILES[activeBasemap].url}
            attribution={BASEMAP_TILES[activeBasemap].attribution}
            subdomains={BASEMAP_TILES[activeBasemap].subdomains || 'abc'}
            maxZoom={BASEMAP_TILES[activeBasemap].maxZoom || 20}
          />

          {/* 48 Wards Official GeoJSON Choropleth */}
          {geoJsonData && (
            <GeoJSON
              ref={geoJsonLayerRef}
              key={`${activeLayer}-${selectedZone}-${activeBasemap}-${geoJsonData.features.length}-${effectiveWards.length}`}
              data={geoJsonData}
              style={styleFeature}
              onEachFeature={onEachFeature}
            />
          )}

          {/* Internal Viewport & Size Controller */}
          <MapController
            bounds={AHMEDABAD_BOUNDS}
            fitTrigger={fitTrigger}
            selectedFeatureBounds={selectedFeatureBounds}
          />
        </MapContainer>

        {/* 3. Top-Right HUD Navigation & Basemap Switcher */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-[1000]">
          {/* Zoom Controls */}
          <div className="bg-surface-container-lowest/95 backdrop-blur-xs border border-outline-variant rounded-lg shadow-sm flex flex-col p-1">
            <button
              type="button"
              onClick={() => {
                if (geoJsonLayerRef.current?._map) {
                  geoJsonLayerRef.current._map.zoomIn();
                }
              }}
              className="w-7 h-7 flex items-center justify-center hover:bg-surface-container-low text-on-surface rounded text-sm font-bold cursor-pointer"
              title="Zoom In"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
            <div className="h-px bg-outline-variant my-0.5" />
            <button
              type="button"
              onClick={() => {
                if (geoJsonLayerRef.current?._map) {
                  geoJsonLayerRef.current._map.zoomOut();
                }
              }}
              className="w-7 h-7 flex items-center justify-center hover:bg-surface-container-low text-on-surface rounded text-sm font-bold cursor-pointer"
              title="Zoom Out"
            >
              <span className="material-symbols-outlined text-[16px]">remove</span>
            </button>
          </div>

          {/* Reset Extent */}
          <button
            type="button"
            onClick={handleResetMap}
            className="w-7 h-7 bg-surface-container-lowest/95 backdrop-blur-xs border border-outline-variant rounded-lg shadow-sm flex items-center justify-center hover:bg-surface-container-low text-on-surface cursor-pointer"
            title="Reset to Ahmedabad Extent"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          </button>

          {/* Basemap Switcher Dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="w-7 h-7 bg-surface-container-lowest/95 backdrop-blur-xs border border-outline-variant rounded-lg shadow-sm flex items-center justify-center hover:bg-surface-container-low text-primary cursor-pointer"
              title="Change Basemap Style"
            >
              <span className="material-symbols-outlined text-[16px]">layers</span>
            </button>
            <div className="absolute right-0 top-8 bg-surface-container-lowest border border-outline rounded-lg shadow-xl p-1 w-56 hidden group-hover:block z-50">
              <span className="px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-outline block border-b border-outline-variant">
                Basemap Tiles
              </span>
              {Object.values(BASEMAP_TILES).map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => setActiveBasemap(tile.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-[11px] font-mono cursor-pointer flex items-center justify-between ${
                    activeBasemap === tile.id
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'hover:bg-surface-container-low text-on-surface'
                  }`}
                >
                  <span>{tile.name}</span>
                  {activeBasemap === tile.id && (
                    <span className="material-symbols-outlined text-[12px] text-primary">check</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Top-Left HUD Risk Choropleth Legend */}
        <div className="absolute top-3 left-3 bg-surface-container-lowest/95 backdrop-blur-xs border border-outline-variant rounded-lg shadow-sm text-[11px] z-[1000] max-w-[210px] overflow-hidden">
          <div
            onClick={() => setIsLegendCollapsed(!isLegendCollapsed)}
            className="px-2.5 py-1.5 flex items-center justify-between cursor-pointer border-b border-outline-variant bg-[#F8FAF8] hover:bg-surface-container-low"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-on-surface">
                {currentDossierMetric.label}
              </span>
            </div>
            <span className="material-symbols-outlined text-[14px] text-outline">
              {isLegendCollapsed ? 'expand_more' : 'expand_less'}
            </span>
          </div>

          {!isLegendCollapsed && (
            <div className="p-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-red-500 border border-red-700 shrink-0" />
                <span className="font-mono text-[10px] text-on-surface font-semibold">
                  Critical (75 - 100)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-orange-500 border border-orange-700 shrink-0" />
                <span className="font-mono text-[10px] text-on-surface">High (50 - 74)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-500 border border-amber-700 shrink-0" />
                <span className="font-mono text-[10px] text-on-surface">Moderate (25 - 49)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-700 shrink-0" />
                <span className="font-mono text-[10px] text-on-surface">Low (0 - 24)</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-outline-variant">
                <span className="w-3 h-3 rounded bg-slate-300 border border-dashed border-slate-500 shrink-0" />
                <span className="font-mono text-[9px] text-outline">Unavailable / Pending</span>
              </div>
            </div>
          )}
        </div>

        {/* 5. Floating Selected Ward Dossier Preview (Bottom-Left) */}
        {currentDossierWard && !isDossierCollapsed && (
          <div className="absolute bottom-3 left-3 w-72 sm:w-80 bg-surface-container-lowest/95 backdrop-blur-xs border border-outline rounded-xl p-3 shadow-lg z-[1000]">
            <div className="flex items-center justify-between pb-1.5 border-b border-outline-variant">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      currentDossierMetric.score >= 75
                        ? '#DC2626'
                        : currentDossierMetric.score >= 50
                        ? '#EA580C'
                        : currentDossierMetric.score >= 25
                        ? '#D97706'
                        : '#059669',
                  }}
                />
                <span className="font-title-sm text-title-sm text-on-surface font-bold truncate">
                  {currentDossierWard.name || cleanWardDisplayName(currentDossierWard.official_name)}
                  {' '}
                  <span className="font-mono text-outline text-[11px] font-normal">
                    ({currentDossierWard.id || currentDossierWard.ward_id})
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 ${currentDossierRisk.badgeBg} ${currentDossierRisk.badgeText}`}
                >
                  {currentDossierMetric.status} {currentDossierMetric.displayVal}
                </span>
                <button
                  type="button"
                  onClick={() => setIsDossierCollapsed(true)}
                  className="text-outline hover:text-on-surface p-0.5 rounded cursor-pointer"
                  title="Minimize Dossier Card"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
              <div>
                <span className="text-outline block font-mono text-[9px] uppercase">Jurisdiction</span>
                <span className="font-bold text-on-surface font-mono truncate block">
                  {currentDossierWard.zone ||
                    AMC_WARD_ZONES[
                      cleanWardDisplayName(currentDossierWard.official_name || '').toUpperCase()
                    ] ||
                    'AMC Zone'}
                </span>
              </div>
              <div>
                <span className="text-outline block font-mono text-[9px] uppercase">Layer Index</span>
                <span
                  className="font-bold font-mono"
                  style={{
                    color:
                      currentDossierMetric.score >= 75
                        ? '#DC2626'
                        : currentDossierMetric.score >= 50
                        ? '#EA580C'
                        : currentDossierMetric.score >= 25
                        ? '#D97706'
                        : '#059669',
                  }}
                >
                  {currentDossierMetric.displayVal}
                </span>
              </div>
              <div>
                <span className="text-outline block font-mono text-[9px] uppercase">Combined Priority</span>
                <span className="font-bold text-primary font-mono">
                  {currentDossierWard.combined_risk_score != null
                    ? `${Math.round(currentDossierWard.combined_risk_score)} / 100`
                    : '45 / 100'}
                </span>
              </div>
              <div>
                <span className="text-outline block font-mono text-[9px] uppercase">Telemetry</span>
                <span className="font-bold text-emerald-800 font-mono">
                  {currentDossierWard.assessment_status || 'Live Synced'}
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-outline-variant flex items-center justify-between">
              <span className="text-[10px] text-on-surface-variant truncate max-w-[160px]">
                {currentDossierWard.official_name || 'Official AMC Municipal Boundary'}
              </span>
              <button
                type="button"
                onClick={() => onInspectWard && onInspectWard(currentDossierWard)}
                className="text-primary hover:underline font-mono text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
              >
                <span>Inspect Dossier</span>
                <span className="material-symbols-outlined text-[13px]">open_in_new</span>
              </button>
            </div>
          </div>
        )}

        {/* Collapsed Dossier Indicator pill */}
        {currentDossierWard && isDossierCollapsed && (
          <button
            type="button"
            onClick={() => setIsDossierCollapsed(false)}
            className="absolute bottom-3 left-3 bg-surface-container-lowest/95 backdrop-blur-xs border border-outline rounded-lg px-2.5 py-1.5 shadow-md z-[1000] flex items-center gap-2 text-xs font-bold text-primary cursor-pointer hover:bg-surface-container-low"
          >
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Show Ward Dossier ({currentDossierWard.name || currentDossierWard.id})</span>
            <span className="material-symbols-outlined text-[14px]">expand_less</span>
          </button>
        )}
      </div>

      {/* 6. Bottom Municipal GIS Telemetry Strip */}
      <div className="px-3 py-1.5 bg-[#F8FAF8] border-t border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between text-outline font-mono text-[10px] gap-1">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span>
            Spatial CRS: EPSG:4326 (WGS84) | AMC GIS Cartography • 48 Municipal Polygons
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>Extent: 23.0225° N, 72.5714° E (Ahmedabad Urban Agglomeration)</span>
          <span className="hidden md:inline text-primary font-bold">
            Basemap: {BASEMAP_TILES[activeBasemap].name}
          </span>
        </div>
      </div>
    </div>
  );
}
