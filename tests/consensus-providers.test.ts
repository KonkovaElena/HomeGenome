import test from "node:test";
import assert from "node:assert/strict";
import { ThresholdHlaTypingConsensusProvider } from "../src/adapters/ThresholdHlaTypingConsensusProvider";
import { ThresholdVariantConsensusProvider } from "../src/adapters/ThresholdVariantConsensusProvider";

test("threshold variant consensus provider confirms consensus when two callers agree", async () => {
  const provider = new ThresholdVariantConsensusProvider();

  const decision = await provider.evaluate({
    caseId: "case-variant-consensus-001",
    evaluatedAt: "2026-04-23T19:00:00.000Z",
    calls: [
      {
        caller: "clair3",
        locus: "chr1:12345",
        allele: "A>T",
      },
      {
        caller: "deepvariant",
        locus: "chr1:12345",
        allele: "A>T",
      },
    ],
  });

  assert.equal(decision.outcome, "CONSENSUS");
  assert.equal(decision.supportingCallers.length, 2);
  assert.equal(decision.consensusKeys[0], "chr1:12345::A>T");
});

test("threshold hla consensus provider requires manual review when callers disagree", async () => {
  const provider = new ThresholdHlaTypingConsensusProvider();

  const decision = await provider.evaluate({
    caseId: "case-hla-consensus-001",
    evaluatedAt: "2026-04-23T19:05:00.000Z",
    calls: [
      {
        caller: "hla-la",
        gene: "HLA-A",
        alleles: ["A*01:01", "A*02:01"],
      },
      {
        caller: "spec-hla",
        gene: "HLA-A",
        alleles: ["A*03:01", "A*02:01"],
      },
    ],
  });

  assert.equal(decision.outcome, "MANUAL_REVIEW_REQUIRED");
  assert.equal(decision.disagreementKeys.length, 2);
});