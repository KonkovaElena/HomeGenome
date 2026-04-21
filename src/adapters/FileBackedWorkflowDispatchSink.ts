import { WorkflowDispatchRecord } from "../domain/homeGenome";
import { IWorkflowDispatchSink } from "../ports/IWorkflowDispatchSink";
import {
  defaultStatePath,
  readJsonStore,
  withFileLock,
  writeJsonStoreAtomic,
} from "./fileStoreSupport";

type WorkflowDispatchState = Record<string, WorkflowDispatchRecord>;

export class FileBackedWorkflowDispatchSink implements IWorkflowDispatchSink {
  private writeChain = Promise.resolve();

  constructor(
    private readonly filePath: string = defaultStatePath(
      "workflow-dispatches.json",
    ),
  ) {}

  async recordWorkflowRequested(dispatch: WorkflowDispatchRecord): Promise<void> {
    const nextWrite = this.writeChain.then(() =>
      withFileLock(this.filePath, async () => {
        const state = await this.readState();
        const existing = state[dispatch.dispatchId];

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

        state[dispatch.dispatchId] = { ...dispatch };
        await writeJsonStoreAtomic(this.filePath, state);
      }),
    );

    this.writeChain = nextWrite.then(() => undefined, () => undefined);
    await nextWrite;
  }

  async getDispatch(
    dispatchId: string,
  ): Promise<WorkflowDispatchRecord | undefined> {
    const state = await this.readState();
    const dispatch = state[dispatchId];
    return dispatch ? { ...dispatch } : undefined;
  }

  async listDispatches(
    caseId: string,
  ): Promise<ReadonlyArray<WorkflowDispatchRecord>> {
    const state = await this.readState();
    return Object.values(state)
      .filter((dispatch) => dispatch.caseId === caseId)
      .map((dispatch) => ({ ...dispatch }));
  }

  private async readState(): Promise<WorkflowDispatchState> {
    return readJsonStore<WorkflowDispatchState>(this.filePath, {});
  }
}