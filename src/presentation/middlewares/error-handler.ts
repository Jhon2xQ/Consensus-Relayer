import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { DomainException } from "../../domain/exceptions/domain.exception";
import { ApiResponse } from "./api-response";

export const errorHandler = (err: Error, c: Context) => {
  if (err instanceof DomainException) {
    console.error(`[${err.name}] ${err.statusCode}: ${err.message}`);
    return c.json(ApiResponse.error(err.message), err.statusCode as any);
  }

  if (err instanceof HTTPException) {
    console.error(`[HTTPException] ${err.status}: ${err.message}`);
    return c.json(ApiResponse.error(err.message), err.status);
  }

  if (err instanceof ZodError) {
    console.error(`[ZodError] Validation failed`);
    const issues = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));
    return c.json(
      ApiResponse.error("Validation error", { details: issues }),
      400,
    );
  }

  console.error(`[UnexpectedError]`, err);
  return c.json(ApiResponse.error("Internal server error"), 500);
};
