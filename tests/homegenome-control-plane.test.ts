import test from "node:test";
import assert from "node:assert/strict";
import { HomeGenomeControlPlane } from "../src/application/HomeGenomeControlPlane";
import { InMemoryArtifactStore } from "../src/adapters/InMemoryArtifactStore";
import { InMemoryAnalysisWorkflowRunner } from "../src/adapters/InMemoryAnalysisWorkflowRunner";
import { InMemoryEventStore } from "../src/adapters/InMemoryEventStore";
import { InMemoryReferenceBundleRegistry } from "../src/adapters/InMemoryReferenceBundleRegistry";
import { InMemorySampleRegistry } from "../src/adapters/InMemorySampleRegistry";
import { InMemorySequencingRunCatalog } from "../src/adapters/InMemorySequencingRunCatalog";
import { InMemoryStateMachineGuard } from "../src/adapters/InMemoryStateMachineGuard";
import { InMemoryWorkflowDispatchSink } from "../src/adapters/InMemoryWorkflowDispatchSink";
import { IMinKnowClient } from "../src/ports/IMinKnowClient";

function createMinKnowClientStub(): IMinKnowClient {
  return {
    async getRunSnapshot(runId) {
      return {
        runId,
        status: "RUNNING",
      };
    },
    async applyAdaptiveSamplingTarget(input) {
      return {
        sessionId: `adaptive-${input.runId}`,
        state: "ACTIVE",
        requestedBy: input.requestedBy,
        appliedAt: input.appliedAt,
        target: {
          label: input.label,
          targetDefinitionUri: input.targetDefinitionUri,
          format: input.format,
          appliedAt: input.appliedAt,
          checksum: input.checksum,
        },
      };
    },
  };
}

function createControlPlane(
  minKnowClient: IMinKnowClient = createMinKnowClientStub(),
): HomeGenomeControlPlane {
  return new HomeGenomeControlPlane({
    sampleRegistry: new InMemorySampleRegistry(),
    sequencingRunCatalog: new InMemorySequencingRunCatalog(),
    artifactStore: new InMemoryArtifactStore(),
    referenceBundleRegistry: new InMemoryReferenceBundleRegistry(),
    workflowDispatchSink: new InMemoryWorkflowDispatchSink(),
    analysisWorkflowRunner: new InMemoryAnalysisWorkflowRunner(),
    eventStore: new InMemoryEventStore(),
    stateMachineGuard: new InMemoryStateMachineGuard(),
    minKnowClient,
  });
}

test("control plane tracks a minimal HomeGenome case lifecycle", async () => {
  const controlPlane = createControlPlane();

  await controlPlane.createCase(
    {
      caseId: "case-001",
      subjectId: "subject-001",
      createdAt: "2026-04-21T10:00:00.000Z",
    },
    "corr-001",
  );

  await controlPlane.registerSample(
    {
      sampleId: "sample-001",
      caseId: "case-001",
      sampleType: "saliva",
      collectedAt: "2026-04-21T10:05:00.000Z",
      createdAt: "2026-04-21T10:06:00.000Z",
    },
    "corr-002",
  );

  await controlPlane.registerReferenceBundle({
    bundleId: "bundle-grch38-v1",
    name: "GRCh38 core bundle",
    version: "2026.04",
    createdAt: "2026-04-21T10:07:00.000Z",
  });

  await controlPlane.registerSequencingRun(
    {
      runId: "run-001",
      caseId: "case-001",
      sampleId: "sample-001",
      platform: "ONT_MINION",
      referenceBundleId: "bundle-grch38-v1",
      createdAt: "2026-04-21T10:10:00.000Z",
    },
    "corr-003",
  );

  await controlPlane.updateSequencingRunStatus({
    runId: "run-001",
    status: "RUNNING",
    occurredAt: "2026-04-21T10:20:00.000Z",
    correlationId: "corr-004",
  });

  await controlPlane.attachArtifact(
    {
      artifactId: "artifact-001",
      caseId: "case-001",
      runId: "run-001",
      sampleId: "sample-001",
      kind: "RAW_SIGNAL",
      uri: "runs/run-001/raw/readset.pod5",
      createdAt: "2026-04-21T10:30:00.000Z",
    },
    "corr-005",
  );

  await controlPlane.transitionCaseStatus({
    caseId: "case-001",
    nextStatus: "QC_PENDING",
    occurredAt: "2026-04-21T10:40:00.000Z",
    correlationId: "corr-006",
  });

  await controlPlane.transitionCaseStatus({
    caseId: "case-001",
    nextStatus: "QC_PASSED",
    occurredAt: "2026-04-21T10:50:00.000Z",
    correlationId: "corr-007",
  });

  const snapshot = await controlPlane.getCaseSnapshot("case-001");

  assert.equal(snapshot.caseRecord.status, "QC_PASSED");
  assert.equal(snapshot.samples.length, 1);
  assert.equal(snapshot.runs.length, 1);
  assert.equal(snapshot.artifacts.length, 1);
  assert.equal(snapshot.events.length >= 7, true);
  assert.equal(snapshot.runs[0].referenceBundleId, "bundle-grch38-v1");
  assert.equal(snapshot.artifacts[0].kind, "RAW_SIGNAL");
});

test("control plane rejects sequencing runs that reference unknown samples", async () => {
  const controlPlane = createControlPlane();

  await controlPlane.createCase({
    caseId: "case-002",
    subjectId: "subject-002",
    createdAt: "2026-04-21T11:00:00.000Z",
  });

  await controlPlane.registerReferenceBundle({
    bundleId: "bundle-grch38-v2",
    name: "GRCh38 bundle v2",
    version: "2026.04.1",
    createdAt: "2026-04-21T11:02:00.000Z",
  });

  await assert.rejects(
    () =>
      controlPlane.registerSequencingRun({
        runId: "run-unknown-sample",
        caseId: "case-002",
        sampleId: "sample-missing",
        platform: "ONT_MINION",
        referenceBundleId: "bundle-grch38-v2",
        createdAt: "2026-04-21T11:03:00.000Z",
      }),
    /unknown sample/i,
  );
});

test("control plane rejects duplicate case identifiers", async () => {
  const controlPlane = createControlPlane();

  await controlPlane.createCase({
    caseId: "case-duplicate-001",
    subjectId: "subject-duplicate-001",
    createdAt: "2026-04-21T11:10:00.000Z",
  });

  await assert.rejects(
    () =>
      controlPlane.createCase({
        caseId: "case-duplicate-001",
        subjectId: "subject-duplicate-002",
        createdAt: "2026-04-21T11:11:00.000Z",
      }),
    /Case already exists/i,
  );
});

test("control plane stores sequencing telemetry when run status updates", async () => {
  const controlPlane = createControlPlane();

  await controlPlane.createCase({
    caseId: "case-telemetry-001",
    subjectId: "subject-telemetry-001",
    createdAt: "2026-04-21T16:00:00.000Z",
  });

  await controlPlane.registerSample({
    sampleId: "sample-telemetry-001",
    caseId: "case-telemetry-001",
    sampleType: "blood",
    collectedAt: "2026-04-21T16:01:00.000Z",
    createdAt: "2026-04-21T16:02:00.000Z",
  });

  await controlPlane.registerReferenceBundle({
    bundleId: "bundle-telemetry-001",
    name: "GRCh38 bundle",
    version: "2026.04",
    createdAt: "2026-04-21T16:03:00.000Z",
  });

  await controlPlane.registerSequencingRun({
    runId: "run-telemetry-001",
    caseId: "case-telemetry-001",
    sampleId: "sample-telemetry-001",
    platform: "ONT_MINION",
    referenceBundleId: "bundle-telemetry-001",
    createdAt: "2026-04-21T16:04:00.000Z",
  });

  await controlPlane.updateSequencingRunStatus({
    runId: "run-telemetry-001",
    status: "RUNNING",
    occurredAt: "2026-04-21T16:05:00.000Z",
    correlationId: "corr-telemetry-001",
    telemetry: {
      observedAt: "2026-04-21T16:05:00.000Z",
      readCount: 1200,
      activePores: 384,
      n50: 18350,
      estimatedCoverage: 0.42,
    },
  });

  const snapshot = await controlPlane.getCaseSnapshot("case-telemetry-001");
  const statusEvent = snapshot.events.at(-1);

  assert.equal(snapshot.runs[0].telemetry?.activePores, 384);
  assert.equal(snapshot.runs[0].telemetry?.readCount, 1200);
  assert.deepEqual(statusEvent?.detail, {
    runId: "run-telemetry-001",
    status: "RUNNING",
    telemetry: {
      observedAt: "2026-04-21T16:05:00.000Z",
      readCount: 1200,
      activePores: 384,
      n50: 18350,
      estimatedCoverage: 0.42,
    },
  });
});

test("control plane applies adaptive sampling targets through MinKNOW for active ONT runs", async () => {
  const calls: string[] = [];
  const controlPlane = createControlPlane({
    async getRunSnapshot(runId) {
      return {
        runId,
        status: "RUNNING",
      };
    },
    async applyAdaptiveSamplingTarget(input) {
      calls.push(`${input.runId}:${input.format}:${input.targetDefinitionUri}`);
      return {
        sessionId: "adaptive-session-001",
        state: "ACTIVE",
        requestedBy: input.requestedBy,
        appliedAt: input.appliedAt,
        target: {
          label: input.label,
          targetDefinitionUri: input.targetDefinitionUri,
          format: input.format,
          appliedAt: input.appliedAt,
          checksum: input.checksum,
        },
      };
    },
  });

  await controlPlane.createCase({
    caseId: "case-adaptive-001",
    subjectId: "subject-adaptive-001",
    createdAt: "2026-04-21T16:10:00.000Z",
  });

  await controlPlane.registerSample({
    sampleId: "sample-adaptive-001",
    caseId: "case-adaptive-001",
    sampleType: "blood",
    collectedAt: "2026-04-21T16:11:00.000Z",
    createdAt: "2026-04-21T16:12:00.000Z",
  });

  await controlPlane.registerReferenceBundle({
    bundleId: "bundle-adaptive-001",
    name: "GRCh38 bundle",
    version: "2026.04",
    createdAt: "2026-04-21T16:13:00.000Z",
  });

  await controlPlane.registerSequencingRun({
    runId: "run-adaptive-001",
    caseId: "case-adaptive-001",
    sampleId: "sample-adaptive-001",
    platform: "ONT_MINION",
    referenceBundleId: "bundle-adaptive-001",
    createdAt: "2026-04-21T16:14:00.000Z",
  });

  await controlPlane.updateSequencingRunStatus({
    runId: "run-adaptive-001",
    status: "RUNNING",
    occurredAt: "2026-04-21T16:15:00.000Z",
  });

  const updatedRun = await controlPlane.applyAdaptiveSamplingTarget({
    runId: "run-adaptive-001",
    label: "BRCA panel",
    targetDefinitionUri: "targets/brca-panel.bed",
    format: "BED",
    requestedBy: "operator-001",
    occurredAt: "2026-04-21T16:16:00.000Z",
    correlationId: "corr-adaptive-001",
  });

  assert.equal(updatedRun.adaptiveSamplingSession?.sessionId, "adaptive-session-001");
  assert.equal(updatedRun.adaptiveSamplingSession?.target.format, "BED");
  assert.deepEqual(calls, ["run-adaptive-001:BED:targets/brca-panel.bed"]);
});

test("control plane rejects adaptive sampling when sequencing run is not active", async () => {
  const controlPlane = createControlPlane();

  await controlPlane.createCase({
    caseId: "case-adaptive-guard-001",
    subjectId: "subject-adaptive-guard-001",
    createdAt: "2026-04-21T16:20:00.000Z",
  });

  await controlPlane.registerSample({
    sampleId: "sample-adaptive-guard-001",
    caseId: "case-adaptive-guard-001",
    sampleType: "blood",
    collectedAt: "2026-04-21T16:21:00.000Z",
    createdAt: "2026-04-21T16:22:00.000Z",
  });

  await controlPlane.registerReferenceBundle({
    bundleId: "bundle-adaptive-guard-001",
    name: "GRCh38 bundle",
    version: "2026.04",
    createdAt: "2026-04-21T16:23:00.000Z",
  });

  await controlPlane.registerSequencingRun({
    runId: "run-adaptive-guard-001",
    caseId: "case-adaptive-guard-001",
    sampleId: "sample-adaptive-guard-001",
    platform: "ONT_MINION",
    referenceBundleId: "bundle-adaptive-guard-001",
    createdAt: "2026-04-21T16:24:00.000Z",
  });

  await assert.rejects(
    () =>
      controlPlane.applyAdaptiveSamplingTarget({
        runId: "run-adaptive-guard-001",
        label: "BRCA panel",
        targetDefinitionUri: "targets/brca-panel.bed",
        format: "BED",
        occurredAt: "2026-04-21T16:25:00.000Z",
      }),
    /only active ont sequencing runs/i,
  );
});