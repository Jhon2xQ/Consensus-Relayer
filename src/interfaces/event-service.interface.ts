// src/interfaces/event-service.interface.ts
import type { ProofValidatedEvent, EventListener } from "../types/event.types";

export interface IEventService {
  startListening(): Promise<void>;
  stopListening(): void;
  subscribe(listener: EventListener): () => void;
  getRecentEvents(limit?: number): ProofValidatedEvent[];
}
