import {
  ReferenceBundleRecord,
  RegisterReferenceBundleInput,
  normalizeTimestamp,
} from "../domain/homeGenome";
import { IReferenceBundleRegistry } from "../ports/IReferenceBundleRegistry";
import {
  defaultStatePath,
  readJsonStore,
  withFileLock,
  writeJsonStoreAtomic,
} from "./fileStoreSupport";

type ReferenceBundleState = Record<string, ReferenceBundleRecord>;

export class FileBackedReferenceBundleRegistry
  implements IReferenceBundleRegistry
{
  private writeChain = Promise.resolve();

  constructor(
    private readonly filePath: string = defaultStatePath("reference-bundles.json"),
  ) {}

  async registerBundle(
    input: RegisterReferenceBundleInput,
  ): Promise<ReferenceBundleRecord> {
    const nextWrite = this.writeChain.then(() =>
      withFileLock(this.filePath, async () => {
        const state = await this.readState();

        if (state[input.bundleId]) {
          throw new Error(`Reference bundle already exists: ${input.bundleId}`);
        }

        const record: ReferenceBundleRecord = {
          bundleId: input.bundleId,
          name: input.name,
          version: input.version,
          description: input.description,
          createdAt: normalizeTimestamp(input.createdAt),
        };

        state[record.bundleId] = record;
        await writeJsonStoreAtomic(this.filePath, state);
        return structuredClone(record);
      }),
    );

    this.writeChain = nextWrite.then(() => undefined, () => undefined);
    return nextWrite;
  }

  async getBundle(bundleId: string): Promise<ReferenceBundleRecord | undefined> {
    const state = await this.readState();
    const record = state[bundleId];
    return record ? structuredClone(record) : undefined;
  }

  async listBundles(): Promise<ReadonlyArray<ReferenceBundleRecord>> {
    const state = await this.readState();
    return Object.values(state).map((bundle) => structuredClone(bundle));
  }

  private async readState(): Promise<ReferenceBundleState> {
    return readJsonStore<ReferenceBundleState>(this.filePath, {});
  }
}