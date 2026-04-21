import {
  ReferenceBundleRecord,
  RegisterReferenceBundleInput,
} from "../domain/homeGenome";

export interface IReferenceBundleRegistry {
  registerBundle(
    input: RegisterReferenceBundleInput,
  ): Promise<ReferenceBundleRecord>;

  getBundle(bundleId: string): Promise<ReferenceBundleRecord | undefined>;

  listBundles(): Promise<ReadonlyArray<ReferenceBundleRecord>>;
}