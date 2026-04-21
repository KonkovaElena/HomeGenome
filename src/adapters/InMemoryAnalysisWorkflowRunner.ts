import {
  AnalysisWorkflowFailureCategory,
  AnalysisWorkflowRunRecord,
} from "../domain/homeGenome";
import {
  AnalysisWorkflowRunRequest,
  IAnalysisWorkflowRunner,
} from "../ports/IAnalysisWorkflowRunner";

export class InMemoryAnalysisWorkflowRunner
  implements IAnalysisWorkflowRunner
{
  private readonly runs = new Map<string, AnalysisWorkflowRunRecord>();

  async startRun(
    request: AnalysisWorkflowRunRequest,
  ): Promise<AnalysisWorkflowRunRecord> {
    const existingRun = this.runs.get(request.runId);

    if (existingRun) {
      if (
        existingRun.caseId !== request.caseId ||
        existingRun.requestId !== request.requestId ||
        existingRun.workflowName !== request.workflowName ||
        existingRun.referenceBundleId !== request.referenceBundleId ||
        existingRun.executionProfile !== request.executionProfile
      ) {
        throw new Error(
          `Workflow run replay does not match existing run: ${request.runId}`,
        );
      }

      if (
        existingRun.status === "RUNNING" ||
        existingRun.status === "PENDING"
      ) {
        return structuredClone(existingRun);
      }

      throw new Error(
        `Terminal workflow run cannot be restarted: ${request.runId}`,
      );
    }

    const now = new Date().toISOString();
    const run: AnalysisWorkflowRunRecord = {
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
        backend: "IN_MEMORY",
      },
    };

    this.runs.set(run.runId, run);
    return structuredClone(run);
  }

  async getRun(runId: string): Promise<AnalysisWorkflowRunRecord> {
    const run = this.runs.get(runId);

    if (!run) {
      throw new Error(`Workflow run was not found: ${runId}`);
    }

    return structuredClone(run);
  }

  async cancelRun(runId: string): Promise<AnalysisWorkflowRunRecord> {
    const run = await this.getRun(runId);

    if (run.status === "CANCELLED") {
      return structuredClone(run);
    }

    if (run.status !== "RUNNING" && run.status !== "PENDING") {
      throw new Error(
        `Only running or pending workflow runs can be cancelled: ${runId}`,
      );
    }

    const cancelledRun: AnalysisWorkflowRunRecord = {
      ...run,
      status: "CANCELLED",
      completedAt: new Date().toISOString(),
    };

    this.runs.set(runId, cancelledRun);
    return structuredClone(cancelledRun);
  }

  async listRunsByCaseId(
    caseId: string,
  ): Promise<ReadonlyArray<AnalysisWorkflowRunRecord>> {
    return [...this.runs.values()]
      .filter((run) => run.caseId === caseId)
      .map((run) => structuredClone(run));
  }

  async completeRun(runId: string): Promise<AnalysisWorkflowRunRecord> {
    const run = await this.getRun(runId);

    if (run.status === "COMPLETED") {
      return structuredClone(run);
    }

    if (run.status !== "RUNNING") {
      throw new Error(`Only running workflow runs can be completed: ${runId}`);
    }

    const completedRun: AnalysisWorkflowRunRecord = {
      ...run,
      status: "COMPLETED",
      completedAt: new Date().toISOString(),
    };

    this.runs.set(runId, completedRun);
    return structuredClone(completedRun);
  }

  async failRun(
    runId: string,
    reason: string,
    failureCategory: AnalysisWorkflowFailureCategory = "unknown",
  ): Promise<AnalysisWorkflowRunRecord> {
    const run = await this.getRun(runId);

    if (run.status === "FAILED") {
      return structuredClone(run);
    }

    if (run.status !== "RUNNING" && run.status !== "PENDING") {
      throw new Error(`Only active workflow runs can be failed: ${runId}`);
    }

    const failedRun: AnalysisWorkflowRunRecord = {
      ...run,
      status: "FAILED",
      failureReason: reason,
      failureCategory,
      completedAt: new Date().toISOString(),
    };

    this.runs.set(runId, failedRun);
    return structuredClone(failedRun);
  }
}