import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { HomeGenomeControlPlane } from "../src/application/HomeGenomeControlPlane";
import { InMemoryArtifactStore } from "../src/adapters/InMemoryArtifactStore";
import { InMemoryAnalysisWorkflowRunner } from "../src/adapters/InMemoryAnalysisWorkflowRunner";
import { InMemoryEventStore } from "../src/adapters/InMemoryEventStore";
import { InMemoryReferenceBundleRegistry } from "../src/adapters/InMemoryReferenceBundleRegistry";
import { InMemorySampleRegistry } from "../src/adapters/InMemorySampleRegistry";
import { InMemorySequencingRunCatalog } from "../src/adapters/InMemorySequencingRunCatalog";
import { InMemoryStateMachineGuard } from "../src/adapters/InMemoryStateMachineGuard";
import { InMemoryWorkflowDispatchSink } from "../src/adapters/InMemoryWorkflowDispatchSink";
import { HomeGenomeCaseRecord } from "../src/domain/homeGenome";
import { ISampleRegistry } from "../src/ports/ISampleRegistry";
import { IMinKnowClient } from "../src/ports/IMinKnowClient";

const RAW_SIGNAL_CHECKSUM =
  "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const WORKFLOW_SIGNAL_CHECKSUM =
  "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const EXPORT_SIGNAL_CHECKSUM =
  "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";
const EXPORT_SIGNAL_DRS_ID =
  "sha256-cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";

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

type SampleRegistryCompareAndSwapFacade = {
  updateCaseStatus(
    caseId: string,
    status: string,
    updatedAt: string,
    expectedCurrentStatus?: string,
  ): Promise<{ status: string }>;
};

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
      checksum: RAW_SIGNAL_CHECKSUM,
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
  assert.equal(snapshot.artifacts[0].checksum, RAW_SIGNAL_CHECKSUM);
});

test("control plane rejects artifacts without a normalized sha256 checksum", async () => {
  const controlPlane = createControlPlane();

  await controlPlane.createCase({
    caseId: "case-checksum-guard-001",
    subjectId: "subject-checksum-guard-001",
    createdAt: "2026-04-22T07:00:00.000Z",
  });

  await controlPlane.registerSample({
    sampleId: "sample-checksum-guard-001",
    caseId: "case-checksum-guard-001",
    sampleType: "blood",
    collectedAt: "2026-04-22T07:01:00.000Z",
    createdAt: "2026-04-22T07:02:00.000Z",
  });

  await controlPlane.registerReferenceBundle({
    bundleId: "bundle-checksum-guard-001",
    name: "GRCh38 bundle",
    version: "2026.04",
    createdAt: "2026-04-22T07:03:00.000Z",
  });

  await controlPlane.registerSequencingRun({
    runId: "run-checksum-guard-001",
    caseId: "case-checksum-guard-001",
    sampleId: "sample-checksum-guard-001",
    platform: "ONT_MINION",
    referenceBundleId: "bundle-checksum-guard-001",
    createdAt: "2026-04-22T07:04:00.000Z",
  });

  await assert.rejects(
    () =>
      controlPlane.attachArtifact({
        artifactId: "artifact-checksum-guard-001",
        caseId: "case-checksum-guard-001",
        runId: "run-checksum-guard-001",
        sampleId: "sample-checksum-guard-001",
        kind: "RAW_SIGNAL",
        uri: "runs/run-checksum-guard-001/raw.pod5",
        checksum: "sha256:abc123",
        createdAt: "2026-04-22T07:05:00.000Z",
      }),
    /artifact checksum must be a sha256 digest/i,
  );
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

test("in-memory sample registry rejects stale compare-and-swap status writes", async () => {
  const registry = new InMemorySampleRegistry();
  const registryWithCas =
    registry as unknown as SampleRegistryCompareAndSwapFacade;

  await registry.createCase({
    caseId: "case-cas-memory-001",
    subjectId: "subject-cas-memory-001",
    createdAt: "2026-04-23T12:00:00.000Z",
  });

  await registryWithCas.updateCaseStatus(
    "case-cas-memory-001",
    "BIOSAMPLE_REGISTERED",
    "2026-04-23T12:01:00.000Z",
    "INTAKE_PENDING",
  );

  await assert.rejects(
    () =>
      registryWithCas.updateCaseStatus(
        "case-cas-memory-001",
        "SEQUENCING_REQUESTED",
        "2026-04-23T12:02:00.000Z",
        "INTAKE_PENDING",
      ),
    /stale case status/i,
  );
});

test("control plane rejects stale case status transitions when state changes between read and write", async () => {
  let caseRecord: HomeGenomeCaseRecord = {
    caseId: "case-cas-control-plane-001",
    subjectId: "subject-cas-control-plane-001",
    status: "RAW_ARTIFACTS_CAPTURED",
    createdAt: "2026-04-23T12:10:00.000Z",
    updatedAt: "2026-04-23T12:10:00.000Z",
  };

  const sampleRegistry: ISampleRegistry = {
    async createCase() {
      throw new Error("not implemented");
    },
    async getCase(caseId) {
      return caseId === caseRecord.caseId ? { ...caseRecord } : undefined;
    },
    async updateCaseStatus(caseId, status, updatedAt, expectedCurrentStatus) {
      if (caseId !== caseRecord.caseId) {
        throw new Error(`Unknown case: ${caseId}`);
      }

      caseRecord = {
        ...caseRecord,
        status: "QC_PENDING",
        updatedAt,
      };

      if (
        expectedCurrentStatus !== undefined &&
        caseRecord.status !== expectedCurrentStatus
      ) {
        throw new Error(
          `Stale case status update for ${caseId}: expected ${expectedCurrentStatus}, got ${caseRecord.status}`,
        );
      }

      caseRecord = {
        ...caseRecord,
        status,
        updatedAt,
      };

      return { ...caseRecord };
    },
    async registerSample() {
      throw new Error("not implemented");
    },
    async listSamples() {
      return [];
    },
  };

  const controlPlane = new HomeGenomeControlPlane({
    sampleRegistry,
    sequencingRunCatalog: new InMemorySequencingRunCatalog(),
    artifactStore: new InMemoryArtifactStore(),
    referenceBundleRegistry: new InMemoryReferenceBundleRegistry(),
    workflowDispatchSink: new InMemoryWorkflowDispatchSink(),
    analysisWorkflowRunner: new InMemoryAnalysisWorkflowRunner(),
    eventStore: new InMemoryEventStore(),
    stateMachineGuard: new InMemoryStateMachineGuard(),
    minKnowClient: createMinKnowClientStub(),
  });

  await assert.rejects(
    () =>
      controlPlane.transitionCaseStatus({
        caseId: "case-cas-control-plane-001",
        nextStatus: "QC_PENDING",
        occurredAt: "2026-04-23T12:11:00.000Z",
      }),
    /stale case status/i,
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

test("control plane exports a case bundle with RO-Crate, PROV, and DRS references", async (t) => {
  const controlPlane = createControlPlane();

  await controlPlane.createCase({
    caseId: "case-export-001",
    subjectId: "subject-export-001",
    createdAt: "2026-04-22T08:00:00.000Z",
  });

  await controlPlane.registerSample({
    sampleId: "sample-export-001",
    caseId: "case-export-001",
    sampleType: "saliva",
    collectedAt: "2026-04-22T08:01:00.000Z",
    createdAt: "2026-04-22T08:02:00.000Z",
  });

  await controlPlane.registerReferenceBundle({
    bundleId: "bundle-export-001",
    name: "GRCh38 bundle",
    version: "2026.04",
    createdAt: "2026-04-22T08:03:00.000Z",
  });

  await controlPlane.registerSequencingRun({
    runId: "run-export-001",
    caseId: "case-export-001",
    sampleId: "sample-export-001",
    platform: "ONT_MINION",
    referenceBundleId: "bundle-export-001",
    createdAt: "2026-04-22T08:04:00.000Z",
  });

  await controlPlane.updateSequencingRunStatus({
    runId: "run-export-001",
    status: "RUNNING",
    occurredAt: "2026-04-22T08:05:00.000Z",
  });

  await controlPlane.attachArtifact({
    artifactId: "artifact-export-001",
    caseId: "case-export-001",
    runId: "run-export-001",
    sampleId: "sample-export-001",
    kind: "RAW_SIGNAL",
    uri: "runs/run-export-001/raw.pod5",
    checksum: EXPORT_SIGNAL_CHECKSUM,
    createdAt: "2026-04-22T08:06:00.000Z",
  });

  await controlPlane.transitionCaseStatus({
    caseId: "case-export-001",
    nextStatus: "QC_PENDING",
    occurredAt: "2026-04-22T08:07:00.000Z",
  });

  await controlPlane.transitionCaseStatus({
    caseId: "case-export-001",
    nextStatus: "QC_PASSED",
    occurredAt: "2026-04-22T08:08:00.000Z",
  });

  await controlPlane.requestAnalysisWorkflow({
    dispatchId: "dispatch-export-001",
    caseId: "case-export-001",
    requestId: "request-export-001",
    workflowName: "wf-human-variation",
    referenceBundleId: "bundle-export-001",
    executionProfile: "local-ont",
    requestedAt: "2026-04-22T08:09:00.000Z",
  });

  t.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2026-04-22T08:10:00.000Z"),
  });

  await controlPlane.startAnalysisWorkflowRun({
    dispatchId: "dispatch-export-001",
    runId: "analysis-run-export-001",
    occurredAt: "2026-04-22T08:10:00.000Z",
  });

  const bundle = await controlPlane.exportCaseBundle({
    caseId: "case-export-001",
    bundleId: "homegenome-export-bundle-001",
    generatedAt: "2026-04-22T08:11:00.000Z",
    generatedBy: "operator-export-001",
  });

  assert.equal(bundle.schemaVersion, "1.0.0");
  assert.equal(bundle.caseId, "case-export-001");
  assert.equal(bundle.bundleId, "homegenome-export-bundle-001");
  assert.equal(bundle.roCrateMetadata["@context"], "https://w3id.org/ro/crate/1.1/context");
  assert.equal(bundle.prov["@context"], "https://www.w3.org/ns/prov#");
  assert.equal(bundle.workflowRunCrates.length, 1);
  assert.equal(bundle.workflowRunCrates[0].runId, "analysis-run-export-001");
  assert.equal(bundle.drsObjects.length, 1);
  assert.equal(bundle.drsObjects[0].id, EXPORT_SIGNAL_DRS_ID);
  assert.equal(bundle.drsObjects[0].selfUri.includes("drs://"), true);
  assert.equal(bundle.drsObjects[0].checksums[0].type, "sha-256");
  assert.equal(bundle.drsObjects[0].checksums[0].checksum, EXPORT_SIGNAL_CHECKSUM.replace("sha256:", ""));
  assert.equal(bundle.drsObjects[0].accessMethods[0].type, "file");
  const metadataDescriptor = bundle.roCrateMetadata["@graph"][0] as Record<string, unknown>;
  const conformsTo = metadataDescriptor.conformsTo as Record<string, string>;
  assert.equal(conformsTo["@id"], "https://w3id.org/ro/crate/1.1");
  assert.equal(typeof bundle.prov.entity, "object");
  assert.equal(typeof bundle.prov.wasGeneratedBy, "object");
  assert.equal(typeof bundle.prov.used, "object");
  assert.equal(typeof bundle.prov.wasAssociatedWith, "object");

  t.assert.fileSnapshot(
    bundle,
    path.resolve("tests", "snapshots", "case-export-bundle.snapshot.json"),
    {
      serializers: [(value) => JSON.stringify(value, null, 2) + "\n"],
    },
  );
});