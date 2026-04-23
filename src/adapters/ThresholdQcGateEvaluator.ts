import {
  DEFAULT_HOME_GENOME_QC_THRESHOLDS,
  HomeGenomeQcDecision,
  HomeGenomeQcMetrics,
  HomeGenomeQcThresholds,
  normalizeTimestamp,
} from "../domain/homeGenome";
import {
  EvaluateHomeGenomeQcInput,
  IQcGateEvaluator,
} from "../ports/IQcGateEvaluator";

export class ThresholdQcGateEvaluator implements IQcGateEvaluator {
  async evaluate(
    input: EvaluateHomeGenomeQcInput,
  ): Promise<HomeGenomeQcDecision> {
    const thresholds = this.mergeThresholds(input.thresholds);
    const failReasons: string[] = [];
    const manualReviewReasons: string[] = [];

    if (input.metrics.estimatedCoverage === undefined) {
      manualReviewReasons.push("Estimated coverage is missing");
    } else if (input.metrics.estimatedCoverage < thresholds.minimumCoverage) {
      failReasons.push(
        `Estimated coverage ${input.metrics.estimatedCoverage}x is below the minimum ${thresholds.minimumCoverage}x`,
      );
    }

    if (input.metrics.mappedReadPercent === undefined) {
      manualReviewReasons.push("Mapped read percent is missing");
    } else if (
      input.metrics.mappedReadPercent < thresholds.minimumMappedReadPercent
    ) {
      failReasons.push(
        `Mapped read percent ${input.metrics.mappedReadPercent}% is below the minimum ${thresholds.minimumMappedReadPercent}%`,
      );
    }

    if (
      thresholds.maximumContaminationRate !== undefined &&
      input.metrics.contaminationRate !== undefined &&
      input.metrics.contaminationRate > thresholds.maximumContaminationRate
    ) {
      failReasons.push(
        `Contamination rate ${input.metrics.contaminationRate} exceeds the maximum ${thresholds.maximumContaminationRate}`,
      );
    }

    const artifactKinds = new Set(input.metrics.artifactKinds ?? []);
    const missingArtifacts = thresholds.requiredArtifactKinds.filter(
      (kind) => !artifactKinds.has(kind),
    );

    if (missingArtifacts.length > 0) {
      failReasons.push(
        `Missing required artifacts: ${missingArtifacts.join(", ")}`,
      );
    }

    if (input.metrics.requiresManualReview) {
      manualReviewReasons.push("Metrics were flagged for manual review");
    }

    let outcome: HomeGenomeQcDecision["outcome"] = "PASS";
    if (failReasons.length > 0) {
      outcome = "FAIL";
    } else if (manualReviewReasons.length > 0) {
      outcome = "MANUAL_REVIEW";
    }

    return {
      outcome,
      evaluatedAt: normalizeTimestamp(input.evaluatedAt),
      metrics: this.cloneMetrics(input.metrics),
      thresholds: {
        ...thresholds,
        requiredArtifactKinds: [...thresholds.requiredArtifactKinds],
      },
      reasons: [...failReasons, ...manualReviewReasons],
    };
  }

  private mergeThresholds(
    overrides?: Partial<HomeGenomeQcThresholds>,
  ): HomeGenomeQcThresholds {
    return {
      ...DEFAULT_HOME_GENOME_QC_THRESHOLDS,
      ...overrides,
      requiredArtifactKinds:
        overrides?.requiredArtifactKinds ??
        DEFAULT_HOME_GENOME_QC_THRESHOLDS.requiredArtifactKinds,
    };
  }

  private cloneMetrics(metrics: HomeGenomeQcMetrics): HomeGenomeQcMetrics {
    return {
      ...metrics,
      artifactKinds: metrics.artifactKinds ? [...metrics.artifactKinds] : undefined,
    };
  }
}