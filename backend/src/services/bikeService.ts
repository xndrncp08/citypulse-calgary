import prisma from "../database/client";
import { withCache } from "../utils/cache";
import { config } from "../config";
import { paginate, PaginationParams } from "../utils/pagination";

export async function getCounters(pagination: PaginationParams) {
  const cacheKey = `bikes:counters:${pagination.page}:${pagination.limit}`;
  return withCache(cacheKey, config.cache.bikeCounters, async () => {
    const [counters, total] = await Promise.all([
      prisma.bikeCounter.findMany({
        orderBy: { locationName: "asc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.bikeCounter.count(),
    ]);
    return paginate(counters, total, pagination);
  });
}

export async function getUsage(
  pagination: PaginationParams,
  counterId?: string
) {
  const cacheKey = `bikes:usage:${counterId ?? "all"}:${pagination.page}`;
  return withCache(cacheKey, config.cache.bikeUsage, async () => {
    const where = counterId ? { counterId } : {};
    const [readings, total] = await Promise.all([
      prisma.bikeReading.findMany({
        where,
        orderBy: { date: "desc" },
        skip: pagination.skip,
        take: pagination.take,
        include: { counter: { select: { locationName: true, latitude: true, longitude: true } } },
      }),
      prisma.bikeReading.count({ where }),
    ]);
    return paginate(readings, total, pagination);
  });
}
