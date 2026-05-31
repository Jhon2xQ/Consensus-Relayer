import { Hono } from "hono";
import { semaphoreRoutes } from "./semaphore.routes";
import { env } from "../configs/env.config";

const app = new Hono();

app.get("/health", async (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    contract: {
      type: "Semaphore",
      address: env.CONTRACT_ADDRESS,
    },
  });
});

app.route("/api/semaphore", semaphoreRoutes);

export { app };
