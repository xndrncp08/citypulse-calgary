import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppError } from "../middleware/errorHandler";
import prisma from "../database/client";

const predictSchema = z.object({
  start_lat: z.number().min(-90).max(90),
  start_lng: z.number().min(-180).max(180),
  end_lat: z.number().min(-90).max(90),
  end_lng: z.number().min(-180).max(180),
  departure_time: z.string().datetime(),
});

type CongestionLevel = "low" | "moderate" | "high" | "severe";

export async function predict(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = predictSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors[0]?.message ?? "Invalid input");
    }

    const { start_lat, start_lng, end_lat, end_lng, departure_time } = parsed.data;

    // Haversine distance
    const R = 6371;
    const dLat = ((end_lat - start_lat) * Math.PI) / 180;
    const dLng = ((end_lng - start_lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((start_lat * Math.PI) / 180) *
        Math.cos((end_lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Find incidents near corridor
    const midLat = (start_lat + end_lat) / 2;
    const midLng = (start_lng + end_lng) / 2;
    const buffer = Math.max(0.05, distanceKm / 111);
    const departureDate = new Date(departure_time);
    const hour = departureDate.getUTCHours();

    const recentIncidents = await prisma.trafficIncident.count({
      where: {
        latitude: { gte: midLat - buffer, lte: midLat + buffer },
        longitude: { gte: midLng - buffer, lte: midLng + buffer },
        startTime: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      },
    });

    const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);
    const peakMultiplier = isPeakHour ? 1.4 : 1.0;
    const incidentMultiplier = 1 + recentIncidents * 0.15;

    const baseSpeedKmh = 40;
    const effectiveSpeed = baseSpeedKmh / (peakMultiplier * incidentMultiplier);
    const estimatedMinutes = Math.round((distanceKm / effectiveSpeed) * 60);

    const congestionScore = peakMultiplier * incidentMultiplier;
    const congestion_level: CongestionLevel =
      congestionScore < 1.1 ? "low"
      : congestionScore < 1.3 ? "moderate"
      : congestionScore < 1.6 ? "high"
      : "severe";

    const delay_risk = Math.min(0.95, recentIncidents * 0.1 + (isPeakHour ? 0.3 : 0));

    res.json({
      estimated_commute_time: estimatedMinutes,
      congestion_level,
      delay_risk: Math.round(delay_risk * 100) / 100,
      distance_km: Math.round(distanceKm * 10) / 10,
      nearby_incidents: recentIncidents,
    });
  } catch (err) {
    next(err);
  }
}
