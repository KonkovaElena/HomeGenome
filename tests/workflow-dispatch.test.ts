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
import { NextflowWorkflowRunner } from "../src/adapters/NextflowWorkflowRunner";
import { IMinKnowClient } from "../src/ports/IMinKnowClient";

function createMinKnowClientStub(): IMinKnowClient {
  return {
    async getRunSnapshot(runId) {
      return { runId, status: "RUNNING" };
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
  analysisWorkflowRunner = new InMemoryAnalysisWorkflowRunner(),
  minKnowClient: IMinKnowClient = createMinKnowClientStub(),
): HomeGenomeControlPlane {
  return new HomeGenomeControlPlane({
    sampleRegistry: new InMemorySampleRegistry(),
    sequencingRunCatalog: new InMemorySequencingRunCatalog(),
    artifactStore: new InMemoryArtifactStore(),
    referenceBundleRegistry: new InMemoryReferenceBundleRegistry(),
    workflowDispatchSink: new InMemoryWorkflowDispatchSink(),
    analysisWorkflowRunner,
    eventStore: new InMemoryEventStore(),
    stateMachineGuard: new InMemoryStateMachineGuard(),
    minKnowClient,
  });
}

async function prepareQcPassedCase(
  controlPlane: HomeGenomeControlPlane,
  caseId: string,
): Promise<void> {
  await controlPlane.createCase({
    caseId,
    subjectId: `${caseId}-subject`,
    createdAt: "2026-04-21T12:00:00.000Z",
  });

  await controlPlane.registerSample({
    sampleId: `${caseId}-sample`,
    caseId,
    sampleType: "blood",
    collectedAt: "2026-04-21T12:01:00.000Z",
    createdAt: "2026-04-21T12:02:00.000Z",
  });

  await controlPlane.registerReferenceBundle({
    bundleId: `${caseId}-bundle`,
    name: "GRCh38 bundle",
    version: "2026.04",
    createdAt: "2026-04-21T12:03:00.000Z",
  });

  await controlPlane.registerSequencingRun({
    runId: `${caseId}-sequencing-run`,
    caseId,
    sampleId: `${caseId}-sample`,
    platform: "ONT_MINION",
    referenceBundleId: `${caseId}-bundle`,
    createdAt: "2026-04-21T12:04:00.000Z",
  });

  await controlPlane.updateSequencingRunStatus({
    runId: `${caseId}-sequencing-run`,
    status: "RUNNING",
    occurredAt: "2026-04-21T12:05:00.000Z",
  });

  await controlPlane.attachArtifact({
    artifactId: `${caseId}-artifact`,
    caseId,
    runId: `${caseId}-sequencing-run`,
    sampleId: `${caseId}-sample`,
    kind: "RAW_SIGNAL",
    uri: `runs/${caseId}/raw.pod5`,
    createdAt: "2026-04-21T12:06:00.000Z",
  });

  await controlPlane.transitionCaseStatus({
    caseId,
    nextStatus: "QC_PENDING",
    occurredAt: "2026-04-21T12:07:00.000Z",
  });

  await controlPlane.transitionCaseStatus({
    caseId,
    nextStatus: "QC_PASSED",
    occurredAt: "2026-04-21T12:08:00.000Z",
  });
}

test("control plane records workflow dispatches and tracked runs", async () => {
  const controlPlane = createControlPlane();

  await prepareQcPassedCase(controlPlane, "case-workflow-001");

  const dispatch = await controlPlane.requestAnalysisWorkflow({
    dispatchId: "dispatch-001",
    caseId: "case-workflow-001",
    requestId: "request-001",
    workflowName: "wf-human-variation",
    referenceBundleId: "case-workflow-001-bundle",
    executionProfile: "local-ont",
    requestedAt: "2026-04-21T12:09:00.000Z",
    correlationId: "corr-workflow-001",
  });

  const run = await controlPlane.startAnalysisWorkflowRun({
    dispatchId: dispatch.dispatchId,
    runId: "analysis-run-001",
    occurredAt: "2026-04-21T12:10:00.000Z",
    correlationId: "corr-workflow-002",
  });

  const completedRun = await controlPlane.completeAnalysisWorkflowRun({
    runId: run.runId,
    occurredAt: "2026-04-21T12:11:00.000Z",
    correlationId: "corr-workflow-003",
  });

  const snapshot = await controlPlane.getCaseSnapshot("case-workflow-001");

  assert.equal(dispatch.status, "PENDING");
  assert.equal(run.status, "RUNNING");
  assert.equal(completedRun.status, "COMPLETED");
  assert.equal(snapshot.workflowDispatches.length, 1);
  assert.equal(snapshot.workflowRuns.length, 1);
  assert.equal(snapshot.caseRecord.status, "INTERPRETATION_RUNNING");
  assert.equal(snapshot.workflowRuns[0].workflowName, "wf-human-variation");
});

test("control plane rejects workflow requests before QC passes", async () => {
  const controlPlane = createControlPlane();

  await controlPlane.createCase({
    caseId: "case-workflow-guard-001",
    subjectId: "subject-workflow-guard-001",
    createdAt: "2026-04-21T13:00:00.000Z",
  });

  await controlPlane.registerReferenceBundle({
    bundleId: "bundle-workflow-guard-001",
    name: "GRCh38 bundle",
    version: "2026.04",
    createdAt: "2026-04-21T13:01:00.000Z",
  });

  await assert.rejects(
    () =>
      controlPlane.requestAnalysisWorkflow({
        dispatchId: "dispatch-guard-001",
        caseId: "case-workflow-guard-001",
        requestId: "request-guard-001",
        workflowName: "wf-human-variation",
        referenceBundleId: "bundle-workflow-guard-001",
        executionProfile: "local-ont",
        requestedAt: "2026-04-21T13:02:00.000Z",
      }),
    /not ready for workflow dispatch/i,
  );
});

test("workflow dispatch sink is idempotent for matching replay and rejects mismatches", async () => {
  const sink = new InMemoryWorkflowDispatchSink();

  await sink.recordWorkflowRequested({
    dispatchId: "dispatch-replay-001",
    caseId: "case-replay-001",
    requestId: "request-replay-001",
    workflowName: "wf-human-variation",
    referenceBundleId: "bundle-replay-001",
    executionProfile: "local-ont",
    requestedAt: "2026-04-21T14:00:00.000Z",
    status: "PENDING",
  });

  await sink.recordWorkflowRequested({
    dispatchId: "dispatch-replay-001",
    caseId: "case-replay-001",
    requestId: "request-replay-001",
    workflowName: "wf-human-variation",
    referenceBundleId: "bundle-replay-001",
    executionProfile: "local-ont",
    requestedAt: "2026-04-21T14:00:00.000Z",
    status: "PENDING",
  });

  await assert.rejects(
    () =>
      sink.recordWorkflowRequested({
        dispatchId: "dispatch-replay-001",
        caseId: "case-replay-001",
        requestId: "request-replay-001",
        workflowName: "wf-human-qc",
        referenceBundleId: "bundle-replay-001",
        executionProfile: "local-ont",
        requestedAt: "2026-04-21T14:00:00.000Z",
        status: "PENDING",
      }),
    /does not match existing dispatch/i,
  );
});

test("nextflow workflow runner uses its client contract to start and cancel runs", async () => {
  const calls: string[] = [];
  const runner = new NextflowWorkflowRunner({
    async submit(request) {
      calls.push(`submit:${request.workflowName}:${request.configProfile}`);
      return {
        sessionId: "nf-session-001",
        runName: "quiet-heron",
      };
    },
    async cancel(sessionId) {
      calls.push(`cancel:${sessionId}`);
    },
  });

  const run = await runner.startRun({
    runId: "nf-run-001",
    caseId: "case-nf-001",
    requestId: "request-nf-001",
    workflowName: "wf-human-variation",
    referenceBundleId: "GRCh38-2026.04",
    executionProfile: "nextflow-local",
  });

  const cancelled = await runner.cancelRun(run.runId);

  assert.equal(run.terminalMetadata?.backend, "NEXTFLOW");
  assert.equal(run.terminalMetadata?.nextflowSessionId, "nf-session-001");
  assert.equal(cancelled.status, "CANCELLED");
  assert.deepEqual(calls, [
    "submit:wf-human-variation:nextflow-local",
    "cancel:nf-session-001",
  ]);
});

test("nextflow workflow runner surfaces submit failures from its client", async () => {
  const runner = new NextflowWorkflowRunner({
    async submit() {
      throw new Error("submit failed");
    },
    async cancel() {
      throw new Error("cancel should not be called");
    },
  });

  await assert.rejects(
    () =>
      runner.startRun({
        runId: "nf-run-fail-001",
        caseId: "case-nf-fail-001",
        requestId: "request-nf-fail-001",
        workflowName: "wf-human-variation",
        referenceBundleId: "GRCh38-2026.04",
        executionProfile: "nextflow-local",
      }),
    /submit failed/,
  );
});