import { HomeGenomeCaseStatus } from "../domain/homeGenome";

export interface IStateMachineGuard {
  canTransition(
    currentStatus: HomeGenomeCaseStatus,
    nextStatus: HomeGenomeCaseStatus,
  ): boolean;

  assertTransition(
    currentStatus: HomeGenomeCaseStatus,
    nextStatus: HomeGenomeCaseStatus,
  ): void;

  listAllowedTransitions(
    status: HomeGenomeCaseStatus,
  ): ReadonlyArray<HomeGenomeCaseStatus>;
}