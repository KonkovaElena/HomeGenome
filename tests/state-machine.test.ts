import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryStateMachineGuard } from "../src/adapters/InMemoryStateMachineGuard";

test("state machine allows canonical HomeGenome transitions", () => {
  const guard = new InMemoryStateMachineGuard();
  const allowedTransitions = [
    ["INTAKE_PENDING", "BIOSAMPLE_REGISTERED"],
    ["BIOSAMPLE_REGISTERED", "SEQUENCING_REQUESTED"],
    ["SEQUENCING_REQUESTED", "SEQUENCING_RUNNING"],
    ["SEQUENCING_RUNNING", "RAW_ARTIFACTS_CAPTURED"],
    ["RAW_ARTIFACTS_CAPTURED", "QC_PENDING"],
    ["QC_PENDING", "QC_PASSED"],
    ["QC_FAILED", "REANALYSIS_REQUESTED"],
    ["QC_PASSED", "PRIMARY_ANALYSIS_RUNNING"],
    ["PRIMARY_ANALYSIS_RUNNING", "CONSENSUS_REVIEW_REQUIRED"],
    ["PRIMARY_ANALYSIS_RUNNING", "INTERPRETATION_RUNNING"],
    ["CONSENSUS_REVIEW_REQUIRED", "INTERPRETATION_RUNNING"],
    ["INTERPRETATION_RUNNING", "ANALYST_REVIEW_PENDING"],
    ["ANALYST_REVIEW_PENDING", "RELEASE_PENDING"],
    ["RELEASE_PENDING", "RELEASED"],
    ["RELEASED", "REANALYSIS_REQUESTED"],
    ["REANALYSIS_REQUESTED", "PRIMARY_ANALYSIS_RUNNING"],
  ] as const;

  for (const [currentStatus, nextStatus] of allowedTransitions) {
    assert.equal(
      guard.canTransition(currentStatus, nextStatus),
      true,
      `${currentStatus} -> ${nextStatus} should be allowed`,
    );
  }
});

test("state machine rejects invalid HomeGenome transitions", () => {
  const guard = new InMemoryStateMachineGuard();

  assert.equal(guard.canTransition("INTAKE_PENDING", "RELEASED"), false);
  assert.throws(
    () => guard.assertTransition("INTAKE_PENDING", "RELEASED"),
    /Invalid HomeGenome case transition/,
  );
  assert.deepEqual(guard.listAllowedTransitions("ARCHIVED"), []);
});