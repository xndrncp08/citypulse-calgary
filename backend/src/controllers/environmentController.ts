import { Request, Response, NextFunction } from "express";
import * as environmentService from "../services/environmentService";
import { parsePagination } from "../utils/pagination";

export async function getWeather(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pagination = parsePagination(req);
    const result = await environmentService.getWeather(pagination);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAirQuality(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pagination = parsePagination(req);
    const result = await environmentService.getAirQuality(pagination);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
