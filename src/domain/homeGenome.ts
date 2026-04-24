export const HOME_GENOME_CASE_STATUSES = [
  "INTAKE_PENDING",
  "BIOSAMPLE_REGISTERED",
  "SEQUENCING_REQUESTED",
  "SEQUENCING_RUNNING",
  "RAW_ARTIFACTS_CAPTURED",
  "QC_PENDING",
  "QC_FAILED",
  "QC_PASSED",
  "PRIMARY_ANALYSIS_RUNNING",
  "CONSENSUS_REVIEW_REQUIRED",
  "INTERPRETATION_RUNNING",
  "ANALYST_REVIEW_PENDING",
  "RELEASE_PENDING",
  "RELEASED",
  "REANALYSIS_REQUESTED",
  "ARCHIVED",
] as const;

export type HomeGenomeCaseStatus =
  (typeof HOME_GENOME_CASE_STATUSES)[number];

export const SEQUENCING_RUN_STATUSES = [
  "REQUESTED",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;

export type SequencingRunStatus = (typeof SEQUENCING_RUN_STATUSES)[number];

export const ARTIFACT_KINDS = [
  "RAW_SIGNAL",
  "BASECALLS",
  "ALIGNMENT",
  "VARIANTS",
  "QC_REPORT",
  "INTERPRETATION_REPORT",
  "OTHER",
] as const;

export type ArtifactKind = (typeof ARTIFACT_KINDS)[number];

export const SEQUENCING_PLATFORMS = [
  "ONT_MINION",
  "ILLUMINA",
  "PACBIO",
  "OTHER",
] as const;

export type SequencingPlatform = (typeof SEQUENCING_PLATFORMS)[number];

export const ADAPTIVE_SAMPLING_STATES = [
  "ACTIVE",
  "PAUSED",
  "DISABLED",
] as const;

export type AdaptiveSamplingState =
  (typeof ADAPTIVE_SAMPLING_STATES)[number];

export const ADAPTIVE_SAMPLING_TARGET_FORMATS = ["BED", "FASTA"] as const;

export type AdaptiveSamplingTargetFormat =
  (typeof ADAPTIVE_SAMPLING_TARGET_FORMATS)[number];

export interface SequencingRunTelemetrySnapshot {
  observedAt: string;
  readCount?: number;
  activePores?: number;
  n50?: number;
  estimatedCoverage?: number;
}

export interface AdaptiveSamplingTargetRecord {
  label: string;
  targetDefinitionUri: string;
  format: AdaptiveSamplingTargetFormat;
  appliedAt: string;
  checksum?: string;
}

export interface AdaptiveSamplingSessionRecord {
  sessionId: string;
  state: AdaptiveSamplingState;
  appliedAt: string;
  requestedBy?: string;
  target: AdaptiveSamplingTargetRecord;
}

export interface HomeGenomeCaseRecord {
  caseId: string;
  subjectId: string;
  status: HomeGenomeCaseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHomeGenomeCaseInput {
  caseId: string;
  subjectId: string;
  createdAt?: string;
}

export interface BiosampleRecord {
  sampleId: string;
  caseId: string;
  sampleType: string;
  collectedAt: string;
  createdAt: string;
  notes?: string;
  metadata?: Record<string, string>;
}

export interface RegisterBiosampleInput {
  sampleId: string;
  caseId: string;
  sampleType: string;
  collectedAt: string;
  createdAt?: string;
  notes?: string;
  metadata?: Record<string, string>;
}

export interface SequencingRunRecord {
  runId: string;
  caseId: string;
  sampleId: string;
  platform: SequencingPlatform;
  referenceBundleId?: string;
  status: SequencingRunStatus;
  createdAt: string;
  updatedAt: string;
  telemetry?: SequencingRunTelemetrySnapshot;
  adaptiveSamplingSession?: AdaptiveSamplingSessionRecord;
}

export interface RegisterSequencingRunInput {
  runId: string;
  caseId: string;
  sampleId: string;
  platform: SequencingPlatform;
  referenceBundleId?: string;
  createdAt?: string;
  status?: SequencingRunStatus;
}

export interface ArtifactManifestRecord {
  artifactId: string;
  caseId: string;
  runId?: string;
  sampleId?: string;
  kind: ArtifactKind;
  uri: string;
  checksum: string;
  createdAt: string;
}

export interface RegisterArtifactInput {
  artifactId: string;
  caseId: string;
  runId?: string;
  sampleId?: string;
  kind: ArtifactKind;
  uri: string;
  checksum: string;
  createdAt?: string;
}

export interface HomeGenomeQcMetrics {
  estimatedCoverage?: number;
  mappedReadPercent?: number;
  contaminationRate?: number;
  artifactKinds?: ReadonlyArray<ArtifactKind>;
  requiresManualReview?: boolean;
}

export interface HomeGenomeQcThresholds {
  minimumCoverage: number;
  minimumMappedReadPercent: number;
  maximumContaminationRate?: number;
  requiredArtifactKinds: ReadonlyArray<ArtifactKind>;
}

export interface HomeGenomeQcDecision {
  outcome: "PASS" | "FAIL" | "MANUAL_REVIEW";
  evaluatedAt: string;
  metrics: HomeGenomeQcMetrics;
  thresholds: HomeGenomeQcThresholds;
  reasons: ReadonlyArray<string>;
}

export const DEFAULT_HOME_GENOME_QC_THRESHOLDS: HomeGenomeQcThresholds = {
  minimumCoverage: 10,
  minimumMappedReadPercent: 95,
  maximumContaminationRate: 0.05,
  requiredArtifactKinds: ["RAW_SIGNAL"],
};

export interface VariantConsensusCall {
  caller: string;
  locus: string;
  allele: string;
  confidence?: number;
}

export interface HlaTypingConsensusCall {
  caller: string;
  gene: string;
  alleles: ReadonlyArray<string>;
  confidence?: number;
}

export interface VariantConsensusThresholds {
  minimumSupportingCallers: number;
  minimumConcordanceRatio: number;
}

export interface HlaTypingConsensusThresholds {
  minimumSupportingCallers: number;
  minimumConcordanceRatio: number;
}

export interface VariantConsensusDecision {
  outcome: "CONSENSUS" | "MANUAL_REVIEW_REQUIRED";
  evaluatedAt: string;
  concordanceRatio: number;
  minimumSupportingCallers: number;
  minimumConcordanceRatio: number;
  supportingCallers: ReadonlyArray<string>;
  consensusKeys: ReadonlyArray<string>;
  disagreementKeys: ReadonlyArray<string>;
  notes: ReadonlyArray<string>;
}

export interface HlaTypingConsensusDecision {
  outcome: "CONSENSUS" | "MANUAL_REVIEW_REQUIRED";
  evaluatedAt: string;
  concordanceRatio: number;
  minimumSupportingCallers: number;
  minimumConcordanceRatio: number;
  supportingCallers: ReadonlyArray<string>;
  consensusKeys: ReadonlyArray<string>;
  disagreementKeys: ReadonlyArray<string>;
  notes: ReadonlyArray<string>;
}

export const DEFAULT_VARIANT_CONSENSUS_THRESHOLDS: VariantConsensusThresholds = {
  minimumSupportingCallers: 2,
  minimumConcordanceRatio: 0.66,
};

export const DEFAULT_HLA_TYPING_CONSENSUS_THRESHOLDS: HlaTypingConsensusThresholds = {
  minimumSupportingCallers: 2,
  minimumConcordanceRatio: 0.66,
};

export interface ReferenceBundleRecord {
  bundleId: string;
  name: string;
  version: string;
  description?: string;
  createdAt: string;
  assets: ReadonlyArray<ReferenceBundleAssetRecord>;
}

export interface ReferenceBundleAssetRecord {
  assetId: string;
  role: string;
  uri: string;
  checksum: string;
}

export interface RegisterReferenceBundleInput {
  bundleId: string;
  name: string;
  version: string;
  description?: string;
  createdAt?: string;
  assets: ReadonlyArray<ReferenceBundleAssetRecord>;
}

export const ANALYSIS_WORKFLOW_RUN_STATUSES = [
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;

export type AnalysisWorkflowRunStatus =
  (typeof ANALYSIS_WORKFLOW_RUN_STATUSES)[number];

export const ANALYSIS_WORKFLOW_FAILURE_CATEGORIES = [
  "unknown",
  "configuration",
  "infrastructure",
  "pipeline_error",
] as const;

export type AnalysisWorkflowFailureCategory =
  (typeof ANALYSIS_WORKFLOW_FAILURE_CATEGORIES)[number];

export interface WorkflowDispatchRecord {
  dispatchId: string;
  caseId: string;
  requestId: string;
  workflowName: string;
  referenceBundleId: string;
  executionProfile: string;
  requestedBy?: string;
  requestedAt: string;
  idempotencyKey?: string;
  correlationId?: string;
  status: "PENDING";
}

export interface RequestAnalysisWorkflowInput {
  dispatchId: string;
  caseId: string;
  requestId: string;
  workflowName: string;
  referenceBundleId: string;
  executionProfile: string;
  requestedBy?: string;
  requestedAt?: string;
  idempotencyKey?: string;
  correlationId?: string;
}

export interface AnalysisWorkflowTerminalMetadata {
  backend: "IN_MEMORY" | "FILE_BACKED" | "NEXTFLOW";
  nextflowSessionId?: string;
  nextflowRunName?: string;
  launchDir?: string;
  workDir?: string;
}

export interface AnalysisWorkflowRunRecord {
  runId: string;
  caseId: string;
  requestId: string;
  workflowName: string;
  referenceBundleId: string;
  executionProfile: string;
  status: AnalysisWorkflowRunStatus;
  acceptedAt: string;
  startedAt?: string;
  completedAt?: string;
  failureReason?: string;
  failureCategory?: AnalysisWorkflowFailureCategory;
  terminalMetadata?: AnalysisWorkflowTerminalMetadata;
}

export const HOME_GENOME_ALLOWED_TRANSITIONS: Readonly<
  Record<HomeGenomeCaseStatus, readonly HomeGenomeCaseStatus[]>
> = {
  INTAKE_PENDING: ["BIOSAMPLE_REGISTERED", "ARCHIVED"],
  BIOSAMPLE_REGISTERED: ["SEQUENCING_REQUESTED", "ARCHIVED"],
  SEQUENCING_REQUESTED: ["SEQUENCING_RUNNING", "RAW_ARTIFACTS_CAPTURED", "ARCHIVED"],
  SEQUENCING_RUNNING: ["RAW_ARTIFACTS_CAPTURED", "QC_FAILED", "ARCHIVED"],
  RAW_ARTIFACTS_CAPTURED: ["QC_PENDING", "ARCHIVED"],
  QC_PENDING: ["QC_PASSED", "QC_FAILED", "ARCHIVED"],
  QC_FAILED: ["SEQUENCING_REQUESTED", "REANALYSIS_REQUESTED", "ARCHIVED"],
  QC_PASSED: ["PRIMARY_ANALYSIS_RUNNING", "ARCHIVED"],
  PRIMARY_ANALYSIS_RUNNING: ["CONSENSUS_REVIEW_REQUIRED", "INTERPRETATION_RUNNING", "ARCHIVED"],
  CONSENSUS_REVIEW_REQUIRED: ["INTERPRETATION_RUNNING", "REANALYSIS_REQUESTED", "ARCHIVED"],
  INTERPRETATION_RUNNING: ["ANALYST_REVIEW_PENDING", "REANALYSIS_REQUESTED", "ARCHIVED"],
  ANALYST_REVIEW_PENDING: ["RELEASE_PENDING", "REANALYSIS_REQUESTED", "ARCHIVED"],
  RELEASE_PENDING: ["RELEASED", "REANALYSIS_REQUESTED", "ARCHIVED"],
  RELEASED: ["REANALYSIS_REQUESTED", "ARCHIVED"],
  REANALYSIS_REQUESTED: ["SEQUENCING_REQUESTED", "PRIMARY_ANALYSIS_RUNNING", "ARCHIVED"],
  ARCHIVED: [],
};

export function normalizeTimestamp(value?: string): string {
  return value?.trim() || new Date().toISOString();
}

export function assertAllowedCaseTransition(
  currentStatus: HomeGenomeCaseStatus,
  nextStatus: HomeGenomeCaseStatus,
): void {
  if (!HOME_GENOME_ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus)) {
    throw new Error(
      `Invalid HomeGenome case transition: ${currentStatus} -> ${nextStatus}`,
    );
  }
}

export function isRawCaptureArtifact(kind: ArtifactKind): boolean {
  return kind === "RAW_SIGNAL" || kind === "BASECALLS" || kind === "ALIGNMENT";
}

const SHA256_CHECKSUM_PATTERN = /^sha256:[a-f0-9]{64}$/i;

export function normalizeSha256Checksum(
  value: string | undefined,
  label = "Artifact checksum",
): string {
  const normalized = value?.trim().toLowerCase();

  if (!normalized || !SHA256_CHECKSUM_PATTERN.test(normalized)) {
    throw new Error(
      `${label} must be a sha256 digest prefixed with 'sha256:'`,
    );
  }

  return normalized;
}

export function normalizeReferenceBundleAssets(
  assets: ReadonlyArray<ReferenceBundleAssetRecord> | undefined,
): ReadonlyArray<ReferenceBundleAssetRecord> {
  if (!assets || assets.length === 0) {
    throw new Error("Reference bundle must include at least one manifest asset");
  }

  return assets.map((asset) => {
    const assetId = asset.assetId?.trim();
    const role = asset.role?.trim();
    const uri = asset.uri?.trim();

    if (!assetId) {
      throw new Error("Reference bundle assetId is required");
    }

    if (!role) {
      throw new Error(`Reference bundle asset role is required: ${assetId}`);
    }

    if (!uri) {
      throw new Error(`Reference bundle asset uri is required: ${assetId}`);
    }

    return {
      assetId,
      role,
      uri,
      checksum: normalizeSha256Checksum(
        asset.checksum,
        "Reference bundle asset checksum",
      ),
    };
  });
}