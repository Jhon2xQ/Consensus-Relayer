import type { ZodError } from "zod";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: number;
}

export function ok<T>(message: string, data: T): ApiResponse<T> {
  return { success: true, message, data, timestamp: Date.now() };
}

export function fail<T = null>(message: string, data: T = null as T): ApiResponse<T> {
  return { success: false, message, data, timestamp: Date.now() };
}

export function notFound(message: string = "Not Found"): ApiResponse<null> {
  return fail(message);
}

export interface FormattedZodIssue {
  field: string;
  message: string;
  code: string;
}

/**
 * Map a ZodError to the stable { field, message, code } shape used across
 * both the global error handler and the per-controller validation responses.
 * Keeping a single source of truth for the shape makes it predictable for
 * API consumers.
 */
export function formatZodIssues(err: ZodError): FormattedZodIssue[] {
  return err.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

