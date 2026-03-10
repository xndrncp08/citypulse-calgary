export const config = {
  port: parseInt(process.env.PORT ?? "3001", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL ?? "",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",

  cache: {
    // TTL in seconds
    trafficIncidents: 120,     // 2 minutes – frequently updated
    trafficHeatmap: 300,       // 5 minutes
    transitRoutes: 3600,       // 1 hour – rarely changes
    transitStops: 3600,
    transitPerformance: 300,
    weather: 600,              // 10 minutes
    airQuality: 300,
    bikeCounters: 3600,
    bikeUsage: 600,
  },

  pagination: {
    defaultLimit: 100,
    maxLimit: 500,
  },
} as const;
