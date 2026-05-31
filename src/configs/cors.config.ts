import type { cors } from "hono/cors";

type CorsOptions = Parameters<typeof cors>[0];

export const corsConfig: CorsOptions = {
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
};
