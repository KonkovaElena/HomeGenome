import {
  ArtifactManifestRecord,
  RegisterArtifactInput,
  normalizeTimestamp,
} from "../domain/homeGenome";
import { IArtifactStore } from "../ports/IArtifactStore";

export class InMemoryArtifactStore implements IArtifactStore {
  private readonly artifacts = new Map<string, ArtifactManifestRecord>();

  async registerArtifact(
    input: RegisterArtifactInput,
  ): Promise<ArtifactManifestRecord> {
    if (this.artifacts.has(input.artifactId)) {
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

    this.artifacts.set(record.artifactId, record);
    return { ...record };
  }

  async getArtifact(
    artifactId: string,
  ): Promise<ArtifactManifestRecord | undefined> {
    const record = this.artifacts.get(artifactId);
    return record ? { ...record } : undefined;
  }

  async listArtifacts(
    caseId: string,
  ): Promise<ReadonlyArray<ArtifactManifestRecord>> {
    return [...this.artifacts.values()]
      .filter((artifact) => artifact.caseId === caseId)
      .map((artifact) => ({ ...artifact }));
  }
}