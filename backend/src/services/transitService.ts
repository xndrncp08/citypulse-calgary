import prisma from "../database/client";
import { withCache } from "../utils/cache";
import { config } from "../config";
import { paginate, PaginationParams } from "../utils/pagination";

export async function getRoutes(pagination: PaginationParams) {
  const cacheKey = `transit:routes:${pagination.page}:${pagination.limit}`;
  return withCache(cacheKey, config.cache.transitRoutes, async () => {
    const [routes, total] = await Promise.all([
      prisma.transitRoute.findMany({
        orderBy: { routeId: "asc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.transitRoute.count(),
    ]);
    return paginate(routes, total, pagination);
  });
}

export async function getStops(pagination: PaginationParams) {
  const cacheKey = `transit:stops:${pagination.page}:${pagination.limit}`;
  return withCache(cacheKey, config.cache.transitStops, async () => {
    const [stops, total] = await Promise.all([
      prisma.transitStop.findMany({
        orderBy: { stopId: "asc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.transitStop.count(),
    ]);
    return paginate(stops, total, pagination);
  });
}

export interface PerformanceMetrics {
  totalRoutes: number;
  totalStops: number;
  coverageArea: { minLat: number; maxLat: number; minLng: number; maxLng: number } | null;
}

export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  return withCache("transit:performance", config.cache.transitPerformance, async () => {
    const [totalRoutes, totalStops, bounds] = await Promise.all([
      prisma.transitRoute.count(),
      prisma.transitStop.count(),
      prisma.transitStop.aggregate({
        _min: { latitude: true, longitude: true },
        _max: { latitude: true, longitude: true },
      }),
    ]);

    const coverageArea =
      bounds._min.latitude != null
        ? {
            minLat: bounds._min.latitude,
            maxLat: bounds._max.latitude!,
            minLng: bounds._min.longitude!,
            maxLng: bounds._max.longitude!,
          }
        : null;

    return { totalRoutes, totalStops, coverageArea };
  });
}
