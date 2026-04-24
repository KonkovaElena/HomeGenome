import {
  EventStoreAppendInput,
  IEventStore,
  PersistedEventRecord,
} from "../ports/IEventStore";
import {
  assertValidEventChain,
  createTamperEvidentEventRecord,
} from "./eventStoreHashChain";

export class InMemoryEventStore<
  TEventInput extends EventStoreAppendInput,
> implements IEventStore<TEventInput>
{
  private readonly events = new Map<
    string,
    PersistedEventRecord<TEventInput>[]
  >();

  async append(
    aggregateId: string,
    expectedVersion: number,
    events: readonly TEventInput[],
  ): Promise<ReadonlyArray<PersistedEventRecord<TEventInput>>> {
    const current = this.events.get(aggregateId) ?? [];
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

    this.events.set(aggregateId, [...current, ...appended]);
    return appended;
  }

  async listByAggregateId(
    aggregateId: string,
  ): Promise<ReadonlyArray<PersistedEventRecord<TEventInput>>> {
    const current = [...(this.events.get(aggregateId) ?? [])];
    assertValidEventChain(current, aggregateId);
    return current;
  }

  async getLatestVersion(aggregateId: string): Promise<number> {
    const current = this.events.get(aggregateId) ?? [];
    assertValidEventChain(current, aggregateId);
    return current.length;
  }
}