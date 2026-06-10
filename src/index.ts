import { errorHandler } from "./presentation/middlewares/error-handler";
import { corsConfig } from "./configs/cors.config";
import { env } from "./configs/env.config";
import { ok, notFound } from "./common/responses";
import { semaphoreRoutes } from "./routes/semaphore.routes";
import { Hono } from "hono";

const app = new Hono();

app.use("/api/*", corsConfig);

app.get("/health", (c) => {
  return c.json(
    ok("Service is healthy", {
      status: "ok",
      timestamp: new Date().toISOString(),
      contract: {
        type: "Semaphore",
        address: env.CONTRACT_ADDRESS,
      },
    }),
  );
});

app.route("/api/semaphore", semaphoreRoutes);

app.onError(errorHandler);

app.notFound((c) => {
  return c.json(notFound("Route not found"), 404);
});

export default app;
