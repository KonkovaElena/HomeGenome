import {
  HlaTypingConsensusCall,
  HlaTypingConsensusDecision,
  HlaTypingConsensusThresholds,
} from "../domain/homeGenome";

export interface EvaluateHlaTypingConsensusInput {
  caseId: string;
  evaluatedAt: string;
  calls: ReadonlyArray<HlaTypingConsensusCall>;
  thresholds?: Partial<HlaTypingConsensusThresholds>;
}

export interface IHlaTypingConsensusProvider {
  evaluate(
    input: EvaluateHlaTypingConsensusInput,
  ): Promise<HlaTypingConsensusDecision>;
}