import {
  BiosampleRecord,
  CreateHomeGenomeCaseInput,
  HomeGenomeCaseRecord,
  HomeGenomeCaseStatus,
  RegisterBiosampleInput,
} from "../domain/homeGenome";

export interface ISampleRegistry {
  createCase(input: CreateHomeGenomeCaseInput): Promise<HomeGenomeCaseRecord>;

  getCase(caseId: string): Promise<HomeGenomeCaseRecord | undefined>;

  updateCaseStatus(
    caseId: string,
    status: HomeGenomeCaseStatus,
    updatedAt: string,
  ): Promise<HomeGenomeCaseRecord>;

  registerSample(input: RegisterBiosampleInput): Promise<BiosampleRecord>;

  listSamples(caseId: string): Promise<ReadonlyArray<BiosampleRecord>>;
}