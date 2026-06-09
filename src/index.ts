import { cors } from "hono/cors";
import { app } from "./routes";
import { errorHandler } from "./presentation/middlewares/error-handler";
import { corsConfig, getAllowOrigin } from "./configs/cors.config";
import type { OriginConfig } from "./configs/cors.config";
import { env } from "./configs/env.config";
import { notFound } from "./common/responses";

// CORS — sets headers before the handler, but they get lost if onError replaces c.res
app.use("*", cors(corsConfig));

// Preserve CORS headers on error and not-found responses.
// Hono's compose catches errors internally via onError, which calls c.json()
// and replaces c.res with a fresh Response (without CORS headers).
// This middleware runs AFTER onError has already replaced c.res,
// so we re-apply the CORS headers to whatever response is final.
app.use("*", async (c, next) => {
  await next();

  const requestOrigin = c.req.header("origin");
  if (!requestOrigin) return;

  const allowOrigin = getAllowOrigin(requestOrigin, corsConfig.origin as OriginConfig);
  if (allowOrigin) {
    c.res.headers.set("Access-Control-Allow-Origin", allowOrigin);
    c.res.headers.set("Access-Control-Allow-Credentials", "true");
    c.res.headers.set("Vary", "Origin");
  }
});

// Error handler
app.onError(errorHandler);

// Not Found — uses the ApiResponse envelope (SCN-AR-01).
app.notFound((c) => {
  return c.json(notFound("Route not found"), 404);
});

const port = env.PORT;

export default {
  port,
  fetch: app.fetch,
};
