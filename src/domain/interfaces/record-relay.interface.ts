import type { RecordPayload } from "../../common/types/record.types";

export interface IRecordRelayService {
  send(payload: RecordPayload): Promise<void>;
}
