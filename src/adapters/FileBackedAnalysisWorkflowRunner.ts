import {
  AnalysisWorkflowFailureCategory,
  AnalysisWorkflowRunRecord,
} from "../domain/homeGenome";
import {
  AnalysisWorkflowRunRequest,
  IAnalysisWorkflowRunner,
} from "../ports/IAnalysisWorkflowRunner";
import {
  defaultStatePath,
  readJsonStore,
  withFileLock,
  writeJsonStoreAtomic,
} from "./fileStoreSupport";

type AnalysisWorkflowRunState = Record<string, AnalysisWorkflowRunRecord>;

export class FileBackedAnalysisWorkflowRunner
  implements IAnalysisWorkflowRunner
{
  private writeChain = Promise.resolve();

  constructor(
    private readonly filePath: string = defaultStatePath("workflow-runs.json"),
  ) {}

  async startRun(
    request: AnalysisWorkflowRunRequest,
  ): Promise<AnalysisWorkflowRunRecord> {
    const nextWrite = this.writeChain.then(() =>
      withFileLock(this.filePath, async () => {
        const state = await this.readState();
        const existingRun = state[request.runId];

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
            return { ...existingRun };
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
            backend: "FILE_BACKED",
          },
        };

        state[run.runId] = run;
        await writeJsonStoreAtomic(this.filePath, state);
        return { ...run };
      }),
    );

    this.writeChain = nextWrite.then(() => undefined, () => undefined);
    return nextWrite;
  }

  async getRun(runId: string): Promise<AnalysisWorkflowRunRecord> {
    const state = await this.readState();
    const run = state[runId];

    if (!run) {
      throw new Error(`Workflow run was not found: ${runId}`);
    }

    return { ...run };
  }

  async cancelRun(runId: string): Promise<AnalysisWorkflowRunRecord> {
    return this.mutateRun(runId, (run) => {
      if (run.status === "CANCELLED") {
        return { ...run };
      }

      if (run.status !== "RUNNING" && run.status !== "PENDING") {
        throw new Error(
          `Only running or pending workflow runs can be cancelled: ${runId}`,
        );
      }

      return {
        ...run,
        status: "CANCELLED",
        completedAt: new Date().toISOString(),
      };
    });
  }

  async listRunsByCaseId(
    caseId: string,
  ): Promise<ReadonlyArray<AnalysisWorkflowRunRecord>> {
    const state = await this.readState();
    return Object.values(state)
      .filter((run) => run.caseId === caseId)
      .map((run) => ({ ...run }));
  }

  async completeRun(runId: string): Promise<AnalysisWorkflowRunRecord> {
    return this.mutateRun(runId, (run) => {
      if (run.status === "COMPLETED") {
        return { ...run };
      }

      if (run.status !== "RUNNING") {
        throw new Error(`Only running workflow runs can be completed: ${runId}`);
      }

      return {
        ...run,
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
      };
    });
  }

  async failRun(
    runId: string,
    reason: string,
    failureCategory: AnalysisWorkflowFailureCategory = "unknown",
  ): Promise<AnalysisWorkflowRunRecord> {
    return this.mutateRun(runId, (run) => {
      if (run.status === "FAILED") {
        return { ...run };
      }

      if (run.status !== "RUNNING" && run.status !== "PENDING") {
        throw new Error(`Only active workflow runs can be failed: ${runId}`);
      }

      return {
        ...run,
        status: "FAILED",
        failureReason: reason,
        failureCategory,
        completedAt: new Date().toISOString(),
      };
    });
  }

  private async mutateRun(
    runId: string,
    mutate: (run: AnalysisWorkflowRunRecord) => AnalysisWorkflowRunRecord,
  ): Promise<AnalysisWorkflowRunRecord> {
    const nextWrite = this.writeChain.then(() =>
      withFileLock(this.filePath, async () => {
        const state = await this.readState();
        const current = state[runId];

        if (!current) {
          throw new Error(`Workflow run was not found: ${runId}`);
        }

        const next = mutate(current);
        state[runId] = next;
        await writeJsonStoreAtomic(this.filePath, state);
        return { ...next };
      }),
    );

    this.writeChain = nextWrite.then(() => undefined, () => undefined);
    return nextWrite;
  }

  private async readState(): Promise<AnalysisWorkflowRunState> {
    return readJsonStore<AnalysisWorkflowRunState>(this.filePath, {});
  }
}