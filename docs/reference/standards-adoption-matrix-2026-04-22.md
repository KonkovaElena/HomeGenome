---
title: "HomeGenome Standards Adoption Matrix"
status: "active"
version: "1.0.0"
last_updated: "2026-04-22"
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
| Workflow run provenance | Workflow-run crate projection | `implemented` | `workflowRunCrates[]` emitted per workflow run in bundle export. |
| Reproducible orchestration | Nextflow runner seam | `implemented` | `IAnalysisWorkflowRunner` + `NextflowWorkflowRunner` already in baseline. |
| Telemetry control | MinKNOW telemetry/adaptive sampling seam | `implemented` | `IMinKnowClient` + control-plane methods are wired and tested. |
| Quality verification | Built-in Node coverage thresholds + file snapshot rail | `implemented` | `test:coverage` and checked-in export bundle snapshot guard contract drift. |
| Data API interoperability | GA4GH DRS API server | `planned` | Current layer is DRS-like contract; full DRS REST surface is not implemented. |
| Workflow API interoperability | GA4GH WES/TES contracts | `planned` | Current layer uses internal runner/sink contracts with similar intent. |
| Tool registry interoperability | GA4GH TRS | `planned` | No TRS endpoint yet; reference bundle registry is local-only. |
| Variant portability | GA4GH VRS exports | `planned` | Current baseline tracks artifacts; no VRS serializer yet. |
| Phenotype portability | Phenopackets export | `planned` | Intended for interoperability phase in roadmap. |
| Supply-chain provenance | SLSA + in-toto attestations | `planned` | CI has baseline security checks; no artifact attestation pipeline yet. |
| Artifact signing | Sigstore / cosign | `planned` | Not yet integrated into release flow. |
| SBOM | SPDX / CycloneDX | `planned` | Not yet generated in HomeGenome release workflow. |
| IAM for operator actions | Keycloak | `out-of-scope-now` | Not needed for current single-repo baseline; tracked as future hardening. |
| Secret management | OpenBao | `out-of-scope-now` | Future operational deployment surface, not docs-first baseline. |
| HPC container posture | Apptainer / Podman split | `planned` | Architecture supports external runners; runtime split not implemented yet. |
| Long-term archive layout | OCFL | `planned` | Future archival layer for exported bundles. |

## Implemented Anchors

- Code: `src/application/HomeGenomeControlPlane.ts`
- Test trap: `tests/homegenome-control-plane.test.ts`
- Contract: [case-export-bundle-contract.md](case-export-bundle-contract.md)
- Schema: [schemas/case-export-bundle.schema.json](schemas/case-export-bundle.schema.json)
- Roadmap: `docs/how-to/implementation-roadmap-2026-04-21.md`

## Non-Goals For This Iteration

- full GA4GH service endpoints (DRS/WES/TES/TRS);
- clinical-grade interoperability claims;
- regulated release compliance claims.

The current iteration focuses on the smallest sound control-plane export contract that can evolve toward those standards without a breaking redesign.