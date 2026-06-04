import type { cors } from "hono/cors";

export const corsConfig: Parameters<typeof cors>[0] = {
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
};
