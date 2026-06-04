import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { DomainException } from "../../domain/exceptions/domain.exception";
import { fail, formatZodIssues } from "../../common/responses";

export const errorHandler = (err: Error, c: Context) => {
  if (err instanceof DomainException) {
    console.error(`[${err.name}] ${err.statusCode}: ${err.message}`);
    return c.json(fail(err.message), err.statusCode as any);
  }

  if (err instanceof HTTPException) {
    console.error(`[HTTPException] ${err.status}: ${err.message}`);
    return c.json(fail(err.message), err.status);
  }

  if (err instanceof ZodError) {
    console.error(`[ZodError] Validation failed`);
    return c.json(fail("Validation error", { details: formatZodIssues(err) }), 400);
  }

  console.error(`[UnexpectedError]`, err);
  return c.json(fail("Internal server error"), 500);
};
