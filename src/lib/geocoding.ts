export interface Coordinates {
  lat: number;
  lng: number;
}

// Static cache for common cities to avoid API calls and speed up loading
const CITY_CACHE: Record<string, Coordinates> = {
  "SALVADOR": { lat: -12.9714, lng: -38.5014 },
  "FEIRA DE SANTANA": { lat: -12.2664, lng: -38.9662 },
  "BELO HORIZONTE": { lat: -19.9167, lng: -43.9345 },
  "SÃO PAULO": { lat: -23.5505, lng: -46.6333 },
  "RIO DE JANEIRO": { lat: -22.9068, lng: -43.1729 },
  "RECIFE": { lat: -8.0578, lng: -34.8778 },
  "CURITIBA": { lat: -25.4284, lng: -49.2733 },
  "PORTO ALEGRE": { lat: -30.0346, lng: -51.2177 },
  "POUSO ALEGRE": { lat: -22.2301, lng: -45.9341 },
  "CONTAGEM": { lat: -19.9322, lng: -44.0539 },
  "BETIM": { lat: -19.9678, lng: -44.1983 },
  "UBERLÂNDIA": { lat: -18.9186, lng: -48.2772 },
  "JOINVILLE": { lat: -26.3044, lng: -48.8456 },
  "FLORIANÓPOLIS": { lat: -27.5954, lng: -48.5480 },
  "NATAL": { lat: -5.7945, lng: -35.2110 },
  "MOSSORÓ": { lat: -5.1880, lng: -37.3441 },
  "IRECÊ": { lat: -11.3042, lng: -41.8558 },
  "JACOBINA": { lat: -11.1811, lng: -40.5186 },
  "VITÓRIA DA CONQUISTA": { lat: -14.8661, lng: -40.8394 },
  "MANAUS": { lat: -3.1190, lng: -60.0217 },
  "FORTALEZA": { lat: -3.7172, lng: -38.5433 },
  "BRASÍLIA": { lat: -15.7801, lng: -47.9292 },
};

/**
 * Geocode a city name to coordinates. 
 * Uses a static cache for performance and OpenStreetMap Nominatim as fallback.
 */
export async function geocodeCity(city: string, state?: string): Promise<Coordinates | null> {
  const normalized = city.trim().toUpperCase();
  
  // 1. Check Cache
  if (CITY_CACHE[normalized]) return CITY_CACHE[normalized];

  // 2. Fallback to Nominatim (OpenStreetMap)
  try {
    const query = `${city}${state ? `, ${state}` : ""}, Brazil`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'User-Agent': 'ViagensTecnicasElite-App'
      }
    });

    const data = await response.json();
    if (data && data.length > 0) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
      
      // Update memory cache for this session
      CITY_CACHE[normalized] = coords;
      return coords;
    }
  } catch (error) {
    console.error(`Geocoding failed for ${city}:`, error);
  }

  return null;
}
