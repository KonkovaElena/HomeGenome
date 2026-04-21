import {
  HOME_GENOME_ALLOWED_TRANSITIONS,
  HomeGenomeCaseStatus,
  assertAllowedCaseTransition,
} from "../domain/homeGenome";
import { IStateMachineGuard } from "../ports/IStateMachineGuard";

export class InMemoryStateMachineGuard implements IStateMachineGuard {
  canTransition(
    currentStatus: HomeGenomeCaseStatus,
    nextStatus: HomeGenomeCaseStatus,
  ): boolean {
    return HOME_GENOME_ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus);
  }

  assertTransition(
    currentStatus: HomeGenomeCaseStatus,
    nextStatus: HomeGenomeCaseStatus,
  ): void {
    assertAllowedCaseTransition(currentStatus, nextStatus);
  }

  listAllowedTransitions(
    status: HomeGenomeCaseStatus,
  ): ReadonlyArray<HomeGenomeCaseStatus> {
    return [...HOME_GENOME_ALLOWED_TRANSITIONS[status]];
  }
}