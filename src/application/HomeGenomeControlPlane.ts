import {
  AdaptiveSamplingTargetFormat,
  AnalysisWorkflowFailureCategory,
  AnalysisWorkflowRunRecord,
  AdaptiveSamplingSessionRecord,
  ArtifactManifestRecord,
  WorkflowDispatchRecord,
  CreateHomeGenomeCaseInput,
  HomeGenomeCaseRecord,
  HomeGenomeCaseStatus,
  ReferenceBundleRecord,
  RequestAnalysisWorkflowInput,
  RegisterArtifactInput,
  RegisterBiosampleInput,
  RegisterReferenceBundleInput,
  RegisterSequencingRunInput,
  SequencingRunTelemetrySnapshot,
  SequencingRunRecord,
  SequencingRunStatus,
  BiosampleRecord,
  isRawCaptureArtifact,
  normalizeTimestamp,
} from "../domain/homeGenome";
import { IArtifactStore } from "../ports/IArtifactStore";
import {
  AnalysisWorkflowRunRequest,
  IAnalysisWorkflowRunner,
} from "../ports/IAnalysisWorkflowRunner";
import { IEventStore, PersistedEventRecord } from "../ports/IEventStore";
import { IMinKnowClient } from "../ports/IMinKnowClient";
import { IReferenceBundleRegistry } from "../ports/IReferenceBundleRegistry";
import { ISampleRegistry } from "../ports/ISampleRegistry";
import { ISequencingRunCatalog } from "../ports/ISequencingRunCatalog";
import { IStateMachineGuard } from "../ports/IStateMachineGuard";
import { IWorkflowDispatchSink } from "../ports/IWorkflowDispatchSink";

export interface HomeGenomeAuditEventInput {
  aggregateId: string;
  type: string;
  occurredAt: string;
  correlationId?: string;
  detail: Record<string, unknown>;
}

export type HomeGenomeAuditEventRecord = PersistedEventRecord<HomeGenomeAuditEventInput>;

export interface TransitionCaseStatusInput {
  caseId: string;
  nextStatus: HomeGenomeCaseStatus;
  occurredAt?: string;
  correlationId?: string;
}

export interface UpdateSequencingRunStatusInput {
  runId: string;
  status: SequencingRunStatus;
  occurredAt?: string;
  correlationId?: string;
  telemetry?: SequencingRunTelemetrySnapshot;
}

export interface ApplyAdaptiveSamplingTargetInput {
  runId: string;
  label: string;
  targetDefinitionUri: string;
  format: AdaptiveSamplingTargetFormat;
  requestedBy?: string;
  checksum?: string;
  occurredAt?: string;
  correlationId?: string;
}

export interface SynchronizeSequencingRunFromMinKnowInput {
  runId: string;
  occurredAt?: string;
  correlationId?: string;
}

export interface StartAnalysisWorkflowRunInput {
  dispatchId: string;
  runId: string;
  occurredAt?: string;
  correlationId?: string;
}

export interface CompleteAnalysisWorkflowRunInput {
  runId: string;
  occurredAt?: string;
  correlationId?: string;
}

export interface CancelAnalysisWorkflowRunInput {
  runId: string;
  occurredAt?: string;
  correlationId?: string;
}

export interface FailAnalysisWorkflowRunInput {
  runId: string;
  reason: string;
  failureCategory?: AnalysisWorkflowFailureCategory;
  occurredAt?: string;
  correlationId?: string;
}

export interface HomeGenomeCaseSnapshot {
  caseRecord: HomeGenomeCaseRecord;
  samples: ReadonlyArray<BiosampleRecord>;
  runs: ReadonlyArray<SequencingRunRecord>;
  workflowDispatches: ReadonlyArray<WorkflowDispatchRecord>;
  workflowRuns: ReadonlyArray<AnalysisWorkflowRunRecord>;
  artifacts: ReadonlyArray<ArtifactManifestRecord>;
  events: ReadonlyArray<HomeGenomeAuditEventRecord>;
}

export interface ExportCaseBundleInput {
  caseId: string;
  bundleId?: string;
  generatedAt?: string;
  generatedBy?: string;
}

export interface CaseBundleDrsObject {
  objectId: string;
  uri: string;
  sourceUri: string;
  checksum?: string;
  mediaType: string;
}

export interface WorkflowRunExportBundleRecord {
  crateId: string;
  runId: string;
  status: AnalysisWorkflowRunRecord["status"];
  workflowName: string;
  executionProfile: string;
  acceptedAt: string;
  completedAt?: string;
  backend?: NonNullable<AnalysisWorkflowRunRecord["terminalMetadata"]>["backend"];
  nextflowSessionId?: string;
}

export interface CaseExportBundle {
  schemaVersion: "1.0.0";
  bundleId: string;
  caseId: string;
  generatedAt: string;
  generatedBy: string;
  roCrateMetadata: {
    "@context": "https://w3id.org/ro/crate/1.1/context";
    "@graph": ReadonlyArray<Record<string, unknown>>;
  };
  workflowRunCrates: ReadonlyArray<WorkflowRunExportBundleRecord>;
  drsObjects: ReadonlyArray<CaseBundleDrsObject>;
  prov: {
    "@context": "https://www.w3.org/ns/prov#";
    entity: string;
    activity: string;
    agent: string;
    wasDerivedFrom: ReadonlyArray<string>;
    generatedAt: string;
  };
  snapshot: HomeGenomeCaseSnapshot;
}

export interface HomeGenomeControlPlaneDependencies {
  sampleRegistry: ISampleRegistry;
  sequencingRunCatalog: ISequencingRunCatalog;
  artifactStore: IArtifactStore;
  referenceBundleRegistry: IReferenceBundleRegistry;
  workflowDispatchSink: IWorkflowDispatchSink;
  analysisWorkflowRunner: IAnalysisWorkflowRunner;
  eventStore: IEventStore<HomeGenomeAuditEventInput>;
  stateMachineGuard: IStateMachineGuard;
  minKnowClient: IMinKnowClient;
}

export class HomeGenomeControlPlane {
  constructor(
    private readonly deps: HomeGenomeControlPlaneDependencies,
  ) {}

  async createCase(
    input: CreateHomeGenomeCaseInput,
    correlationId?: string,
  ): Promise<HomeGenomeCaseRecord> {
    const record = await this.deps.sampleRegistry.createCase(input);

    await this.appendCaseEvent(record.caseId, "CASE_CREATED", input.createdAt, correlationId, {
      subjectId: input.subjectId,
      status: record.status,
    });

    return record;
  }

  async registerSample(
    input: RegisterBiosampleInput,
    correlationId?: string,
  ): Promise<BiosampleRecord> {
    const caseRecord = await this.requireCase(input.caseId);
    const sample = await this.deps.sampleRegistry.registerSample(input);

    if (caseRecord.status === "INTAKE_PENDING") {
      await this.transitionCaseStatus({
        caseId: input.caseId,
        nextStatus: "BIOSAMPLE_REGISTERED",
        occurredAt: input.createdAt,
        correlationId,
      });
    }

    await this.appendCaseEvent(input.caseId, "SAMPLE_REGISTERED", input.createdAt, correlationId, {
      sampleId: sample.sampleId,
      sampleType: sample.sampleType,
    });

    return sample;
  }

  async registerReferenceBundle(
    input: RegisterReferenceBundleInput,
  ): Promise<ReferenceBundleRecord> {
    return this.deps.referenceBundleRegistry.registerBundle(input);
  }

  async requestAnalysisWorkflow(
    input: RequestAnalysisWorkflowInput,
  ): Promise<WorkflowDispatchRecord> {
    const caseRecord = await this.requireCase(input.caseId);

    if (
      caseRecord.status !== "QC_PASSED" &&
      caseRecord.status !== "REANALYSIS_REQUESTED" &&
      caseRecord.status !== "PRIMARY_ANALYSIS_RUNNING"
    ) {
      throw new Error(
        `Case is not ready for workflow dispatch: ${input.caseId} (${caseRecord.status})`,
      );
    }

    const bundle = await this.deps.referenceBundleRegistry.getBundle(
      input.referenceBundleId,
    );

    if (!bundle) {
      throw new Error(`Unknown reference bundle: ${input.referenceBundleId}`);
    }

    const dispatch: WorkflowDispatchRecord = {
      dispatchId: input.dispatchId,
      caseId: input.caseId,
      requestId: input.requestId,
      workflowName: input.workflowName,
      referenceBundleId: input.referenceBundleId,
      executionProfile: input.executionProfile,
      requestedBy: input.requestedBy,
      requestedAt: normalizeTimestamp(input.requestedAt),
      idempotencyKey: input.idempotencyKey,
      correlationId: input.correlationId,
      status: "PENDING",
    };

    await this.deps.workflowDispatchSink.recordWorkflowRequested(dispatch);

    await this.appendCaseEvent(input.caseId, "ANALYSIS_WORKFLOW_REQUESTED", input.requestedAt, input.correlationId, {
      dispatchId: input.dispatchId,
      requestId: input.requestId,
      workflowName: input.workflowName,
      referenceBundleId: input.referenceBundleId,
      executionProfile: input.executionProfile,
    });

    return dispatch;
  }

  async registerSequencingRun(
    input: RegisterSequencingRunInput,
    correlationId?: string,
  ): Promise<SequencingRunRecord> {
    const caseRecord = await this.requireCase(input.caseId);
    const sampleIds = new Set(
      (await this.deps.sampleRegistry.listSamples(input.caseId)).map(
        (sample) => sample.sampleId,
      ),
    );

    if (!sampleIds.has(input.sampleId)) {
      throw new Error(
        `Cannot register sequencing run for unknown sample: ${input.sampleId}`,
      );
    }

    if (input.referenceBundleId) {
      const bundle = await this.deps.referenceBundleRegistry.getBundle(
        input.referenceBundleId,
      );

      if (!bundle) {
        throw new Error(
          `Unknown reference bundle: ${input.referenceBundleId}`,
        );
      }
    }

    const run = await this.deps.sequencingRunCatalog.registerRun(input);

    if (caseRecord.status === "BIOSAMPLE_REGISTERED") {
      await this.transitionCaseStatus({
        caseId: input.caseId,
        nextStatus: "SEQUENCING_REQUESTED",
        occurredAt: input.createdAt,
        correlationId,
      });
    }

    await this.appendCaseEvent(input.caseId, "SEQUENCING_RUN_REGISTERED", input.createdAt, correlationId, {
      runId: run.runId,
      sampleId: run.sampleId,
      platform: run.platform,
      referenceBundleId: run.referenceBundleId,
    });

    return run;
  }

  async updateSequencingRunStatus(
    input: UpdateSequencingRunStatusInput,
  ): Promise<SequencingRunRecord> {
    const run = await this.requireRun(input.runId);
    const next = await this.deps.sequencingRunCatalog.updateRunStatus(
      input.runId,
      input.status,
      normalizeTimestamp(input.occurredAt),
      {
        telemetry: input.telemetry,
      },
    );

    if (input.status === "RUNNING") {
      const caseRecord = await this.requireCase(run.caseId);

      if (caseRecord.status === "SEQUENCING_REQUESTED") {
        await this.transitionCaseStatus({
          caseId: run.caseId,
          nextStatus: "SEQUENCING_RUNNING",
          occurredAt: input.occurredAt,
          correlationId: input.correlationId,
        });
      }
    }

    await this.appendCaseEvent(run.caseId, "SEQUENCING_RUN_STATUS_UPDATED", input.occurredAt, input.correlationId, {
      runId: run.runId,
      status: input.status,
      telemetry: input.telemetry,
    });

    return next;
  }

  async synchronizeSequencingRunFromMinKnow(
    input: SynchronizeSequencingRunFromMinKnowInput,
  ): Promise<SequencingRunRecord> {
    const snapshot = await this.deps.minKnowClient.getRunSnapshot(input.runId);

    return this.updateSequencingRunStatus({
      runId: input.runId,
      status: snapshot.status,
      occurredAt: input.occurredAt ?? snapshot.telemetry?.observedAt,
      correlationId: input.correlationId,
      telemetry: snapshot.telemetry,
    });
  }

  async applyAdaptiveSamplingTarget(
    input: ApplyAdaptiveSamplingTargetInput,
  ): Promise<SequencingRunRecord> {
    const run = await this.requireRun(input.runId);

    if (run.platform !== "ONT_MINION" || run.status !== "RUNNING") {
      throw new Error(
        `Only active ONT sequencing runs can accept adaptive sampling updates: ${input.runId}`,
      );
    }

    const adaptiveSamplingSession =
      await this.deps.minKnowClient.applyAdaptiveSamplingTarget({
        runId: input.runId,
        label: input.label,
        targetDefinitionUri: input.targetDefinitionUri,
        format: input.format,
        appliedAt: normalizeTimestamp(input.occurredAt),
        requestedBy: input.requestedBy,
        checksum: input.checksum,
      });

    const next = await this.deps.sequencingRunCatalog.updateAdaptiveSamplingSession(
      input.runId,
      adaptiveSamplingSession,
      normalizeTimestamp(input.occurredAt),
    );

    await this.appendCaseEvent(
      run.caseId,
      "ADAPTIVE_SAMPLING_TARGET_APPLIED",
      input.occurredAt,
      input.correlationId,
      {
        runId: run.runId,
        adaptiveSamplingSession,
      },
    );

    return next;
  }

  async attachArtifact(
    input: RegisterArtifactInput,
    correlationId?: string,
  ): Promise<ArtifactManifestRecord> {
    const caseRecord = await this.requireCase(input.caseId);

    if (input.runId) {
      await this.requireRun(input.runId);
    }

    const artifact = await this.deps.artifactStore.registerArtifact(input);

    if (
      isRawCaptureArtifact(artifact.kind) &&
      (caseRecord.status === "SEQUENCING_REQUESTED" ||
        caseRecord.status === "SEQUENCING_RUNNING")
    ) {
      await this.transitionCaseStatus({
        caseId: input.caseId,
        nextStatus: "RAW_ARTIFACTS_CAPTURED",
        occurredAt: input.createdAt,
        correlationId,
      });
    }

    await this.appendCaseEvent(input.caseId, "ARTIFACT_REGISTERED", input.createdAt, correlationId, {
      artifactId: artifact.artifactId,
      kind: artifact.kind,
      uri: artifact.uri,
      runId: artifact.runId,
    });

    return artifact;
  }

  async startAnalysisWorkflowRun(
    input: StartAnalysisWorkflowRunInput,
  ): Promise<AnalysisWorkflowRunRecord> {
    const dispatch = await this.requireDispatch(input.dispatchId);
    const request: AnalysisWorkflowRunRequest = {
      runId: input.runId,
      caseId: dispatch.caseId,
      requestId: dispatch.requestId,
      workflowName: dispatch.workflowName,
      referenceBundleId: dispatch.referenceBundleId,
      executionProfile: dispatch.executionProfile,
    };

    const run = await this.deps.analysisWorkflowRunner.startRun(request);
    const caseRecord = await this.requireCase(dispatch.caseId);

    if (
      caseRecord.status === "QC_PASSED" ||
      caseRecord.status === "REANALYSIS_REQUESTED"
    ) {
      await this.transitionCaseStatus({
        caseId: dispatch.caseId,
        nextStatus: "PRIMARY_ANALYSIS_RUNNING",
        occurredAt: input.occurredAt,
        correlationId: input.correlationId,
      });
    }

    await this.appendCaseEvent(dispatch.caseId, "ANALYSIS_WORKFLOW_RUN_STARTED", input.occurredAt, input.correlationId, {
      dispatchId: dispatch.dispatchId,
      runId: input.runId,
      workflowName: dispatch.workflowName,
    });

    return run;
  }

  async completeAnalysisWorkflowRun(
    input: CompleteAnalysisWorkflowRunInput,
  ): Promise<AnalysisWorkflowRunRecord> {
    const run = await this.deps.analysisWorkflowRunner.completeRun(input.runId);
    const caseRecord = await this.requireCase(run.caseId);

    if (caseRecord.status === "PRIMARY_ANALYSIS_RUNNING") {
      await this.transitionCaseStatus({
        caseId: run.caseId,
        nextStatus: "INTERPRETATION_RUNNING",
        occurredAt: input.occurredAt,
        correlationId: input.correlationId,
      });
    }

    await this.appendCaseEvent(run.caseId, "ANALYSIS_WORKFLOW_RUN_COMPLETED", input.occurredAt, input.correlationId, {
      runId: input.runId,
      workflowName: run.workflowName,
    });

    return run;
  }

  async cancelAnalysisWorkflowRun(
    input: CancelAnalysisWorkflowRunInput,
  ): Promise<AnalysisWorkflowRunRecord> {
    const run = await this.deps.analysisWorkflowRunner.cancelRun(input.runId);

    await this.appendCaseEvent(run.caseId, "ANALYSIS_WORKFLOW_RUN_CANCELLED", input.occurredAt, input.correlationId, {
      runId: input.runId,
      workflowName: run.workflowName,
    });

    return run;
  }

  async failAnalysisWorkflowRun(
    input: FailAnalysisWorkflowRunInput,
  ): Promise<AnalysisWorkflowRunRecord> {
    const run = await this.deps.analysisWorkflowRunner.failRun(
      input.runId,
      input.reason,
      input.failureCategory,
    );

    await this.appendCaseEvent(run.caseId, "ANALYSIS_WORKFLOW_RUN_FAILED", input.occurredAt, input.correlationId, {
      runId: input.runId,
      workflowName: run.workflowName,
      reason: input.reason,
      failureCategory: input.failureCategory ?? "unknown",
    });

    return run;
  }

  async transitionCaseStatus(
    input: TransitionCaseStatusInput,
  ): Promise<HomeGenomeCaseRecord> {
    const current = await this.requireCase(input.caseId);
    this.deps.stateMachineGuard.assertTransition(current.status, input.nextStatus);

    const next = await this.deps.sampleRegistry.updateCaseStatus(
      input.caseId,
      input.nextStatus,
      normalizeTimestamp(input.occurredAt),
    );

    await this.appendCaseEvent(input.caseId, "CASE_STATUS_TRANSITIONED", input.occurredAt, input.correlationId, {
      previousStatus: current.status,
      nextStatus: input.nextStatus,
    });

    return next;
  }

  async getCaseSnapshot(caseId: string): Promise<HomeGenomeCaseSnapshot> {
    const caseRecord = await this.requireCase(caseId);

    return {
      caseRecord,
      samples: await this.deps.sampleRegistry.listSamples(caseId),
      runs: await this.deps.sequencingRunCatalog.listRuns(caseId),
      workflowDispatches: await this.deps.workflowDispatchSink.listDispatches(caseId),
      workflowRuns: await this.deps.analysisWorkflowRunner.listRunsByCaseId(caseId),
      artifacts: await this.deps.artifactStore.listArtifacts(caseId),
      events: await this.deps.eventStore.listByAggregateId(caseId),
    };
  }

  async exportCaseBundle(
    input: ExportCaseBundleInput,
  ): Promise<CaseExportBundle> {
    const snapshot = await this.getCaseSnapshot(input.caseId);
    const generatedAt = normalizeTimestamp(input.generatedAt);
    const generatedBy =
      input.generatedBy?.trim() || "homegenome-control-plane";
    const bundleId =
      input.bundleId?.trim() || `case-${snapshot.caseRecord.caseId}-bundle`;

    const caseEntityId = `urn:homegenome:case:${snapshot.caseRecord.caseId}`;
    const exportActivityId =
      `urn:homegenome:activity:bundle-export:${snapshot.caseRecord.caseId}:${generatedAt}`;
    const exportAgentId =
      `urn:homegenome:agent:${encodeURIComponent(generatedBy)}`;

    const drsObjects = snapshot.artifacts.map((artifact) =>
      this.toDrsObject(artifact),
    );

    const workflowRunCrates = snapshot.workflowRuns.map((run) => ({
      crateId: `run-${run.runId}-crate`,
      runId: run.runId,
      status: run.status,
      workflowName: run.workflowName,
      executionProfile: run.executionProfile,
      acceptedAt: run.acceptedAt,
      completedAt: run.completedAt,
      backend: run.terminalMetadata?.backend,
      nextflowSessionId: run.terminalMetadata?.nextflowSessionId,
    }));

    const roCrateGraph: Record<string, unknown>[] = [
      {
        "@id": "ro-crate-metadata.jsonld",
        "@type": "CreativeWork",
        about: {
          "@id": "./",
        },
      },
      {
        "@id": "./",
        "@type": "Dataset",
        name: `HomeGenome Case Bundle ${snapshot.caseRecord.caseId}`,
        identifier: bundleId,
        dateCreated: generatedAt,
        creator: {
          "@id": exportAgentId,
        },
        hasPart: snapshot.artifacts.map((artifact) => ({
          "@id": artifact.uri,
        })),
      },
      {
        "@id": caseEntityId,
        "@type": "Dataset",
        name: `HomeGenome Case ${snapshot.caseRecord.caseId}`,
        identifier: snapshot.caseRecord.caseId,
        dateCreated: snapshot.caseRecord.createdAt,
        dateModified: snapshot.caseRecord.updatedAt,
      },
      {
        "@id": exportAgentId,
        "@type": "Person",
        name: generatedBy,
      },
    ];

    for (const artifact of snapshot.artifacts) {
      const drsObject = this.toDrsObject(artifact);
      roCrateGraph.push({
        "@id": artifact.uri,
        "@type": "File",
        name: artifact.artifactId,
        identifier: drsObject.uri,
        encodingFormat: artifact.kind,
        dateCreated: artifact.createdAt,
        checksum: artifact.checksum,
      });
    }

    return {
      schemaVersion: "1.0.0",
      bundleId,
      caseId: snapshot.caseRecord.caseId,
      generatedAt,
      generatedBy,
      roCrateMetadata: {
        "@context": "https://w3id.org/ro/crate/1.1/context",
        "@graph": roCrateGraph,
      },
      workflowRunCrates,
      drsObjects,
      prov: {
        "@context": "https://www.w3.org/ns/prov#",
        entity: caseEntityId,
        activity: exportActivityId,
        agent: exportAgentId,
        wasDerivedFrom: snapshot.events.map(
          (event) =>
            `urn:homegenome:event:${snapshot.caseRecord.caseId}:${event.version}`,
        ),
        generatedAt,
      },
      snapshot,
    };
  }

  private async appendCaseEvent(
    caseId: string,
    type: string,
    occurredAt: string | undefined,
    correlationId: string | undefined,
    detail: Record<string, unknown>,
  ): Promise<void> {
    const version = await this.deps.eventStore.getLatestVersion(caseId);

    await this.deps.eventStore.append(caseId, version, [
      {
        aggregateId: caseId,
        type,
        occurredAt: normalizeTimestamp(occurredAt),
        correlationId,
        detail,
      },
    ]);
  }

  private async requireCase(caseId: string): Promise<HomeGenomeCaseRecord> {
    const caseRecord = await this.deps.sampleRegistry.getCase(caseId);

    if (!caseRecord) {
      throw new Error(`Unknown case: ${caseId}`);
    }

    return caseRecord;
  }

  private async requireRun(runId: string): Promise<SequencingRunRecord> {
    const run = await this.deps.sequencingRunCatalog.getRun(runId);

    if (!run) {
      throw new Error(`Unknown sequencing run: ${runId}`);
    }

    return run;
  }

  private async requireDispatch(
    dispatchId: string,
  ): Promise<WorkflowDispatchRecord> {
    const dispatch = await this.deps.workflowDispatchSink.getDispatch(dispatchId);

    if (!dispatch) {
      throw new Error(`Unknown workflow dispatch: ${dispatchId}`);
    }

    return dispatch;
  }

  private toDrsObject(artifact: ArtifactManifestRecord): CaseBundleDrsObject {
    const objectId = artifact.checksum
      ? this.normalizeDrsObjectIdFromChecksum(artifact.checksum)
      : `artifact:${artifact.artifactId}`;

    return {
      objectId,
      uri: `drs://homegenome/${encodeURIComponent(objectId)}`,
      sourceUri: artifact.uri,
      checksum: artifact.checksum,
      mediaType: artifact.kind,
    };
  }

  private normalizeDrsObjectIdFromChecksum(checksum: string): string {
    const normalized = checksum.trim();

    if (!normalized) {
      return "artifact:unknown";
    }

    return /^sha256:/i.test(normalized)
      ? `sha256:${normalized.replace(/^sha256:/i, "")}`
      : normalized;
  }
}