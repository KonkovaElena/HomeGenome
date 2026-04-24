---
title: "HomeGenome Standards Adoption Matrix"
status: "active"
version: "1.3.0"
last_updated: "2026-04-24"
tags: [homegenome, standards, ga4gh, ro-crate, prov, slsa, security]
mode: "reference"
---

# HomeGenome Standards Adoption Matrix

## Purpose

This matrix maps April 2026 recommendations to actual HomeGenome implementation status.

It separates:

- already implemented control-plane capabilities;
- planned interoperability and security layers;
- non-goals for the current baseline.

## Status Legend

- `implemented` — already present in code/docs baseline
- `in-progress` — partially implemented with explicit next step
- `planned` — accepted direction, not implemented yet
- `out-of-scope-now` — intentionally deferred

## Adoption Matrix

| Domain | Standard / Practice | HomeGenome status | Notes |
| --- | --- | --- | --- |
| Case export packaging | RO-Crate envelope | `implemented` | `exportCaseBundle()` emits `roCrateMetadata` with `@context` and `@graph`. |
| Provenance representation | W3C PROV-compatible summary | `implemented` | `exportCaseBundle()` emits `prov` with entity/activity/agent/wasDerivedFrom. |
| Artifact addressing | DRS-like object references | `implemented` | Artifact list is projected to `drs://homegenome/...` URIs with stable object IDs. |
| Artifact integrity | Mandatory sha256 artifact hashing | `implemented` | Artifact registration now requires normalized `sha256:*` digests before export. |
| Reference input pinning | Hashed reference bundle manifests | `implemented` | `registerReferenceBundle()` now requires `assets[]` with normalized `sha256:*` checksums, and `exportCaseBundle()` emits them in `referenceBundles[]`. |
| Bundle self-verification | Canonical export bundle checksum | `implemented` | `bundleChecksum` is emitted as a SHA-256 digest over canonical JSON for the exported bundle payload. |
| Audit integrity | Tamper-evident append-only event chain | `implemented` | Persisted audit events now carry `eventHash` and `previousEventHash`, and the chain is validated on append and read. |
| Attestation bridge | Export-time audit checkpoint digest | `implemented` | `auditCheckpoint` emits a stable digest anchor over the current audit chain for later external signing or attestation. |
| Workflow run provenance | Workflow-run crate projection | `implemented` | `workflowRunCrates[]` emitted per workflow run in bundle export. |
| Reproducible orchestration | Nextflow runner seam | `implemented` | `IAnalysisWorkflowRunner` + `NextflowWorkflowRunner` already in baseline. |
| Telemetry control | MinKNOW telemetry/adaptive sampling seam | `implemented` | `IMinKnowClient` + control-plane methods are wired and tested. |
| QC gating | Threshold-based QC pass/fail/manual-review gate | `implemented` | `IQcGateEvaluator`, `ThresholdQcGateEvaluator`, and `evaluateCaseQc()` now provide an explicit QC decision path. |
| Quality verification | Built-in Node coverage thresholds + contract drift rail | `implemented` | `test:coverage`, checked-in export bundle snapshot, and `verify:contracts` guard schema/API drift. |
| Variant review consensus | Multi-caller / multi-typer consensus thresholds | `implemented` | `IVariantConsensusProvider`, `IHlaTypingConsensusProvider`, and `reviewCaseConsensus()` now gate the move from analysis completion into interpretation. |
| Data API interoperability | GA4GH DRS API server | `planned` | Current layer is DRS-like contract; full DRS REST surface is not implemented. |
| Workflow API interoperability | GA4GH WES/TES contracts | `planned` | Current layer uses internal runner/sink contracts with similar intent. |
| Tool registry interoperability | GA4GH TRS | `planned` | No TRS endpoint yet; reference bundle registry is local-only. |
| Variant portability | GA4GH VRS exports | `planned` | Current baseline tracks artifacts; no VRS serializer yet. |
| Phenotype portability | Phenopackets export | `in-progress` | `CaseExportBundle.phenopacket` now emits a Phenopackets-oriented v2-shaped projection; full normative parity is still future work. |
| Supply-chain provenance | SLSA + in-toto attestations | `planned` | CI has baseline security checks; no artifact attestation pipeline yet. |
| Artifact signing | Sigstore / cosign | `planned` | Not yet integrated into release flow. |
| SBOM | SPDX / CycloneDX | `planned` | Not yet generated in HomeGenome release workflow. |
| IAM for operator actions | Keycloak | `out-of-scope-now` | Not needed for current single-repo baseline; tracked as future hardening. |
| Secret management | OpenBao | `out-of-scope-now` | Future operational deployment surface, not docs-first baseline. |
| HPC container posture | Apptainer / Podman split | `planned` | Architecture supports external runners; runtime split not implemented yet. |
| Long-term archive layout | OCFL | `planned` | Future archival layer for exported bundles. |

## Implemented Anchors

- Code: `src/application/HomeGenomeControlPlane.ts`
- Reference manifests: `src/domain/homeGenome.ts`, `src/adapters/InMemoryReferenceBundleRegistry.ts`, `src/adapters/FileBackedReferenceBundleRegistry.ts`
- Audit integrity: `src/ports/IEventStore.ts`, `src/adapters/eventStoreHashChain.ts`, `src/adapters/InMemoryEventStore.ts`, `src/adapters/FileBackedEventStore.ts`
- QC policy: `src/ports/IQcGateEvaluator.ts`, `src/adapters/ThresholdQcGateEvaluator.ts`
- Consensus policy: `src/ports/IVariantConsensusProvider.ts`, `src/ports/IHlaTypingConsensusProvider.ts`, `src/adapters/ThresholdVariantConsensusProvider.ts`, `src/adapters/ThresholdHlaTypingConsensusProvider.ts`
- Test trap: `tests/homegenome-control-plane.test.ts`
- Contract: [case-export-bundle-contract.md](case-export-bundle-contract.md)
- Schema: [schemas/case-export-bundle.schema.json](schemas/case-export-bundle.schema.json)
- Roadmap: `docs/how-to/implementation-roadmap-2026-04-21.md`

## Non-Goals For This Iteration

- full GA4GH service endpoints (DRS/WES/TES/TRS);
- clinical-grade interoperability claims;
- regulated release compliance claims.

The current iteration focuses on the smallest sound control-plane export contract that can evolve toward those standards without a breaking redesign.