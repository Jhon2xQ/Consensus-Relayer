// src/services/event.service.ts
import { injectable } from "tsyringe";
import type { IEventService } from "../interfaces/event-service.interface";
import type { ProofValidatedEvent, EventListener } from "../types/event.types";
import { publicClient } from "../config/blockchain.config";
import { semaphoreAbi } from "../abi/semaphore.abi";
import { env } from "../config/env";
import type { Log } from "viem";

@injectable()
export class EventService implements IEventService {
  private listeners: Set<EventListener> = new Set();
  private recentEvents: ProofValidatedEvent[] = [];
  private unwatch?: () => void;
  private readonly maxRecentEvents = 100;

  async startListening(): Promise<void> {
    console.log("🎧 Starting to listen for ProofValidated events...");

    this.unwatch = publicClient.watchContractEvent({
      address: env.CONTRACT_ADDRESS as `0x${string}`,
      abi: semaphoreAbi,
      eventName: "ProofValidated",
      onLogs: (logs) => {
        logs.forEach((log) => {
          this.handleProofValidatedEvent(log);
        });
      },
      onError: (error) => {
        console.error("❌ Error watching ProofValidated event:", error);
      },
    });

    console.log("✅ Event listener started successfully");
  }

  stopListening(): void {
    if (this.unwatch) {
      this.unwatch();
      console.log("🛑 Event listener stopped");
    }
  }

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    console.log(`📡 New subscriber added. Total subscribers: ${this.listeners.size}`);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
      console.log(`📴 Subscriber removed. Total subscribers: ${this.listeners.size}`);
    };
  }

  getRecentEvents(limit: number = 10): ProofValidatedEvent[] {
    return this.recentEvents.slice(-limit);
  }

  private handleProofValidatedEvent(log: Log): void {
    try {
      // Decodificar los argumentos del evento
      const { args, blockNumber, transactionHash } = log as any;

      if (!args || !blockNumber || !transactionHash) {
        console.error("❌ Invalid event log structure");
        return;
      }

      const event: ProofValidatedEvent = {
        groupId: args.groupId,
        merkleTreeDepth: args.merkleTreeDepth,
        merkleTreeRoot: args.merkleTreeRoot,
        nullifier: args.nullifier,
        message: args.message,
        scope: args.scope,
        points: args.points,
        blockNumber: blockNumber,
        transactionHash: transactionHash,
        timestamp: Date.now(),
      };

      // Store in recent events
      this.recentEvents.push(event);
      if (this.recentEvents.length > this.maxRecentEvents) {
        this.recentEvents.shift();
      }

      console.log(`📢 ProofValidated event received:`, {
        groupId: event.groupId.toString(),
        nullifier: event.nullifier.toString(),
        message: event.message.toString(),
        txHash: event.transactionHash,
      });

      // Broadcast to all listeners
      this.listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error("❌ Error in event listener:", error);
        }
      });
    } catch (error) {
      console.error("❌ Error handling ProofValidated event:", error);
    }
  }
}
