import { useQuery, useMutation } from "@tanstack/react-query";
import {
  trafficApi,
  transitApi,
  environmentApi,
  bikesApi,
  commuteApi,
  simulationApi,
} from "../services/api";

// ─── Traffic ──────────────────────────────────────────────────────────────────

export function useTrafficIncidents(params?: { page?: number; limit?: number; type?: string }) {
  return useQuery({
    queryKey: ["traffic", "incidents", params],
    queryFn: () => trafficApi.incidents(params),
    refetchInterval: 120_000, // 2 minutes
  });
}

export function useTrafficHeatmap() {
  return useQuery({
    queryKey: ["traffic", "heatmap"],
    queryFn: trafficApi.heatmap,
    refetchInterval: 300_000,
  });
}

export function useTrafficHistory(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: ["traffic", "history", from, to],
    queryFn: () => trafficApi.history(from, to),
    enabled,
  });
}

// ─── Transit ──────────────────────────────────────────────────────────────────

export function useTransitRoutes() {
  return useQuery({
    queryKey: ["transit", "routes"],
    queryFn: () => transitApi.routes(),
    staleTime: 3_600_000, // 1 hour
  });
}

export function useTransitStops() {
  return useQuery({
    queryKey: ["transit", "stops"],
    queryFn: () => transitApi.stops(),
    staleTime: 3_600_000,
  });
}

export function useTransitPerformance() {
  return useQuery({
    queryKey: ["transit", "performance"],
    queryFn: transitApi.performance,
    refetchInterval: 300_000,
  });
}

// ─── Environment ──────────────────────────────────────────────────────────────

export function useWeather() {
  return useQuery({
    queryKey: ["environment", "weather"],
    queryFn: () => environmentApi.weather(),
    refetchInterval: 600_000,
  });
}

export function useAirQuality() {
  return useQuery({
    queryKey: ["environment", "air-quality"],
    queryFn: () => environmentApi.airQuality(),
    refetchInterval: 300_000,
  });
}

// ─── Bikes ────────────────────────────────────────────────────────────────────

export function useBikeCounters() {
  return useQuery({
    queryKey: ["bikes", "counters"],
    queryFn: bikesApi.counters,
    staleTime: 3_600_000,
  });
}

// ─── Commute ──────────────────────────────────────────────────────────────────

export function useCommutePrediction() {
  return useMutation({ mutationFn: commuteApi.predict });
}

// ─── Simulation ───────────────────────────────────────────────────────────────

export function useSimulation() {
  return useMutation({ mutationFn: simulationApi.run });
}
