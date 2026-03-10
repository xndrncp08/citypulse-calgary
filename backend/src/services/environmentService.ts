import prisma from "../database/client";
import { withCache } from "../utils/cache";
import { config } from "../config";
import { paginate, PaginationParams } from "../utils/pagination";

export async function getWeather(pagination: PaginationParams) {
  const cacheKey = `environment:weather:${pagination.page}`;
  return withCache(cacheKey, config.cache.weather, async () => {
    const [readings, total] = await Promise.all([
      prisma.weatherReading.findMany({
        orderBy: { timestamp: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.weatherReading.count(),
    ]);
    return paginate(readings, total, pagination);
  });
}

export async function getAirQuality(pagination: PaginationParams) {
  const cacheKey = `environment:air-quality:${pagination.page}`;
  return withCache(cacheKey, config.cache.airQuality, async () => {
    const [readings, total] = await Promise.all([
      prisma.airQualityReading.findMany({
        orderBy: { timestamp: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.airQualityReading.count(),
    ]);
    return paginate(readings, total, pagination);
  });
}
