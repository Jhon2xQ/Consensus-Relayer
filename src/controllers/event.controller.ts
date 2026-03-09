// src/controllers/event.controller.ts
import { injectable, inject } from "tsyringe";
import type { Context } from "hono";
import { TOKENS } from "../config/tokens";
import type { IEventService } from "../interfaces/event-service.interface";
import { streamSSE } from "hono/streaming";

@injectable()
export class EventController {
  constructor(
    @inject(TOKENS.EventService)
    private readonly eventService: IEventService,
  ) {}

  // Server-Sent Events endpoint para escuchar eventos en tiempo real
  subscribeToEvents = async (c: Context) => {
    return streamSSE(c, async (stream) => {
      // Send initial connection message
      await stream.writeSSE({
        data: JSON.stringify({
          type: "connected",
          message: "Connected to ProofValidated event stream",
          timestamp: Date.now(),
        }),
        event: "connected",
      });

      // Subscribe to events
      const unsubscribe = this.eventService.subscribe((event) => {
        stream.writeSSE({
          data: JSON.stringify({
            type: "ProofValidated",
            data: {
              groupId: event.groupId.toString(),
              merkleTreeDepth: event.merkleTreeDepth.toString(),
              merkleTreeRoot: event.merkleTreeRoot.toString(),
              nullifier: event.nullifier.toString(),
              message: event.message.toString(),
              scope: event.scope.toString(),
              points: event.points.map((p) => p.toString()),
              blockNumber: event.blockNumber.toString(),
              transactionHash: event.transactionHash,
              timestamp: event.timestamp,
            },
          }),
          event: "ProofValidated",
        });
      });

      // Keep connection alive with heartbeat
      const heartbeatInterval = setInterval(() => {
        stream.writeSSE({
          data: JSON.stringify({ timestamp: Date.now() }),
          event: "heartbeat",
        });
      }, 30000); // Every 30 seconds

      // Cleanup on disconnect
      stream.onAbort(() => {
        clearInterval(heartbeatInterval);
        unsubscribe();
        console.log("📴 Client disconnected from event stream");
      });
    });
  };

  // Get recent events (polling alternative)
  getRecentEvents = async (c: Context) => {
    const limit = Number(c.req.query("limit")) || 10;
    const events = this.eventService.getRecentEvents(limit);

    return c.json({
      success: true,
      message: "Recent events retrieved successfully",
      data: {
        events: events.map((event) => ({
          groupId: event.groupId.toString(),
          merkleTreeDepth: event.merkleTreeDepth.toString(),
          merkleTreeRoot: event.merkleTreeRoot.toString(),
          nullifier: event.nullifier.toString(),
          message: event.message.toString(),
          scope: event.scope.toString(),
          points: event.points.map((p) => p.toString()),
          blockNumber: event.blockNumber.toString(),
          transactionHash: event.transactionHash,
          timestamp: event.timestamp,
        })),
        count: events.length,
      },
      timestamp: Date.now(),
    });
  };
}
