import {
  HomeGenomeQcDecision,
  HomeGenomeQcMetrics,
  HomeGenomeQcThresholds,
} from "../domain/homeGenome";

export interface EvaluateHomeGenomeQcInput {
  caseId: string;
  evaluatedAt: string;
  metrics: HomeGenomeQcMetrics;
  thresholds?: Partial<HomeGenomeQcThresholds>;
}

export interface IQcGateEvaluator {
  evaluate(input: EvaluateHomeGenomeQcInput): Promise<HomeGenomeQcDecision>;
}