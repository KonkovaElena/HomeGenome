export interface NextflowSubmitRequest {
  workflowName: string;
  revision: string;
  configProfile: string;
  launchDir: string;
  workDir: string;
  params?: Record<string, string>;
}

export interface NextflowSubmitResult {
  sessionId: string;
  runName: string;
}

export interface INextflowClient {
  submit(request: NextflowSubmitRequest): Promise<NextflowSubmitResult>;
  cancel(sessionId: string): Promise<void>;
}