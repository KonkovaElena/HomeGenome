import {
  AnalysisWorkflowFailureCategory,
  AnalysisWorkflowRunRecord,
} from "../domain/homeGenome";
import { INextflowClient } from "../ports/INextflowClient";
import {
  AnalysisWorkflowRunRequest,
  IAnalysisWorkflowRunner,
} from "../ports/IAnalysisWorkflowRunner";

interface TrackedRun {
  record: AnalysisWorkflowRunRecord;
  sessionId: string;
}

export class NextflowWorkflowRunner implements IAnalysisWorkflowRunner {
  private readonly runs = new Map<string, TrackedRun>();

  constructor(
    private readonly client: INextflowClient,
    private readonly launchDir: string = "/nf/launch",
    private readonly workDir: string = "/nf/work",
  ) {}

  async startRun(
    request: AnalysisWorkflowRunRequest,
  ): Promise<AnalysisWorkflowRunRecord> {
    const existing = this.runs.get(request.runId);

    if (existing) {
      if (
        existing.record.caseId !== request.caseId ||
        existing.record.requestId !== request.requestId ||
        existing.record.workflowName !== request.workflowName
      ) {
        throw new Error(`Workflow run replay mismatch: ${request.runId}`);
      }

      if (
        existing.record.status === "RUNNING" ||
        existing.record.status === "PENDING"
      ) {
        return structuredClone(existing.record);
      }

      throw new Error(`Terminal workflow runs cannot be restarted: ${request.runId}`);
    }

    const now = new Date().toISOString();
    const result = await this.client.submit({
      workflowName: request.workflowName,
      revision: request.referenceBundleId,
      configProfile: request.executionProfile,
      launchDir: this.launchDir,
      workDir: this.workDir,
      params: {
        caseId: request.caseId,
        requestId: request.requestId,
      },
    });

    const record: AnalysisWorkflowRunRecord = {
      runId: request.runId,
      caseId: request.caseId,
      requestId: request.requestId,
      workflowName: request.workflowName,
      referenceBundleId: request.referenceBundleId,
      executionProfile: request.executionProfile,
      status: "RUNNING",
      acceptedAt: now,
      startedAt: now,
      terminalMetadata: {
        backend: "NEXTFLOW",
        nextflowSessionId: result.sessionId,
        nextflowRunName: result.runName,
        launchDir: this.launchDir,
        workDir: this.workDir,
      },
    };

    this.runs.set(request.runId, {
      record,
      sessionId: result.sessionId,
    });

    return structuredClone(record);
  }

  async getRun(runId: string): Promise<AnalysisWorkflowRunRecord> {
    const tracked = this.runs.get(runId);

    if (!tracked) {
      throw new Error(`Workflow run was not found: ${runId}`);
    }

    return structuredClone(tracked.record);
  }

  async cancelRun(runId: string): Promise<AnalysisWorkflowRunRecord> {
    const tracked = this.runs.get(runId);

    if (!tracked) {
      throw new Error(`Workflow run was not found: ${runId}`);
    }

    if (tracked.record.status === "CANCELLED") {
      return structuredClone(tracked.record);
    }

    if (
      tracked.record.status !== "RUNNING" &&
      tracked.record.status !== "PENDING"
    ) {
      throw new Error(`Only running or pending workflow runs can be cancelled: ${runId}`);
    }

    await this.client.cancel(tracked.sessionId);

    tracked.record = {
      ...tracked.record,
      status: "CANCELLED",
      completedAt: new Date().toISOString(),
    };

    return structuredClone(tracked.record);
  }

  async listRunsByCaseId(
    caseId: string,
  ): Promise<ReadonlyArray<AnalysisWorkflowRunRecord>> {
    return [...this.runs.values()]
      .filter((run) => run.record.caseId === caseId)
      .map((run) => structuredClone(run.record));
  }

  async completeRun(runId: string): Promise<AnalysisWorkflowRunRecord> {
    const tracked = this.runs.get(runId);

    if (!tracked) {
      throw new Error(`Workflow run was not found: ${runId}`);
    }

    if (tracked.record.status === "COMPLETED") {
      return structuredClone(tracked.record);
    }

    if (tracked.record.status !== "RUNNING") {
      throw new Error(`Only running workflow runs can be completed: ${runId}`);
    }

    tracked.record = {
      ...tracked.record,
      status: "COMPLETED",
      completedAt: new Date().toISOString(),
    };

    return structuredClone(tracked.record);
  }

  async failRun(
    runId: string,
    reason: string,
    failureCategory: AnalysisWorkflowFailureCategory = "unknown",
  ): Promise<AnalysisWorkflowRunRecord> {
    const tracked = this.runs.get(runId);

    if (!tracked) {
      throw new Error(`Workflow run was not found: ${runId}`);
    }

    if (tracked.record.status === "FAILED") {
      return structuredClone(tracked.record);
    }

    if (
      tracked.record.status !== "RUNNING" &&
      tracked.record.status !== "PENDING"
    ) {
      throw new Error(`Only active workflow runs can be failed: ${runId}`);
    }

    tracked.record = {
      ...tracked.record,
      status: "FAILED",
      failureReason: reason,
      failureCategory,
      completedAt: new Date().toISOString(),
    };

    return structuredClone(tracked.record);
  }
}