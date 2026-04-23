import {
  VariantConsensusCall,
  VariantConsensusDecision,
  VariantConsensusThresholds,
} from "../domain/homeGenome";

export interface EvaluateVariantConsensusInput {
  caseId: string;
  evaluatedAt: string;
  calls: ReadonlyArray<VariantConsensusCall>;
  thresholds?: Partial<VariantConsensusThresholds>;
}

export interface IVariantConsensusProvider {
  evaluate(
    input: EvaluateVariantConsensusInput,
  ): Promise<VariantConsensusDecision>;
}