import { Request } from "express";
import { config } from "../config";

export interface PaginationParams {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export function parsePagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string ?? "1", 10));
  const limit = Math.min(
    config.pagination.maxLimit,
    Math.max(1, parseInt(req.query.limit as string ?? String(config.pagination.defaultLimit), 10))
  );
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function paginate<T>(
  data: T[],
  total: number,
  { page, limit }: PaginationParams
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
