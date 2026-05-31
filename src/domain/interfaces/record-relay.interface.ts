export interface RecordPayload {
  groupId: string;
  nullifier: string;
  message: string;
  scope: string;
  transactionHash: string | null;
}

export interface IRecordRelayService {
  send(payload: RecordPayload): Promise<void>;
}
