import {
  EventStoreAppendInput,
  IEventStore,
  PersistedEventRecord,
} from "../ports/IEventStore";

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

    if (current.length !== expectedVersion) {
      throw new Error(
        `Event version mismatch for ${aggregateId}: expected ${expectedVersion}, got ${current.length}`,
      );
    }

    const appended = events.map<PersistedEventRecord<TEventInput>>(
      (event, index) => ({
        ...event,
        version: expectedVersion + index + 1,
      }),
    );

    this.events.set(aggregateId, [...current, ...appended]);
    return appended;
  }

  async listByAggregateId(
    aggregateId: string,
  ): Promise<ReadonlyArray<PersistedEventRecord<TEventInput>>> {
    return [...(this.events.get(aggregateId) ?? [])];
  }

  async getLatestVersion(aggregateId: string): Promise<number> {
    return (this.events.get(aggregateId) ?? []).length;
  }
}