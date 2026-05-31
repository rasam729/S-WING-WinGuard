// road_layers.js - offline road layers for Leaflet map
// Defines GeoJSON data for National Highways (NH), State Highways (SH), and Major District Roads (MDR)
// and creates toggleable layers with distinct colors and labels.

// --- GeoJSON data (simplified demo) ---
const roadGeoJSON = {
  "type": "FeatureCollection",
  "features": [
    // National Highway example
    {
      "type": "Feature",
      "properties": { "road_type": "NH", "name": "NH 48" },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [77.55, 12.97],
          [77.70, 12.90]
        ]
      }
    },
    // State Highway example
    {
      "type": "Feature",
      "properties": { "road_type": "SH", "name": "SH 9" },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [77.60, 12.95],
          [77.65, 12.85]
        ]
      }
    },
    // Major District Road example
    {
      "type": "Feature",
      "properties": { "road_type": "MDR", "name": "MDR 12" },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [77.58, 12.98],
          [77.63, 12.92]
        ]
      }
    }
  ]
};

// Styling for each road type
const ROAD_STYLES = {
  NH: { color: '#D32F2F', weight: 4, opacity: 0.8 },      // dark red
  SH: { color: '#1976D2', weight: 3, opacity: 0.7 },      // blue
  MDR: { color: '#388E3C', weight: 2, opacity: 0.6 }      // green
};

let nhLayer = null;
let shLayer = null;
let mdrLayer = null;

function createRoadLayers(map) {
  // Filter features by road_type and create separate GeoJSON layers
  nhLayer = L.geoJSON(roadGeoJSON, {
    filter: f => f.properties.road_type === 'NH',
    style: ROAD_STYLES.NH,
    onEachFeature: (feature, layer) => {
      const name = feature.properties.name || 'NH';
      layer.bindTooltip(name, { permanent: true, direction: 'center', className: 'road-label' });
    }
  }).addTo(map);

  shLayer = L.geoJSON(roadGeoJSON, {
    filter: f => f.properties.road_type === 'SH',
    style: ROAD_STYLES.SH,
    onEachFeature: (feature, layer) => {
      const name = feature.properties.name || 'SH';
      layer.bindTooltip(name, { permanent: true, direction: 'center', className: 'road-label' });
    }
  }).addTo(map);

  mdrLayer = L.geoJSON(roadGeoJSON, {
    filter: f => f.properties.road_type === 'MDR',
    style: ROAD_STYLES.MDR,
    onEachFeature: (feature, layer) => {
      const name = feature.properties.name || 'MDR';
      layer.bindTooltip(name, { permanent: true, direction: 'center', className: 'road-label' });
    }
  }).addTo(map);
}

// UI toggle functions – called from HTML checkboxes
function toggleRoadLayer(type, checked) {
  if (!leafletMap) return;
  if (type === 'NH') {
    if (checked) nhLayer.addTo(leafletMap); else nhLayer.remove();
  } else if (type === 'SH') {
    if (checked) shLayer.addTo(leafletMap); else shLayer.remove();
  } else if (type === 'MDR') {
    if (checked) mdrLayer.addTo(leafletMap); else mdrLayer.remove();
  }
}

// Hook into initMap after the base map is created
function initRoadLayers() {
  if (!leafletMap) return;
  createRoadLayers(leafletMap);
  // Ensure layers are visible by default
  document.getElementById('nh-layer-checkbox').checked = true;
  document.getElementById('sh-layer-checkbox').checked = true;
  document.getElementById('mdr-layer-checkbox').checked = true;
}

// Export for external call from main script
window.initRoadLayers = initRoadLayers;
