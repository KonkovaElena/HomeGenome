import {
  EventStoreAppendInput,
  IEventStore,
  PersistedEventRecord,
} from "../ports/IEventStore";
import {
  defaultStatePath,
  readJsonStore,
  withFileLock,
  writeJsonStoreAtomic,
} from "./fileStoreSupport";
import {
  assertValidEventChain,
  createTamperEvidentEventRecord,
} from "./eventStoreHashChain";

type EventStoreState<TEventInput extends EventStoreAppendInput> = Record<
  string,
  PersistedEventRecord<TEventInput>[]
>;

export class FileBackedEventStore<
  TEventInput extends EventStoreAppendInput,
> implements IEventStore<TEventInput>
{
  private writeChain = Promise.resolve();

  constructor(
    private readonly filePath: string = defaultStatePath("events.json"),
  ) {}

  async append(
    aggregateId: string,
    expectedVersion: number,
    events: readonly TEventInput[],
  ): Promise<ReadonlyArray<PersistedEventRecord<TEventInput>>> {
    const nextWrite = this.writeChain.then(() =>
      withFileLock(this.filePath, async () => {
        const state = await this.readState();
        const current = state[aggregateId] ?? [];
        assertValidEventChain(current, aggregateId);

        if (current.length !== expectedVersion) {
          throw new Error(
            `Event version mismatch for ${aggregateId}: expected ${expectedVersion}, got ${current.length}`,
          );
        }

        const appended: PersistedEventRecord<TEventInput>[] = [];
        let previousEventHash = current.at(-1)?.eventHash;

        for (const [index, event] of events.entries()) {
          const persisted = createTamperEvidentEventRecord(
            event,
            expectedVersion + index + 1,
            previousEventHash,
          );
          appended.push(persisted);
          previousEventHash = persisted.eventHash;
        }

        state[aggregateId] = [...current, ...appended];
        await writeJsonStoreAtomic(this.filePath, state);

        return appended;
      }),
    );

    this.writeChain = nextWrite.then(() => undefined, () => undefined);
    return nextWrite;
  }

  async listByAggregateId(
    aggregateId: string,
  ): Promise<ReadonlyArray<PersistedEventRecord<TEventInput>>> {
    const state = await this.readState();
    const current = [...(state[aggregateId] ?? [])];
    assertValidEventChain(current, aggregateId);
    return current;
  }

  async getLatestVersion(aggregateId: string): Promise<number> {
    const state = await this.readState();
    const current = state[aggregateId] ?? [];
    assertValidEventChain(current, aggregateId);
    return current.length;
  }

  private async readState(): Promise<EventStoreState<TEventInput>> {
    return readJsonStore<EventStoreState<TEventInput>>(this.filePath, {});
  }
}