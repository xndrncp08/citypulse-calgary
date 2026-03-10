const BASE_URL = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface TrafficIncident {
  id: string;
  incidentId: string;
  description: string | null;
  latitude: number;
  longitude: number;
  incidentType: string;
  startTime: string;
  endTime: string | null;
  locationDescription: string | null;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
}

export interface TransitRoute {
  id: string;
  routeId: string;
  routeName: string;
}

export interface TransitStop {
  id: string;
  stopId: string;
  stopName: string;
  latitude: number;
  longitude: number;
}

export interface WeatherReading {
  id: string;
  timestamp: string;
  temperature: number | null;
  windSpeed: number | null;
  precipitation: number | null;
  humidity: number | null;
}

export interface AirQualityReading {
  id: string;
  timestamp: string;
  aqhi: number;
  stationName: string;
  latitude: number;
  longitude: number;
}

export interface BikeCounter {
  id: string;
  counterId: string;
  locationName: string;
  latitude: number;
  longitude: number;
}

export interface CommutePrediction {
  estimated_commute_time: number;
  congestion_level: "low" | "moderate" | "high" | "severe";
  delay_risk: number;
  distance_km: number;
  nearby_incidents: number;
}

export interface SimulationResult {
  congestion_increase: string;
  commute_delay: string;
  transit_demand_change: string;
  factors: { weather: string; time_of_day: string; road_closure: string };
}

// ─── Traffic ──────────────────────────────────────────────────────────────────

export const trafficApi = {
  incidents: (params?: { page?: number; limit?: number; type?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<Paginated<TrafficIncident>>(`/api/traffic/incidents${q ? `?${q}` : ""}`);
  },
  heatmap: () =>
    request<{ data: HeatmapPoint[] }>("/api/traffic/heatmap"),
  history: (from: string, to: string, page = 1) =>
    request<Paginated<TrafficIncident>>(
      `/api/traffic/history?from=${from}&to=${to}&page=${page}`
    ),
};

// ─── Transit ──────────────────────────────────────────────────────────────────

export const transitApi = {
  routes: (page = 1) =>
    request<Paginated<TransitRoute>>(`/api/transit/routes?page=${page}&limit=500`),
  stops: (page = 1) =>
    request<Paginated<TransitStop>>(`/api/transit/stops?page=${page}&limit=500`),
  performance: () =>
    request<{ data: { totalRoutes: number; totalStops: number } }>("/api/transit/performance"),
};

// ─── Environment ──────────────────────────────────────────────────────────────

export const environmentApi = {
  weather: (page = 1) =>
    request<Paginated<WeatherReading>>(`/api/environment/weather?page=${page}`),
  airQuality: (page = 1) =>
    request<Paginated<AirQualityReading>>(`/api/environment/air-quality?page=${page}`),
};

export interface BikeReading {
  id: string;
  counterId: string;
  date: string;
  bikeCount: number;
  counter?: { locationName: string; latitude: number; longitude: number };
}

// ─── Bikes ────────────────────────────────────────────────────────────────────

export const bikesApi = {
  counters: () => request<Paginated<BikeCounter>>("/api/bikes/counters?limit=200"),
  usage: (counterId?: string) => {
    const q = counterId ? `?counterId=${counterId}` : "";
    return request<Paginated<BikeReading>>(`/api/bikes/usage${q}`);
  },
};

// ─── Commute ──────────────────────────────────────────────────────────────────

export const commuteApi = {
  predict: (body: {
    start_lat: number;
    start_lng: number;
    end_lat: number;
    end_lng: number;
    departure_time: string;
  }) => request<CommutePrediction>("/api/commute/predict", { method: "POST", body: JSON.stringify(body) }),
};

// ─── Simulation ───────────────────────────────────────────────────────────────

export const simulationApi = {
  run: (body: {
    weather_condition: string;
    time_of_day: string;
    road_closure_location?: { lat: number; lng: number };
  }) => request<SimulationResult>("/api/simulation/run", { method: "POST", body: JSON.stringify(body) }),
};
