import type { cors } from "hono/cors";
import { env } from "./env.config";

export type OriginConfig = string | string[];

export function parseOrigins(raw: string): OriginConfig {
  if (raw === "*") return "*";
  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * Match a request origin against the allowed origins.
 * Returns the origin value to use in `Access-Control-Allow-Origin`,
 * or `null` if the origin is not allowed.
 */
export function getAllowOrigin(requestOrigin: string, origins: OriginConfig): string | null {
  if (origins === "*") return "*";
  if (typeof origins === "string") return origins === requestOrigin ? origins : null;
  return origins.includes(requestOrigin) ? requestOrigin : null;
}

const origins = parseOrigins(env.CORS_ORIGIN);

export const corsConfig: Parameters<typeof cors>[0] = {
  origin: origins,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 600,
  exposeHeaders: ["Content-Length"],
};
