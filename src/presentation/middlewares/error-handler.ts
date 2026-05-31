import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

export const errorHandler = (err: Error, c: Context) => {
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        message: err.message,
        data: null,
        timestamp: Date.now(),
      },
      err.status,
    );
  }

  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        message: "Validation error",
        data: {
          details: err.flatten((e: any) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        timestamp: Date.now(),
      },
      400,
    );
  }

  console.error("Unexpected error:", err);
  return c.json(
    {
      success: false,
      message: "Internal server error",
      data: null,
      timestamp: Date.now(),
    },
    500,
  );
};
