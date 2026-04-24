import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryEventStore } from "../src/adapters/InMemoryEventStore";

interface TestEventInput {
  aggregateId: string;
  type: string;
  occurredAt: string;
}

test("event store appends events with monotonic versions", async () => {
  const store = new InMemoryEventStore<TestEventInput>();

  const appended = await store.append("case-001", 0, [
    {
      aggregateId: "case-001",
      type: "CASE_CREATED",
      occurredAt: "2026-04-21T12:00:00.000Z",
    },
    {
      aggregateId: "case-001",
      type: "CASE_UPDATED",
      occurredAt: "2026-04-21T12:01:00.000Z",
    },
  ]);

  assert.deepEqual(
    appended.map((event) => event.version),
    [1, 2],
  );
  assert.match(appended[0].eventHash, /^sha256:[a-f0-9]{64}$/);
  assert.equal(appended[0].previousEventHash, undefined);
  assert.equal(appended[1].previousEventHash, appended[0].eventHash);
  assert.match(appended[1].eventHash, /^sha256:[a-f0-9]{64}$/);

  const stored = await store.listByAggregateId("case-001");

  assert.equal(stored.length, 2);
  assert.equal(stored[1].type, "CASE_UPDATED");
  assert.equal(stored[1].previousEventHash, stored[0].eventHash);
});

test("event store rejects optimistic concurrency mismatches", async () => {
  const store = new InMemoryEventStore<TestEventInput>();

  await store.append("case-002", 0, [
    {
      aggregateId: "case-002",
      type: "CASE_CREATED",
      occurredAt: "2026-04-21T12:10:00.000Z",
    },
  ]);

  await assert.rejects(
    () =>
      store.append("case-002", 0, [
        {
          aggregateId: "case-002",
          type: "CASE_REPLAYED",
          occurredAt: "2026-04-21T12:11:00.000Z",
        },
      ]),
    /expected 0, got 1/,
  );
});