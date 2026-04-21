import { WorkflowDispatchRecord } from "../domain/homeGenome";

export interface IWorkflowDispatchSink {
  recordWorkflowRequested(dispatch: WorkflowDispatchRecord): Promise<void>;

  getDispatch(
    dispatchId: string,
  ): Promise<WorkflowDispatchRecord | undefined>;

  listDispatches(
    caseId: string,
  ): Promise<ReadonlyArray<WorkflowDispatchRecord>>;
}