import { Hono } from "hono";
import { BlockchainService } from "../infrastructure/blockchain/blockchain.service";
import { RecordRelayService } from "../infrastructure/relay/record-relay.service";
import {
  CreateGroupUseCase,
  AddMemberUseCase,
  AddMembersUseCase,
  RemoveMemberUseCase,
  UpdateMemberUseCase,
  AcceptGroupAdminUseCase,
  UpdateGroupAdminUseCase,
  UpdateGroupMerkleTreeDurationUseCase,
  IndexOfUseCase,
  ValidateProofUseCase,
  VerifyProofUseCase,
  GetGroupInfoUseCase,
  GetGroupCounterUseCase,
  GetVerifierUseCase,
  HasMemberUseCase,
} from "../application/use-cases";
import type { SemaphoreUseCases } from "../application/use-cases";
import { SemaphoreController } from "../presentation/controllers/semaphore.controller";

// ── Infrastructure ──
const blockchain = new BlockchainService();
const recordRelay = new RecordRelayService();

// ── Application ──
const useCases: SemaphoreUseCases = {
  createGroup: new CreateGroupUseCase(blockchain),
  addMember: new AddMemberUseCase(blockchain),
  addMembers: new AddMembersUseCase(blockchain),
  removeMember: new RemoveMemberUseCase(blockchain),
  updateMember: new UpdateMemberUseCase(blockchain),
  acceptGroupAdmin: new AcceptGroupAdminUseCase(blockchain),
  updateGroupAdmin: new UpdateGroupAdminUseCase(blockchain),
  updateGroupMerkleTreeDuration: new UpdateGroupMerkleTreeDurationUseCase(blockchain),
  validateProof: new ValidateProofUseCase(blockchain, recordRelay),
  verifyProof: new VerifyProofUseCase(blockchain),
  getGroupInfo: new GetGroupInfoUseCase(blockchain),
  getGroupCounter: new GetGroupCounterUseCase(blockchain),
  getVerifier: new GetVerifierUseCase(blockchain),
  hasMember: new HasMemberUseCase(blockchain),
  indexOf: new IndexOfUseCase(blockchain),
};

// ── Presentation ──
const controller = new SemaphoreController(useCases);

// ── Routes ──
const semaphoreRoutes = new Hono();

semaphoreRoutes.post("/groups", controller.createGroup);
semaphoreRoutes.get("/groups/counter", controller.getGroupCounter);
semaphoreRoutes.get("/groups/:groupId", controller.getGroupInfo);
semaphoreRoutes.post("/groups/:groupId/accept-admin", controller.acceptGroupAdmin);
semaphoreRoutes.put("/groups/:groupId/admin", controller.updateGroupAdmin);
semaphoreRoutes.put("/groups/:groupId/merkle-tree-duration", controller.updateGroupMerkleTreeDuration);

semaphoreRoutes.post("/members", controller.addMember);
semaphoreRoutes.post("/members/batch", controller.addMembers);
semaphoreRoutes.delete("/members", controller.removeMember);
semaphoreRoutes.put("/members", controller.updateMember);
semaphoreRoutes.get("/members/check", controller.hasMember);
semaphoreRoutes.get("/groups/:groupId/index-of", controller.indexOf);

semaphoreRoutes.post("/proofs/validate", controller.validateProof);
semaphoreRoutes.post("/proofs/verify", controller.verifyProof);

semaphoreRoutes.get("/verifier", controller.getVerifier);

export { semaphoreRoutes };
