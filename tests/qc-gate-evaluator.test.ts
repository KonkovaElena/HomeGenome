import test from "node:test";
import assert from "node:assert/strict";
import { ThresholdQcGateEvaluator } from "../src/adapters/ThresholdQcGateEvaluator";

test("threshold qc gate evaluator passes metrics that meet the default gate", async () => {
  const evaluator = new ThresholdQcGateEvaluator();

  const decision = await evaluator.evaluate({
    caseId: "case-qc-pass-001",
    evaluatedAt: "2026-04-23T18:00:00.000Z",
    metrics: {
      estimatedCoverage: 32,
      mappedReadPercent: 97,
      artifactKinds: ["RAW_SIGNAL", "ALIGNMENT", "VARIANTS"],
    },
  });

  assert.equal(decision.outcome, "PASS");
  assert.deepEqual(decision.reasons, []);
});

test("threshold qc gate evaluator requests manual review when key metrics are missing", async () => {
  const evaluator = new ThresholdQcGateEvaluator();

  const decision = await evaluator.evaluate({
    caseId: "case-qc-manual-001",
    evaluatedAt: "2026-04-23T18:05:00.000Z",
    metrics: {
      artifactKinds: ["RAW_SIGNAL"],
    },
  });

  assert.equal(decision.outcome, "MANUAL_REVIEW");
  assert.match(decision.reasons.join("\n"), /coverage/i);
  assert.match(decision.reasons.join("\n"), /mapped/i);
});