import {
  BiosampleRecord,
  CreateHomeGenomeCaseInput,
  HomeGenomeCaseRecord,
  HomeGenomeCaseStatus,
  RegisterBiosampleInput,
  normalizeTimestamp,
} from "../domain/homeGenome";
import { ISampleRegistry } from "../ports/ISampleRegistry";
import {
  defaultStatePath,
  readJsonStore,
  withFileLock,
  writeJsonStoreAtomic,
} from "./fileStoreSupport";

type SampleRegistryState = {
  cases: Record<string, HomeGenomeCaseRecord>;
  samples: Record<string, BiosampleRecord>;
};

export class FileBackedSampleRegistry implements ISampleRegistry {
  private writeChain = Promise.resolve();

  constructor(
    private readonly filePath: string = defaultStatePath("samples.json"),
  ) {}

  async createCase(input: CreateHomeGenomeCaseInput): Promise<HomeGenomeCaseRecord> {
    const nextWrite = this.writeChain.then(() =>
      withFileLock(this.filePath, async () => {
        const state = await this.readState();

        if (state.cases[input.caseId]) {
          throw new Error(`Case already exists: ${input.caseId}`);
        }

        const createdAt = normalizeTimestamp(input.createdAt);
        const record: HomeGenomeCaseRecord = {
          caseId: input.caseId,
          subjectId: input.subjectId,
          status: "INTAKE_PENDING",
          createdAt,
          updatedAt: createdAt,
        };

        state.cases[record.caseId] = record;
        await writeJsonStoreAtomic(this.filePath, state);
        return structuredClone(record);
      }),
    );

    this.writeChain = nextWrite.then(() => undefined, () => undefined);
    return nextWrite;
  }

  async getCase(caseId: string): Promise<HomeGenomeCaseRecord | undefined> {
    const state = await this.readState();
    const record = state.cases[caseId];
    return record ? structuredClone(record) : undefined;
  }

  async updateCaseStatus(
    caseId: string,
    status: HomeGenomeCaseStatus,
    updatedAt: string,
    expectedCurrentStatus?: HomeGenomeCaseStatus,
  ): Promise<HomeGenomeCaseRecord> {
    const nextWrite = this.writeChain.then(() =>
      withFileLock(this.filePath, async () => {
        const state = await this.readState();
        const current = state.cases[caseId];

        if (!current) {
          throw new Error(`Unknown case: ${caseId}`);
        }

        if (
          expectedCurrentStatus !== undefined &&
          current.status !== expectedCurrentStatus
        ) {
          throw new Error(
            `Stale case status update for ${caseId}: expected ${expectedCurrentStatus}, got ${current.status}`,
          );
        }

        const next: HomeGenomeCaseRecord = {
          ...current,
          status,
          updatedAt: normalizeTimestamp(updatedAt),
        };

        state.cases[caseId] = next;
        await writeJsonStoreAtomic(this.filePath, state);
        return structuredClone(next);
      }),
    );

    this.writeChain = nextWrite.then(() => undefined, () => undefined);
    return nextWrite;
  }

  async registerSample(input: RegisterBiosampleInput): Promise<BiosampleRecord> {
    const nextWrite = this.writeChain.then(() =>
      withFileLock(this.filePath, async () => {
        const state = await this.readState();

        if (!state.cases[input.caseId]) {
          throw new Error(`Cannot register sample for unknown case: ${input.caseId}`);
        }

        if (state.samples[input.sampleId]) {
          throw new Error(`Sample already exists: ${input.sampleId}`);
        }

        const record: BiosampleRecord = {
          sampleId: input.sampleId,
          caseId: input.caseId,
          sampleType: input.sampleType,
          collectedAt: input.collectedAt,
          createdAt: normalizeTimestamp(input.createdAt),
          notes: input.notes,
          metadata: input.metadata ? { ...input.metadata } : undefined,
        };

        state.samples[record.sampleId] = record;
        await writeJsonStoreAtomic(this.filePath, state);
        return structuredClone(record);
      }),
    );

    this.writeChain = nextWrite.then(() => undefined, () => undefined);
    return nextWrite;
  }

  async listSamples(caseId: string): Promise<ReadonlyArray<BiosampleRecord>> {
    const state = await this.readState();
    return Object.values(state.samples)
      .filter((sample) => sample.caseId === caseId)
      .map((sample) => structuredClone(sample));
  }

  private async readState(): Promise<SampleRegistryState> {
    return readJsonStore<SampleRegistryState>(this.filePath, {
      cases: {},
      samples: {},
    });
  }
}