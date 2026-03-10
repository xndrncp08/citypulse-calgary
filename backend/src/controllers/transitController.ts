import { Request, Response, NextFunction } from "express";
import * as transitService from "../services/transitService";
import { parsePagination } from "../utils/pagination";

export async function getRoutes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pagination = parsePagination(req);
    const result = await transitService.getRoutes(pagination);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getStops(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pagination = parsePagination(req);
    const result = await transitService.getStops(pagination);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getPerformance(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await transitService.getPerformanceMetrics();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}
