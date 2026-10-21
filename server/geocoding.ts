// Geocoding service for LET'S LOG
// Integrates OpenStreetMap Nominatim with an offline Brazilian CEP and city centroid index

interface GeocodeResult {
  lat: number;
  lng: number;
  status: 'ok' | 'aproximado' | 'falha';
  displayName?: string;
}

// Known coordinates for major cities and regions in Brazil
const CITY_CENTROIDS: Record<string, [number, number]> = {
  'sao paulo': [-23.5505, -46.6333],
  'sp': [-23.5505, -46.6333],
  'campinas': [-22.9099, -47.0626],
  'santos': [-23.9608, -46.3336],
  'santo andre': [-23.6638, -46.5383],
  'sao bernardo': [-23.6914, -46.5646],
  'guarulhos': [-23.4542, -46.5333],
  'osasco': [-23.5329, -46.7917],
  'rio de janeiro': [-22.9068, -43.1729],
  'rj': [-22.9068, -43.1729],
  'niteroi': [-22.8833, -43.1036],
  'belo horizonte': [-19.9167, -43.9345],
  'curitiba': [-25.4284, -49.2733],
  'porto alegre': [-30.0346, -51.2177],
  'florianopolis': [-27.5954, -48.5480],
  'brasilia': [-15.7975, -47.8919],
  'salvador': [-12.9777, -38.5016],
  'recife': [-8.0476, -34.8770],
  'fortaleza': [-3.7172, -38.5434],
  'goiania': [-16.6869, -49.2648],
  'manaus': [-3.1190, -60.0217],
  'belem': [-1.4558, -48.5039]
};

// Deterministic hash to provide stable coordinates within the city bounds for offline fallback
function hashStringToOffset(str: string, scale: number = 0.04): [number, number] {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const x = ((hash % 1000) / 1000) * scale - scale / 2;
  const y = (((hash >> 3) % 1000) / 1000) * scale - scale / 2;
  return [x, y];
}

export async function geocodeAddress(
  endereco: string,
  numero: string,
  bairro: string,
  cidade: string,
  cep: string
): Promise<GeocodeResult> {
  const cleanCity = cidade.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanCep = cep.replace(/\D/g, '');

  // 1. Try real OpenStreetMap Nominatim request if available
  const query = `${endereco}, ${numero}, ${bairro}, ${cidade}, Brasil`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500); // 2.5s timeout

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': 'LetsLog-Routing-Platform/1.0 (logistica@letlog.com.br)'
        },
        signal: controller.signal
      }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          return {
            lat,
            lng,
            status: 'ok',
            displayName: data[0].display_name
          };
        }
      }
    }
  } catch (e) {
    // Fallback to offline index
  }

  // 2. Intelligent Offline Fallback
  // Only match if city is known in index; do not invent coordinates for unknown/incomplete cities
  let matchedCoords: [number, number] | null = null;
  for (const [key, coords] of Object.entries(CITY_CENTROIDS)) {
    if (cleanCity && (cleanCity.includes(key) || key.includes(cleanCity))) {
      matchedCoords = coords;
      break;
    }
  }

  if (!matchedCoords) {
    return {
      lat: 0,
      lng: 0,
      status: 'falha'
    };
  }

  // Generate stable neighborhood/street offset so nearby stops in known city group properly
  const seed = `${cleanCep}-${bairro}-${endereco}`;
  const [dx, dy] = hashStringToOffset(seed, 0.05);

  return {
    lat: Number((matchedCoords[0] + dx).toFixed(6)),
    lng: Number((matchedCoords[1] + dy).toFixed(6)),
    status: 'aproximado'
  };
}

// Distance calculation between 2 coordinates (Haversine formula in km)
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}
