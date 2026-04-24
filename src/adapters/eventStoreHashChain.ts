import { createHash } from "node:crypto";
import {
  EventStoreAppendRecord,
  EventStoreAppendInput,
  PersistedEventRecord,
} from "../ports/IEventStore";

type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

function toCanonicalJsonValue(value: unknown): JsonValue {
  if (value === null) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toCanonicalJsonValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entryValue]) => entryValue !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entryValue]) => [key, toCanonicalJsonValue(entryValue)]),
    );
  }

  return String(value);
}

function computeEventHashMaterial<
  TEventInput extends EventStoreAppendInput,
>(
  record: TEventInput & Omit<EventStoreAppendRecord, "eventHash">,
): string {
  const canonicalJson = JSON.stringify(toCanonicalJsonValue(record));
  return `sha256:${createHash("sha256").update(canonicalJson).digest("hex")}`;
}

export function createTamperEvidentEventRecord<
  TEventInput extends EventStoreAppendInput,
>(
  event: TEventInput,
  version: number,
  previousEventHash: string | undefined,
): PersistedEventRecord<TEventInput> {
  const baseRecord = {
    ...event,
    version,
    previousEventHash,
  };

  return {
    ...baseRecord,
    eventHash: computeEventHashMaterial(baseRecord),
  } as PersistedEventRecord<TEventInput>;
}

export function assertValidEventChain<
  TEventInput extends EventStoreAppendInput,
>(
  events: ReadonlyArray<PersistedEventRecord<TEventInput>>,
  aggregateId: string,
): void {
  let expectedPreviousEventHash: string | undefined;

  for (const [index, event] of events.entries()) {
    if (event.previousEventHash !== expectedPreviousEventHash) {
      throw new Error(
        `Tamper-evident event chain integrity violation for ${aggregateId} at position ${index + 1}: previous hash mismatch`,
      );
    }

    const { eventHash, ...hashMaterial } = event;
    const expectedEventHash = computeEventHashMaterial(hashMaterial);

    if (eventHash !== expectedEventHash) {
      throw new Error(
        `Tamper-evident event chain integrity violation for ${aggregateId} at position ${index + 1}: event hash mismatch`,
      );
    }

    expectedPreviousEventHash = event.eventHash;
  }
}