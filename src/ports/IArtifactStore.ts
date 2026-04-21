import {
  ArtifactManifestRecord,
  RegisterArtifactInput,
} from "../domain/homeGenome";

export interface IArtifactStore {
  registerArtifact(
    input: RegisterArtifactInput,
  ): Promise<ArtifactManifestRecord>;

  getArtifact(artifactId: string): Promise<ArtifactManifestRecord | undefined>;

  listArtifacts(caseId: string): Promise<ReadonlyArray<ArtifactManifestRecord>>;
}