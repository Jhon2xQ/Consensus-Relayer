import { Hono } from "hono";
import { cors } from "hono/cors";
import { app } from "./routes";
import { errorHandler } from "./presentation/middlewares/error-handler";
import { corsConfig } from "./configs/cors.config";
import { env } from "./configs/env.config";

// CORS
app.use("*", cors(corsConfig));

// Error handler
app.onError(errorHandler);

// Not Found
app.notFound((c) => {
  return c.json({ success: false, error: "Not Found" }, 404);
});

const port = env.PORT || "3000";

console.log(`
🚀 Server running at http://localhost:${port}
🔧 Contract: Semaphore ZK
`);

export default {
  port,
  fetch: app.fetch,
};
