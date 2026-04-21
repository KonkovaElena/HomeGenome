import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  FileBackedAnalysisWorkflowRunner,
  FileBackedEventStore,
  FileBackedWorkflowDispatchSink,
} from "../src";

interface TestEventInput {
  aggregateId: string;
  type: string;
  occurredAt: string;
  detail: Record<string, unknown>;
}

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), "homegenome-durable-"));
}

test("file-backed event store persists events across adapter instances", async () => {
  const tempDir = await createTempDir();
  const filePath = path.join(tempDir, "events.json");

  const store = new FileBackedEventStore<TestEventInput>(filePath);
  await store.append("case-file-001", 0, [
    {
      aggregateId: "case-file-001",
      type: "CASE_CREATED",
      occurredAt: "2026-04-21T15:00:00.000Z",
      detail: { phase: 1 },
    },
  ]);

  const reloadedStore = new FileBackedEventStore<TestEventInput>(filePath);
  const events = await reloadedStore.listByAggregateId("case-file-001");

  assert.equal(events.length, 1);
  assert.equal(events[0].version, 1);
  assert.deepEqual(events[0].detail, { phase: 1 });
});

test("file-backed event store serializes competing writes across adapter instances", async () => {
  const tempDir = await createTempDir();
  const filePath = path.join(tempDir, "events-lock.json");

  const storeA = new FileBackedEventStore<TestEventInput>(filePath);
  const storeB = new FileBackedEventStore<TestEventInput>(filePath);

  const [first, second] = await Promise.allSettled([
    storeA.append("case-file-lock-001", 0, [
      {
        aggregateId: "case-file-lock-001",
        type: "CASE_CREATED_A",
        occurredAt: "2026-04-21T15:05:00.000Z",
        detail: { writer: "A" },
      },
    ]),
    storeB.append("case-file-lock-001", 0, [
      {
        aggregateId: "case-file-lock-001",
        type: "CASE_CREATED_B",
        occurredAt: "2026-04-21T15:05:01.000Z",
        detail: { writer: "B" },
      },
    ]),
  ]);

  const settled = [first.status, second.status].sort();
  const reloadedStore = new FileBackedEventStore<TestEventInput>(filePath);
  const events = await reloadedStore.listByAggregateId("case-file-lock-001");

  assert.deepEqual(settled, ["fulfilled", "rejected"]);
  assert.equal(events.length, 1);
});

test("file-backed workflow dispatch sink persists and replays dispatches idempotently", async () => {
  const tempDir = await createTempDir();
  const filePath = path.join(tempDir, "dispatches.json");

  const sink = new FileBackedWorkflowDispatchSink(filePath);
  await sink.recordWorkflowRequested({
    dispatchId: "dispatch-file-001",
    caseId: "case-file-002",
    requestId: "request-file-001",
    workflowName: "wf-human-variation",
    referenceBundleId: "bundle-file-001",
    executionProfile: "local-ont",
    requestedAt: "2026-04-21T15:10:00.000Z",
    status: "PENDING",
  });

  const reloadedSink = new FileBackedWorkflowDispatchSink(filePath);
  await reloadedSink.recordWorkflowRequested({
    dispatchId: "dispatch-file-001",
    caseId: "case-file-002",
    requestId: "request-file-001",
    workflowName: "wf-human-variation",
    referenceBundleId: "bundle-file-001",
    executionProfile: "local-ont",
    requestedAt: "2026-04-21T15:10:00.000Z",
    status: "PENDING",
  });

  const dispatches = await reloadedSink.listDispatches("case-file-002");

  assert.equal(dispatches.length, 1);
  assert.equal(dispatches[0].dispatchId, "dispatch-file-001");
});

test("file-backed analysis workflow runner persists terminal workflow state", async () => {
  const tempDir = await createTempDir();
  const filePath = path.join(tempDir, "runs.json");

  const runner = new FileBackedAnalysisWorkflowRunner(filePath);
  await runner.startRun({
    runId: "run-file-001",
    caseId: "case-file-003",
    requestId: "request-file-003",
    workflowName: "wf-human-variation",
    referenceBundleId: "bundle-file-003",
    executionProfile: "local-ont",
  });
  await runner.completeRun("run-file-001");

  const reloadedRunner = new FileBackedAnalysisWorkflowRunner(filePath);
  const run = await reloadedRunner.getRun("run-file-001");

  assert.equal(run.status, "COMPLETED");
  assert.equal(run.caseId, "case-file-003");
});