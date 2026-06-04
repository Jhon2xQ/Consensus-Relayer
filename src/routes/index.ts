import { Hono } from "hono";
import { semaphoreRoutes } from "./semaphore.routes";
import { env } from "../configs/env.config";
import { ok } from "../common/responses";

const app = new Hono();

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

export { app };
