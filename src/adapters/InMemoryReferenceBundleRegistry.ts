import {
  ReferenceBundleRecord,
  RegisterReferenceBundleInput,
  normalizeTimestamp,
} from "../domain/homeGenome";
import { IReferenceBundleRegistry } from "../ports/IReferenceBundleRegistry";

export class InMemoryReferenceBundleRegistry implements IReferenceBundleRegistry {
  private readonly bundles = new Map<string, ReferenceBundleRecord>();

  async registerBundle(
    input: RegisterReferenceBundleInput,
  ): Promise<ReferenceBundleRecord> {
    if (this.bundles.has(input.bundleId)) {
      throw new Error(`Reference bundle already exists: ${input.bundleId}`);
    }

    const record: ReferenceBundleRecord = {
      bundleId: input.bundleId,
      name: input.name,
      version: input.version,
      description: input.description,
      createdAt: normalizeTimestamp(input.createdAt),
    };

    this.bundles.set(record.bundleId, record);
    return { ...record };
  }

  async getBundle(bundleId: string): Promise<ReferenceBundleRecord | undefined> {
    const record = this.bundles.get(bundleId);
    return record ? { ...record } : undefined;
  }

  async listBundles(): Promise<ReadonlyArray<ReferenceBundleRecord>> {
    return [...this.bundles.values()].map((bundle) => ({ ...bundle }));
  }
}