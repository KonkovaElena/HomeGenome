import {
  AdaptiveSamplingSessionRecord,
  RegisterSequencingRunInput,
  SequencingRunRecord,
  SequencingRunStatus,
  SequencingRunTelemetrySnapshot,
  normalizeTimestamp,
} from "../domain/homeGenome";
import {
  ISequencingRunCatalog,
  SequencingRunRuntimeStateUpdate,
} from "../ports/ISequencingRunCatalog";

export class InMemorySequencingRunCatalog implements ISequencingRunCatalog {
  private readonly runs = new Map<string, SequencingRunRecord>();

  async registerRun(input: RegisterSequencingRunInput): Promise<SequencingRunRecord> {
    if (this.runs.has(input.runId)) {
      throw new Error(`Sequencing run already exists: ${input.runId}`);
    }

    const createdAt = normalizeTimestamp(input.createdAt);
    const record: SequencingRunRecord = {
      runId: input.runId,
      caseId: input.caseId,
      sampleId: input.sampleId,
      platform: input.platform,
      referenceBundleId: input.referenceBundleId,
      status: input.status ?? "REQUESTED",
      createdAt,
      updatedAt: createdAt,
    };

    this.runs.set(record.runId, record);
    return { ...record };
  }

  async getRun(runId: string): Promise<SequencingRunRecord | undefined> {
    const record = this.runs.get(runId);
    return record ? { ...record } : undefined;
  }

  async updateRunStatus(
    runId: string,
    status: SequencingRunStatus,
    updatedAt: string,
    runtimeState?: SequencingRunRuntimeStateUpdate,
  ): Promise<SequencingRunRecord> {
    const current = this.runs.get(runId);

    if (!current) {
      throw new Error(`Unknown sequencing run: ${runId}`);
    }

    const next: SequencingRunRecord = {
      ...current,
      status,
      updatedAt: normalizeTimestamp(updatedAt),
      telemetry: runtimeState?.telemetry ?? current.telemetry,
      adaptiveSamplingSession:
        runtimeState?.adaptiveSamplingSession ?? current.adaptiveSamplingSession,
    };

    this.runs.set(runId, next);
    return { ...next };
  }

  async updateAdaptiveSamplingSession(
    runId: string,
    adaptiveSamplingSession: AdaptiveSamplingSessionRecord,
    updatedAt: string,
  ): Promise<SequencingRunRecord> {
    const current = this.runs.get(runId);

    if (!current) {
      throw new Error(`Unknown sequencing run: ${runId}`);
    }

    const next: SequencingRunRecord = {
      ...current,
      adaptiveSamplingSession,
      updatedAt: normalizeTimestamp(updatedAt),
    };

    this.runs.set(runId, next);
    return { ...next };
  }

  async listRuns(caseId: string): Promise<ReadonlyArray<SequencingRunRecord>> {
    return [...this.runs.values()]
      .filter((run) => run.caseId === caseId)
      .map((run) => ({ ...run }));
  }
}