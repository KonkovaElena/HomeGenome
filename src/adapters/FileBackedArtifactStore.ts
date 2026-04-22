import {
  ArtifactManifestRecord,
  RegisterArtifactInput,
  normalizeTimestamp,
} from "../domain/homeGenome";
import { IArtifactStore } from "../ports/IArtifactStore";
import {
  defaultStatePath,
  readJsonStore,
  withFileLock,
  writeJsonStoreAtomic,
} from "./fileStoreSupport";

type ArtifactStoreState = Record<string, ArtifactManifestRecord>;

export class FileBackedArtifactStore implements IArtifactStore {
  private writeChain = Promise.resolve();

  constructor(
    private readonly filePath: string = defaultStatePath("artifacts.json"),
  ) {}

  async registerArtifact(
    input: RegisterArtifactInput,
  ): Promise<ArtifactManifestRecord> {
    const nextWrite = this.writeChain.then(() =>
      withFileLock(this.filePath, async () => {
        const state = await this.readState();

        if (state[input.artifactId]) {
          throw new Error(`Artifact already exists: ${input.artifactId}`);
        }

        const record: ArtifactManifestRecord = {
          artifactId: input.artifactId,
          caseId: input.caseId,
          runId: input.runId,
          sampleId: input.sampleId,
          kind: input.kind,
          uri: input.uri,
          checksum: input.checksum,
          createdAt: normalizeTimestamp(input.createdAt),
        };

        state[record.artifactId] = record;
        await writeJsonStoreAtomic(this.filePath, state);
        return structuredClone(record);
      }),
    );

    this.writeChain = nextWrite.then(() => undefined, () => undefined);
    return nextWrite;
  }

  async getArtifact(
    artifactId: string,
  ): Promise<ArtifactManifestRecord | undefined> {
    const state = await this.readState();
    const record = state[artifactId];
    return record ? structuredClone(record) : undefined;
  }

  async listArtifacts(
    caseId: string,
  ): Promise<ReadonlyArray<ArtifactManifestRecord>> {
    const state = await this.readState();
    return Object.values(state)
      .filter((artifact) => artifact.caseId === caseId)
      .map((artifact) => structuredClone(artifact));
  }

  private async readState(): Promise<ArtifactStoreState> {
    return readJsonStore<ArtifactStoreState>(this.filePath, {});
  }
}