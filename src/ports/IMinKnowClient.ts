import {
  AdaptiveSamplingSessionRecord,
  AdaptiveSamplingTargetFormat,
  SequencingRunStatus,
  SequencingRunTelemetrySnapshot,
} from "../domain/homeGenome";

export interface MinKnowRunSnapshot {
  runId: string;
  status: SequencingRunStatus;
  telemetry?: SequencingRunTelemetrySnapshot;
}

export interface ApplyAdaptiveSamplingTargetRequest {
  runId: string;
  label: string;
  targetDefinitionUri: string;
  format: AdaptiveSamplingTargetFormat;
  appliedAt: string;
  requestedBy?: string;
  checksum?: string;
}

export interface IMinKnowClient {
  getRunSnapshot(runId: string): Promise<MinKnowRunSnapshot>;

  applyAdaptiveSamplingTarget(
    input: ApplyAdaptiveSamplingTargetRequest,
  ): Promise<AdaptiveSamplingSessionRecord>;
}