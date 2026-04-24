export interface EventStoreAppendInput {
  aggregateId: string;
}

export interface EventStoreAppendRecord extends EventStoreAppendInput {
  version: number;
  previousEventHash?: string;
  eventHash: string;
}

export type PersistedEventRecord<
  TEventInput extends EventStoreAppendInput,
> = TEventInput & EventStoreAppendRecord;

export interface IEventStore<TEventInput extends EventStoreAppendInput> {
  append(
    aggregateId: string,
    expectedVersion: number,
    events: readonly TEventInput[],
  ): Promise<ReadonlyArray<PersistedEventRecord<TEventInput>>>;

  listByAggregateId(
    aggregateId: string,
  ): Promise<ReadonlyArray<PersistedEventRecord<TEventInput>>>;

  getLatestVersion(aggregateId: string): Promise<number>;
}