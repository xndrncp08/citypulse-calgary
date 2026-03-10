import prisma from "../database/client";
import { withCache } from "../utils/cache";
import { config } from "../config";
import { paginate, PaginationParams } from "../utils/pagination";

export async function getRecentIncidents(
  pagination: PaginationParams,
  incidentType?: string
) {
  const cacheKey = `traffic:incidents:${pagination.page}:${pagination.limit}:${incidentType ?? "all"}`;

  return withCache(cacheKey, config.cache.trafficIncidents, async () => {
    const where = incidentType ? { incidentType } : {};

    const [incidents, total] = await Promise.all([
      prisma.trafficIncident.findMany({
        where,
        orderBy: { startTime: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.trafficIncident.count({ where }),
    ]);

    return paginate(incidents, total, pagination);
  });
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
}

export async function getHeatmapData(): Promise<HeatmapPoint[]> {
  return withCache("traffic:heatmap", config.cache.trafficHeatmap, async () => {
    // Aggregate incidents by rounded lat/lng buckets (0.005 degree ≈ 500m)
    const incidents = await prisma.trafficIncident.findMany({
      select: { latitude: true, longitude: true },
      where: {
        startTime: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // last 30 days
        },
      },
    });

    const buckets = new Map<string, number>();
    for (const { latitude, longitude } of incidents) {
      const lat = Math.round(latitude * 200) / 200;
      const lng = Math.round(longitude * 200) / 200;
      const key = `${lat},${lng}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    return Array.from(buckets.entries()).map(([key, weight]) => {
      const [lat, lng] = key.split(",").map(Number);
      return { lat: lat!, lng: lng!, weight };
    });
  });
}

export async function getHistoricalIncidents(
  from: Date,
  to: Date,
  pagination: PaginationParams
) {
  const cacheKey = `traffic:history:${from.toISOString()}:${to.toISOString()}:${pagination.page}`;

  return withCache(cacheKey, config.cache.trafficIncidents, async () => {
    const where = { startTime: { gte: from, lte: to } };

    const [incidents, total] = await Promise.all([
      prisma.trafficIncident.findMany({
        where,
        orderBy: { startTime: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.trafficIncident.count({ where }),
    ]);

    return paginate(incidents, total, pagination);
  });
}
