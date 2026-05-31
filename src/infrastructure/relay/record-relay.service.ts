import type { IRecordRelayService } from "../../domain/interfaces/record-relay.interface";
import type { RecordPayload } from "../../common/types/record.types";
import { env } from "../../common/configs/env.config";

export class RecordRelayService implements IRecordRelayService {
  async send(payload: RecordPayload): Promise<void> {
    if (!env.RECORD_ENDPOINT) {
      console.log("⏭️ RECORD_ENDPOINT not configured, skipping record relay");
      return;
    }

    console.log("📤 Relaying validated record to:", env.RECORD_ENDPOINT);

    const response = await fetch(env.RECORD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        "❌ Record relay failed:",
        response.status,
        await response.text().catch(() => ""),
      );
      return;
    }

    console.log("✅ Record relayed successfully");
  }
}
