import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as trafficService from "../services/trafficService";
import { parsePagination } from "../utils/pagination";
import { AppError } from "../middleware/errorHandler";

export async function getIncidents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pagination = parsePagination(req);
    const incidentType = req.query.type as string | undefined;
    const result = await trafficService.getRecentIncidents(pagination, incidentType);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getHeatmap(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await trafficService.getHeatmapData();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

const historySchema = z.object({
  from: z.string().datetime({ message: "from must be ISO 8601" }),
  to: z.string().datetime({ message: "to must be ISO 8601" }),
});

export async function getHistory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = historySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors[0]?.message ?? "Invalid query");
    }

    const pagination = parsePagination(req);
    const { from, to } = parsed.data;

    const result = await trafficService.getHistoricalIncidents(
      new Date(from),
      new Date(to),
      pagination
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}
