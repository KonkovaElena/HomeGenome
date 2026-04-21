import {
  AdaptiveSamplingSessionRecord,
  RegisterSequencingRunInput,
  SequencingRunRecord,
  SequencingRunStatus,
  SequencingRunTelemetrySnapshot,
} from "../domain/homeGenome";

export interface SequencingRunRuntimeStateUpdate {
  telemetry?: SequencingRunTelemetrySnapshot;
  adaptiveSamplingSession?: AdaptiveSamplingSessionRecord;
}

export interface ISequencingRunCatalog {
  registerRun(input: RegisterSequencingRunInput): Promise<SequencingRunRecord>;

  getRun(runId: string): Promise<SequencingRunRecord | undefined>;

  updateRunStatus(
    runId: string,
    status: SequencingRunStatus,
    updatedAt: string,
    runtimeState?: SequencingRunRuntimeStateUpdate,
  ): Promise<SequencingRunRecord>;

  updateAdaptiveSamplingSession(
    runId: string,
    adaptiveSamplingSession: AdaptiveSamplingSessionRecord,
    updatedAt: string,
  ): Promise<SequencingRunRecord>;

  listRuns(caseId: string): Promise<ReadonlyArray<SequencingRunRecord>>;
}