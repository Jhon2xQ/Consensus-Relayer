import { CreateGroupUseCase } from "./create-group.use-case";
import { AddMemberUseCase } from "./add-member.use-case";
import { AddMembersUseCase } from "./add-members.use-case";
import { RemoveMemberUseCase } from "./remove-member.use-case";
import { UpdateMemberUseCase } from "./update-member.use-case";
import { AcceptGroupAdminUseCase } from "./accept-group-admin.use-case";
import { UpdateGroupAdminUseCase } from "./update-group-admin.use-case";
import { ValidateProofUseCase } from "./validate-proof.use-case";
import { VerifyProofUseCase } from "./verify-proof.use-case";
import { GetGroupInfoUseCase } from "./get-group-info.use-case";
import { GetGroupCounterUseCase } from "./get-group-counter.use-case";
import { GetVerifierUseCase } from "./get-verifier.use-case";
import { HasMemberUseCase } from "./has-member.use-case";

export interface SemaphoreUseCases {
  createGroup: CreateGroupUseCase;
  addMember: AddMemberUseCase;
  addMembers: AddMembersUseCase;
  removeMember: RemoveMemberUseCase;
  updateMember: UpdateMemberUseCase;
  acceptGroupAdmin: AcceptGroupAdminUseCase;
  updateGroupAdmin: UpdateGroupAdminUseCase;
  validateProof: ValidateProofUseCase;
  verifyProof: VerifyProofUseCase;
  getGroupInfo: GetGroupInfoUseCase;
  getGroupCounter: GetGroupCounterUseCase;
  getVerifier: GetVerifierUseCase;
  hasMember: HasMemberUseCase;
}

export {
  CreateGroupUseCase,
  AddMemberUseCase,
  AddMembersUseCase,
  RemoveMemberUseCase,
  UpdateMemberUseCase,
  AcceptGroupAdminUseCase,
  UpdateGroupAdminUseCase,
  ValidateProofUseCase,
  VerifyProofUseCase,
  GetGroupInfoUseCase,
  GetGroupCounterUseCase,
  GetVerifierUseCase,
  HasMemberUseCase,
};
