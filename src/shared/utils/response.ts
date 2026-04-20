import { Response } from "express";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: Record<string, unknown>;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  meta?: Record<string, unknown>,
  statusCode = 200
): void {
  const response: ApiResponse<T> = { success: true, data };
  if (meta) response.meta = meta;
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400
): void {
  const response: ApiResponse = { success: false, error: message };
  res.status(statusCode).json(response);
}

export function sendNotFound(res: Response, resource = "Resource"): void {
  sendError(res, `${resource} not found`, 404);
}

export function sendUnauthorized(res: Response): void {
  sendError(res, "Unauthorized", 401);
}

export function sendServerError(res: Response, error?: unknown): void {
  const message =
    error instanceof Error ? error.message : "Internal server error";
  sendError(res, message, 500);
}
