import {
  DEFAULT_HLA_TYPING_CONSENSUS_THRESHOLDS,
  HlaTypingConsensusDecision,
  HlaTypingConsensusThresholds,
  normalizeTimestamp,
} from "../domain/homeGenome";
import {
  EvaluateHlaTypingConsensusInput,
  IHlaTypingConsensusProvider,
} from "../ports/IHlaTypingConsensusProvider";

export class ThresholdHlaTypingConsensusProvider
  implements IHlaTypingConsensusProvider {
  async evaluate(
    input: EvaluateHlaTypingConsensusInput,
  ): Promise<HlaTypingConsensusDecision> {
    const thresholds = this.mergeThresholds(input.thresholds);
    const supportByKey = new Map<string, Set<string>>();
    const allCallers = new Set<string>();

    for (const call of input.calls) {
      allCallers.add(call.caller);
      const key = `${call.gene}::${[...call.alleles].sort().join("|")}`;
      const callers = supportByKey.get(key) ?? new Set<string>();
      callers.add(call.caller);
      supportByKey.set(key, callers);
    }

    return this.toDecision(
      thresholds,
      normalizeTimestamp(input.evaluatedAt),
      supportByKey,
      allCallers,
    );
  }

  private mergeThresholds(
    overrides?: Partial<HlaTypingConsensusThresholds>,
  ): HlaTypingConsensusThresholds {
    return {
      ...DEFAULT_HLA_TYPING_CONSENSUS_THRESHOLDS,
      ...overrides,
    };
  }

  private toDecision(
    thresholds: HlaTypingConsensusThresholds,
    evaluatedAt: string,
    supportByKey: Map<string, Set<string>>,
    allCallers: Set<string>,
  ): HlaTypingConsensusDecision {
    if (supportByKey.size === 0 || allCallers.size === 0) {
      return {
        outcome: "MANUAL_REVIEW_REQUIRED",
        evaluatedAt,
        concordanceRatio: 0,
        minimumSupportingCallers: thresholds.minimumSupportingCallers,
        minimumConcordanceRatio: thresholds.minimumConcordanceRatio,
        supportingCallers: [],
        consensusKeys: [],
        disagreementKeys: [],
        notes: ["No HLA typing consensus calls were supplied"],
      };
    }

    const rankedKeys = [...supportByKey.entries()]
      .map(([key, callers]) => ({ key, callers: [...callers].sort() }))
      .sort((left, right) => right.callers.length - left.callers.length);

    const bestSupport = rankedKeys[0].callers.length;
    const topRankedKeys = rankedKeys
      .filter((entry) => entry.callers.length === bestSupport)
      .map((entry) => entry.key);
    const supportingCallers = rankedKeys[0].callers;
    let consensusKeys = [...topRankedKeys];
    let disagreementKeys = rankedKeys
      .filter((entry) => !topRankedKeys.includes(entry.key))
      .map((entry) => entry.key);
    const concordanceRatio = bestSupport / allCallers.size;
    const notes: string[] = [];

    let outcome: HlaTypingConsensusDecision["outcome"] = "CONSENSUS";

    if (topRankedKeys.length !== 1) {
      outcome = "MANUAL_REVIEW_REQUIRED";
      consensusKeys = [];
      disagreementKeys = rankedKeys.map((entry) => entry.key);
      notes.push("More than one top-ranked HLA typing call remains after scoring");
    }

    if (bestSupport < thresholds.minimumSupportingCallers) {
      outcome = "MANUAL_REVIEW_REQUIRED";
      notes.push("HLA typing support does not meet the minimum caller threshold");
    }

    if (concordanceRatio < thresholds.minimumConcordanceRatio) {
      outcome = "MANUAL_REVIEW_REQUIRED";
      notes.push("HLA typing concordance ratio is below the configured threshold");
    }

    return {
      outcome,
      evaluatedAt,
      concordanceRatio,
      minimumSupportingCallers: thresholds.minimumSupportingCallers,
      minimumConcordanceRatio: thresholds.minimumConcordanceRatio,
      supportingCallers,
      consensusKeys,
      disagreementKeys,
      notes,
    };
  }
}