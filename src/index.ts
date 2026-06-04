import { cors } from "hono/cors";
import { app } from "./routes";
import { errorHandler } from "./presentation/middlewares/error-handler";
import { corsConfig } from "./configs/cors.config";
import { env } from "./configs/env.config";
import { notFound } from "./common/responses";

// CORS
app.use("*", cors(corsConfig));

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
