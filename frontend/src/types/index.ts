// Re-exported from services/api.ts for convenience
export type {
  TrafficIncident,
  HeatmapPoint,
  TransitRoute,
  TransitStop,
  WeatherReading,
  AirQualityReading,
  BikeCounter,
  CommutePrediction,
  SimulationResult,
  Paginated,
} from "../services/api";

// UI-only types
export type SortDirection = "asc" | "desc";

export interface DateRange {
  from: string; // ISO date string YYYY-MM-DD
  to: string;
}

export type CongestionLevel = "low" | "moderate" | "high" | "severe";

export type WeatherCondition = "clear" | "rain" | "snow" | "ice" | "fog";

export type TimeOfDay =
  | "morning_peak"
  | "midday"
  | "evening_peak"
  | "overnight";
