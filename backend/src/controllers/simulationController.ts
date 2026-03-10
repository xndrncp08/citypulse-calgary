import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppError } from "../middleware/errorHandler";

const simulationSchema = z.object({
  road_closure_location: z.object({ lat: z.number(), lng: z.number() }).optional(),
  weather_condition: z.enum(["clear", "rain", "snow", "ice", "fog"]).default("clear"),
  time_of_day: z.enum(["morning_peak", "midday", "evening_peak", "overnight"]),
});

const weatherImpact: Record<string, number> = {
  clear: 0, rain: 0.15, snow: 0.35, ice: 0.5, fog: 0.2,
};

const timeImpact: Record<string, number> = {
  morning_peak: 0.35, midday: 0.1, evening_peak: 0.4, overnight: -0.1,
};

export async function run(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = simulationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors[0]?.message ?? "Invalid input");
    }

    const { weather_condition, time_of_day, road_closure_location } = parsed.data;

    const weather = weatherImpact[weather_condition] ?? 0;
    const time = timeImpact[time_of_day] ?? 0;
    const closure = road_closure_location ? 0.2 : 0;

    const congestion_increase = Math.round((weather + time + closure) * 100);
    const commute_delay = Math.round(congestion_increase * 0.6);
    const transit_demand_change = Math.round(
      weather * 15 + closure * 20 + (time_of_day === "morning_peak" ? 10 : 0)
    );

    res.json({
      congestion_increase: `${congestion_increase}%`,
      commute_delay: `${commute_delay} min`,
      transit_demand_change: `${transit_demand_change > 0 ? "+" : ""}${transit_demand_change}%`,
      factors: {
        weather: `${Math.round(weather * 100)}%`,
        time_of_day: `${Math.round(time * 100)}%`,
        road_closure: `${Math.round(closure * 100)}%`,
      },
    });
  } catch (err) {
    next(err);
  }
}
