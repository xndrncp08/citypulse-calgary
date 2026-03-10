import { Request, Response, NextFunction } from "express";
import * as bikeService from "../services/bikeService";
import { parsePagination } from "../utils/pagination";

export async function getCounters(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pagination = parsePagination(req);
    const result = await bikeService.getCounters(pagination);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getUsage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pagination = parsePagination(req);
    const counterId = req.query.counterId as string | undefined;
    const result = await bikeService.getUsage(pagination, counterId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
