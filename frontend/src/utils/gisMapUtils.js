// Official Ahmedabad Municipal Corporation (AMC) 7 Zones mapping for all 48 wards
export const AMC_WARD_ZONES = {
  // Central Zone (6 wards)
  'KHADIA': 'Central Zone',
  'JAMALPUR': 'Central Zone',
  'SHAHPUR': 'Central Zone',
  'DARIYAPUR': 'Central Zone',
  'SHAHIBAG': 'Central Zone',
  'ASARWA': 'Central Zone',

  // East Zone (7 wards)
  'BAPUNAGAR': 'East Zone',
  'GOMTIPUR': 'East Zone',
  'AMRAIWADI': 'East Zone',
  'ODHAV': 'East Zone',
  'VASTRAL': 'East Zone',
  'NIKOL': 'East Zone',
  'VIRATNAGAR': 'East Zone',

  // North Zone (7 wards)
  'NARODA': 'North Zone',
  'SAIJPUR BOGHA': 'North Zone',
  'KUBERNAGR': 'North Zone',
  'SARDARNAGAR': 'North Zone',
  'THAKKARBAPANAGAR': 'North Zone',
  'INDIA COLONY': 'North Zone',
  'SARASPUR-RAKHIYAL': 'North Zone',

  // South Zone (10 wards)
  'DANILIMDA': 'South Zone',
  'BAHERAMPURA': 'South Zone',
  'MANINAGAR': 'South Zone',
  'KHOKHRA': 'South Zone',
  'ISANPUR': 'South Zone',
  'LAMBHA': 'South Zone',
  'VATVA': 'South Zone',
  'RAMOL HATHIJAN': 'South Zone',
  'INDRAPURI': 'South Zone',
  'BHAIPURA HATKESHWAR': 'South Zone',

  // West Zone (8 wards)
  'NAVRANGPURA': 'West Zone',
  'NARANPURA': 'West Zone',
  'PALDI': 'West Zone',
  'VASNA': 'West Zone',
  'S.P.STADIUM': 'West Zone',
  'NEW WADAJ': 'West Zone',
  'SABARMATI': 'West Zone',
  'RANIP': 'West Zone',

  // North West Zone (6 wards)
  'THALTEJ': 'North West Zone',
  'BODAKDEV': 'North West Zone',
  'GHATLODIA': 'North West Zone',
  'CHANDLODIA': 'North West Zone',
  'GOTA': 'North West Zone',
  'CHANDKHEDA': 'North West Zone',

  // South West Zone (4 wards)
  'SARKHEJ': 'South West Zone',
  'VEJALPUR': 'South West Zone',
  'JODHPUR': 'South West Zone',
  'MAKTAMPURA': 'South West Zone',
};

export const AHMEDABAD_ZONES_LIST = [
  'All 7 Zones',
  'Central Zone',
  'East Zone',
  'North Zone',
  'South Zone',
  'West Zone',
  'North West Zone',
  'South West Zone',
];

// Carto Basemaps Authenticated API Key
export const CARTO_API_KEY = 'cb1_4gxl_1_927a06836d8a693fe5403957';

// Real Google Maps & Authenticated Cartographic Basemaps
export const BASEMAP_TILES = {
  google_streets: {
    id: 'google_streets',
    name: 'Google Maps (Roadmap)',
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
  },
  google_hybrid: {
    id: 'google_hybrid',
    name: 'Google Maps (Satellite Hybrid)',
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
  },
  google_terrain: {
    id: 'google_terrain',
    name: 'Google Maps (Terrain)',
    url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
  },
  carto: {
    id: 'carto',
    name: 'Municipal Carto',
    url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${CARTO_API_KEY}`,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  },
  light: {
    id: 'light',
    name: 'Clean Light',
    url: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?api_key=${CARTO_API_KEY}`,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  },
  osm: {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  dark: {
    id: 'dark',
    name: 'Tactical Dark',
    url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=${CARTO_API_KEY}`,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, GIS User Community',
    maxZoom: 18,
  },
};

// Official Ahmedabad Geographic Bounding Box
export const AHMEDABAD_CENTER = [23.0272, 72.5754];
export const AHMEDABAD_BOUNDS = [
  [22.9139, 72.4493], // Southwest
  [23.1405, 72.7015], // Northeast
];

/**
 * Normalizes raw ward boundary string like '48 RAMOL HATHIJAN' -> 'Ramol Hathijan'
 */
export function cleanWardDisplayName(rawName) {
  if (!rawName || typeof rawName !== 'string') return 'Unknown Ward';
  const cleaned = rawName.replace(/^\d+\s+/, '').trim();
  if (!cleaned) return rawName.trim();
  return cleaned
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Derives the active risk score and status for the selected layer
 */
export function getWardLayerMetric(ward, layer) {
  if (!ward) {
    return {
      score: null,
      displayVal: 'No Data',
      status: 'UNAVAILABLE',
      label: 'Unavailable',
      isAvailable: false,
    };
  }

  switch (layer) {
    case 'heat': {
      const score = ward.heat_risk?.normalized_score ?? ward.heat_risk?.score;
      const wbgt = ward.heat_risk?.effective_wbgt_c;
      const status =
        ward.heat_risk?.category ||
        (score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MODERATE' : 'LOW');
      return {
        score: score != null ? Math.round(score) : null,
        displayVal: wbgt != null ? `${wbgt.toFixed(1)}°C WBGT` : score != null ? `${Math.round(score)}/100` : 'N/A',
        status: score != null ? status : 'UNAVAILABLE',
        label: 'Thermal Heat Stress',
        unit: 'WBGT / Thermal Risk Index',
        isAvailable: score != null,
      };
    }
    case 'waterlogging': {
      const score =
        ward.water_risk?.waterlogging_score ??
        ward.water_risk?.contributing_factors?.waterlogging?.score ??
        ward.water_risk?.score;
      const status =
        ward.water_risk?.category ||
        (score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MODERATE' : 'LOW');
      return {
        score: score != null ? Math.round(score) : null,
        displayVal: score != null ? `${Math.round(score)}/100` : 'N/A',
        status: score != null ? status : 'UNAVAILABLE',
        label: 'Waterlogging & Flood Risk',
        unit: 'Drainage Surcharge Score',
        isAvailable: score != null,
      };
    }
    case 'shortage': {
      const score =
        ward.water_risk?.water_shortage_score ??
        ward.water_risk?.contributing_factors?.water_shortage?.score;
      const status =
        score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MODERATE' : 'LOW';
      return {
        score: score != null ? Math.round(score) : null,
        displayVal: score != null ? `${Math.round(score)}/100` : 'N/A',
        status: score != null ? status : 'UNAVAILABLE',
        label: 'Water Scarcity & Deficit',
        unit: 'Urban Potable Scarcity Index',
        isAvailable: score != null,
      };
    }
    case 'svi': {
      const factor =
        ward.heat_risk?.baseline_vulnerability ??
        ward.baseline_heat_risk ??
        ward.slum_density ??
        (ward.vulnerability_index != null ? ward.vulnerability_index : null);
      const score = factor != null ? Math.round(factor * 100) : null;
      const status =
        score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MODERATE' : 'LOW';
      return {
        score,
        displayVal: score != null ? `${score}% SVI` : 'N/A',
        status: score != null ? status : 'UNAVAILABLE',
        label: 'Social Vulnerability (SVI)',
        unit: 'Demographic Slum Density',
        isAvailable: score != null,
      };
    }
    case 'combined':
    default: {
      const score = ward.combined_risk_score ?? ward.composite_score;
      const status =
        ward.combined_risk_category ||
        (score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MODERATE' : 'LOW');
      return {
        score: score != null ? Math.round(score) : null,
        displayVal: score != null ? `${Math.round(score)}/100` : 'N/A',
        status: score != null ? status : 'UNAVAILABLE',
        label: 'Combined Multi-Hazard',
        unit: 'Unified Priority Score',
        isAvailable: score != null,
      };
    }
  }
}

/**
 * Returns consistent risk fill, stroke, text, and badge colors based on 0-100 score
 */
export function getRiskColor(score, isAvailable = true) {
  if (!isAvailable || score === null || score === undefined || isNaN(score)) {
    return {
      fill: '#94A3B8',
      fillOpacity: 0.35,
      stroke: '#64748B',
      strokeWidth: 1.5,
      dashArray: '4, 4',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-700',
      status: 'UNAVAILABLE',
    };
  }
  if (score >= 75) {
    return {
      fill: '#EF4444',
      fillOpacity: 0.72,
      stroke: '#B91C1C',
      strokeWidth: 1.4,
      dashArray: null,
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-800',
      status: 'CRITICAL',
    };
  }
  if (score >= 50) {
    return {
      fill: '#F97316',
      fillOpacity: 0.70,
      stroke: '#C2410C',
      strokeWidth: 1.4,
      dashArray: null,
      badgeBg: 'bg-orange-100',
      badgeText: 'text-orange-800',
      status: 'HIGH',
    };
  }
  if (score >= 25) {
    return {
      fill: '#F59E0B',
      fillOpacity: 0.68,
      stroke: '#B45309',
      strokeWidth: 1.3,
      dashArray: null,
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800',
      status: 'MODERATE',
    };
  }
  return {
    fill: '#10B981',
    fillOpacity: 0.65,
    stroke: '#047857',
    strokeWidth: 1.2,
    dashArray: null,
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    status: 'LOW',
  };
}

/**
 * Robust matching between GeoJSON feature and live backend ward data
 */
export function matchFeatureToWard(feature, liveWards = []) {
  if (!feature || !feature.properties) return null;
  const rawName = (feature.properties.Name || feature.properties.name || '').trim();
  const rawUpper = rawName.toUpperCase();
  const cleanName = cleanWardDisplayName(rawName);
  const cleanLower = cleanName.toLowerCase();

  // 1. Match by official_name exactly (e.g. "36 DANILIMDA")
  let match = liveWards.find(
    (w) => w.official_name && w.official_name.trim().toUpperCase() === rawUpper
  );

  // 2. Match by clean name (e.g. "Danilimda")
  if (!match) {
    match = liveWards.find((w) => {
      if (!w.name) return false;
      const wName = w.name.trim().toLowerCase();
      return wName === cleanLower || cleanLower.includes(wName) || wName.includes(cleanLower);
    });
  }

  // 3. Match by canonical ID (e.g. W1, W36)
  if (!match) {
    const numMatch = rawName.match(/^(\d+)/);
    if (numMatch) {
      const numStr = numMatch[1];
      const numInt = parseInt(numStr, 10);
      match = liveWards.find((w) => {
        if (!w.id) return false;
        const idUpper = w.id.toUpperCase();
        return idUpper === `W${numStr}` || idUpper === `W${numInt}`;
      });
    }
  }

  // 4. Match by geojson_feature_index
  if (!match && feature._featureIndex !== undefined) {
    match = liveWards.find(
      (w) =>
        w.geographic_identifier?.geojson_feature_index === feature._featureIndex ||
        w.ward_index === feature._featureIndex
    );
  }

  return match || null;
}
