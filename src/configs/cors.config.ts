import { cors } from "hono/cors";
import { env } from "./env.config";

export const corsConfig = cors({
  origin: (origin) => {
    const allowed = env.CORS_ORIGIN.split(",").map((o) => o.trim());
    return allowed.includes(origin) ? origin : null;
  },
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
});
