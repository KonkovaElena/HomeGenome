import { WorkflowDispatchRecord } from "../domain/homeGenome";
import { IWorkflowDispatchSink } from "../ports/IWorkflowDispatchSink";

export class InMemoryWorkflowDispatchSink implements IWorkflowDispatchSink {
  private readonly dispatches = new Map<string, WorkflowDispatchRecord>();

  async recordWorkflowRequested(dispatch: WorkflowDispatchRecord): Promise<void> {
    const existing = this.dispatches.get(dispatch.dispatchId);

    if (existing) {
      if (
        existing.caseId !== dispatch.caseId ||
        existing.requestId !== dispatch.requestId ||
        existing.workflowName !== dispatch.workflowName ||
        existing.referenceBundleId !== dispatch.referenceBundleId ||
        existing.executionProfile !== dispatch.executionProfile
      ) {
        throw new Error(
          `Workflow dispatch replay does not match existing dispatch: ${dispatch.dispatchId}`,
        );
      }

      return;
    }

    this.dispatches.set(dispatch.dispatchId, { ...dispatch });
  }

  async getDispatch(
    dispatchId: string,
  ): Promise<WorkflowDispatchRecord | undefined> {
    const dispatch = this.dispatches.get(dispatchId);
    return dispatch ? { ...dispatch } : undefined;
  }

  async listDispatches(
    caseId: string,
  ): Promise<ReadonlyArray<WorkflowDispatchRecord>> {
    return [...this.dispatches.values()]
      .filter((dispatch) => dispatch.caseId === caseId)
      .map((dispatch) => ({ ...dispatch }));
  }
}