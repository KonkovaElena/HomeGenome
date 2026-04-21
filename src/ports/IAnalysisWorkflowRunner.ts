import {
  AnalysisWorkflowFailureCategory,
  AnalysisWorkflowRunRecord,
} from "../domain/homeGenome";

export interface AnalysisWorkflowRunRequest {
  runId: string;
  caseId: string;
  requestId: string;
  workflowName: string;
  referenceBundleId: string;
  executionProfile: string;
}

export interface IAnalysisWorkflowRunner {
  startRun(
    request: AnalysisWorkflowRunRequest,
  ): Promise<AnalysisWorkflowRunRecord>;

  getRun(runId: string): Promise<AnalysisWorkflowRunRecord>;

  cancelRun(runId: string): Promise<AnalysisWorkflowRunRecord>;

  listRunsByCaseId(caseId: string): Promise<ReadonlyArray<AnalysisWorkflowRunRecord>>;

  completeRun(runId: string): Promise<AnalysisWorkflowRunRecord>;

  failRun(
    runId: string,
    reason: string,
    failureCategory?: AnalysisWorkflowFailureCategory,
  ): Promise<AnalysisWorkflowRunRecord>;
}