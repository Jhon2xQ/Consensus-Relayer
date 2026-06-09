import type { cors } from "hono/cors";
import { env } from "./env.config";

const parseOrigins = (raw: string): string | string[] => {
  if (raw === "*") return "*";
  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
};

export const corsConfig: Parameters<typeof cors>[0] = {
  origin: parseOrigins(env.CORS_ORIGIN),
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
};
