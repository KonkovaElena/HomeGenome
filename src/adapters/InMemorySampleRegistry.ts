import {
  BiosampleRecord,
  CreateHomeGenomeCaseInput,
  HomeGenomeCaseRecord,
  HomeGenomeCaseStatus,
  RegisterBiosampleInput,
  normalizeTimestamp,
} from "../domain/homeGenome";
import { ISampleRegistry } from "../ports/ISampleRegistry";

export class InMemorySampleRegistry implements ISampleRegistry {
  private readonly cases = new Map<string, HomeGenomeCaseRecord>();
  private readonly samples = new Map<string, BiosampleRecord>();

  async createCase(input: CreateHomeGenomeCaseInput): Promise<HomeGenomeCaseRecord> {
    if (this.cases.has(input.caseId)) {
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

    this.cases.set(record.caseId, record);
    return { ...record };
  }

  async getCase(caseId: string): Promise<HomeGenomeCaseRecord | undefined> {
    const record = this.cases.get(caseId);
    return record ? { ...record } : undefined;
  }

  async updateCaseStatus(
    caseId: string,
    status: HomeGenomeCaseStatus,
    updatedAt: string,
  ): Promise<HomeGenomeCaseRecord> {
    const current = this.cases.get(caseId);

    if (!current) {
      throw new Error(`Unknown case: ${caseId}`);
    }

    const next: HomeGenomeCaseRecord = {
      ...current,
      status,
      updatedAt: normalizeTimestamp(updatedAt),
    };

    this.cases.set(caseId, next);
    return { ...next };
  }

  async registerSample(input: RegisterBiosampleInput): Promise<BiosampleRecord> {
    if (!this.cases.has(input.caseId)) {
      throw new Error(`Cannot register sample for unknown case: ${input.caseId}`);
    }

    if (this.samples.has(input.sampleId)) {
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

    this.samples.set(record.sampleId, record);
    return {
      ...record,
      metadata: record.metadata ? { ...record.metadata } : undefined,
    };
  }

  async listSamples(caseId: string): Promise<ReadonlyArray<BiosampleRecord>> {
    return [...this.samples.values()]
      .filter((sample) => sample.caseId === caseId)
      .map((sample) => ({
        ...sample,
        metadata: sample.metadata ? { ...sample.metadata } : undefined,
      }));
  }
}