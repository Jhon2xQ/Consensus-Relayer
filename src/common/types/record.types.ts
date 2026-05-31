export interface RecordPayload {
  groupId: string;
  nullifier: string;
  message: string;
  scope: string;
  transactionHash: string | null;
}
