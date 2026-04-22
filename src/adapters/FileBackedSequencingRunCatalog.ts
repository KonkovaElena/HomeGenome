import {
  AdaptiveSamplingSessionRecord,
  RegisterSequencingRunInput,
  SequencingRunRecord,
  SequencingRunStatus,
  normalizeTimestamp,
} from "../domain/homeGenome";
import {
  ISequencingRunCatalog,
  SequencingRunRuntimeStateUpdate,
} from "../ports/ISequencingRunCatalog";
import {
  defaultStatePath,
  readJsonStore,
  withFileLock,
  writeJsonStoreAtomic,
} from "./fileStoreSupport";

type SequencingRunState = Record<string, SequencingRunRecord>;

export class FileBackedSequencingRunCatalog implements ISequencingRunCatalog {
  private writeChain = Promise.resolve();

  constructor(
    private readonly filePath: string = defaultStatePath("sequencing-runs.json"),
  ) {}

  async registerRun(input: RegisterSequencingRunInput): Promise<SequencingRunRecord> {
    const nextWrite = this.writeChain.then(() =>
      withFileLock(this.filePath, async () => {
        const state = await this.readState();

        if (state[input.runId]) {
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

        state[record.runId] = record;
        await writeJsonStoreAtomic(this.filePath, state);
        return structuredClone(record);
      }),
    );

    this.writeChain = nextWrite.then(() => undefined, () => undefined);
    return nextWrite;
  }

  async getRun(runId: string): Promise<SequencingRunRecord | undefined> {
    const state = await this.readState();
    const record = state[runId];
    return record ? structuredClone(record) : undefined;
  }

  async updateRunStatus(
    runId: string,
    status: SequencingRunStatus,
    updatedAt: string,
    runtimeState?: SequencingRunRuntimeStateUpdate,
  ): Promise<SequencingRunRecord> {
    return this.mutateRun(runId, (current) => ({
      ...current,
      status,
      updatedAt: normalizeTimestamp(updatedAt),
      telemetry: runtimeState?.telemetry ?? current.telemetry,
      adaptiveSamplingSession:
        runtimeState?.adaptiveSamplingSession ?? current.adaptiveSamplingSession,
    }));
  }

  async updateAdaptiveSamplingSession(
    runId: string,
    adaptiveSamplingSession: AdaptiveSamplingSessionRecord,
    updatedAt: string,
  ): Promise<SequencingRunRecord> {
    return this.mutateRun(runId, (current) => ({
      ...current,
      adaptiveSamplingSession,
      updatedAt: normalizeTimestamp(updatedAt),
    }));
  }

  async listRuns(caseId: string): Promise<ReadonlyArray<SequencingRunRecord>> {
    const state = await this.readState();
    return Object.values(state)
      .filter((run) => run.caseId === caseId)
      .map((run) => structuredClone(run));
  }

  private async mutateRun(
    runId: string,
    mutate: (run: SequencingRunRecord) => SequencingRunRecord,
  ): Promise<SequencingRunRecord> {
    const nextWrite = this.writeChain.then(() =>
      withFileLock(this.filePath, async () => {
        const state = await this.readState();
        const current = state[runId];

        if (!current) {
          throw new Error(`Unknown sequencing run: ${runId}`);
        }

        const next = mutate(current);
        state[runId] = next;
        await writeJsonStoreAtomic(this.filePath, state);
        return structuredClone(next);
      }),
    );

    this.writeChain = nextWrite.then(() => undefined, () => undefined);
    return nextWrite;
  }

  private async readState(): Promise<SequencingRunState> {
    return readJsonStore<SequencingRunState>(this.filePath, {});
  }
}