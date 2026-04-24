---
title: "HomeGenome Security Threat Model"
status: "active"
version: "1.0.0"
last_updated: "2026-04-24"
tags: [homegenome, security, threat-model, zero-trust, air-gap]
mode: "reference"
---

# HomeGenome Security Threat Model

## Purpose

This document defines the current security posture for the HomeGenome baseline and sets the boundary for future hardening work.

It exists to keep the repository honest about what is already protected, what is only partially addressed, and what is still future work.

## External Evidence Anchors

- NIST SP 800-92 frames security log management as part of audit and accountability operations.
- NIST SP 800-207 frames zero trust as a shift away from static perimeter assumptions toward explicit protection of users, assets, and resources.

HomeGenome maps those ideas conservatively into a local operator-controlled genomics context rather than claiming enterprise-grade completion.

## Current Security Posture

HomeGenome is currently designed for:

- local-first or air-gapped operation;
- operator-controlled deployments;
- explicit intended-use and research-boundary documentation;
- append-only audit events with a tamper-evident hash chain;
- export-time audit checkpoint digests that can be signed or attested externally later;
- artifact and export integrity based on normalized SHA-256 digests.

HomeGenome does not yet provide a full security envelope for production genomics operations.

## Protected Assets

The current baseline treats the following as security-relevant assets:

- case records and review state;
- biosample and sequencing-run lineage;
- workflow dispatch and workflow-run metadata;
- audit events;
- artifact manifests and their checksums;
- reference bundle manifests;
- export bundles and bundle checksums.

## Primary Threat Actors

- a local operator making unsafe or unverifiable changes;
- a compromised local workstation or runner modifying state files;
- a malicious or buggy workflow tool emitting misleading outputs;
- a poisoned or mismatched reference bundle;
- a future contributor widening scope beyond the intended-use boundary without updating the safety documents.

## Misuse Cases To Guard Against

HomeGenome should not drift into any of the following patterns without explicit architectural review:

1. treating local air-gapped deployment as equivalent to trust;
2. treating append-only logs as sufficient when integrity is not verifiable;
3. treating reference bundle identifiers as enough provenance without per-file manifests;
4. treating research outputs as if they were clinical decisions;
5. exposing real personal genomic data through the public repository or issue tracker;
6. turning future OpenRNA or therapy-adjacent concepts into actionable operator instructions.

## Air-Gapped Operator Boundary

Air-gapped is an operating constraint, not a security guarantee.

For the current HomeGenome baseline, the operator boundary means:

- the repository assumes a trusted administrator still needs explicit auditability;
- local files may be modified, so event and export integrity must be checkable after the fact;
- imported tools, reference bundles, and offline updates remain part of the supply chain risk surface;
- security claims must be tied to controls on assets and workflows, not to the absence of Internet access alone.

## Current Implemented Controls

- intended-use and research boundary documents;
- append-only case audit events with optimistic concurrency;
- tamper-evident event hash chaining in persisted audit streams;
- audit checkpoint digests emitted in export bundles as an attestation anchor;
- mandatory SHA-256 checksums for artifacts;
- hashed manifests for reference bundle assets;
- canonical SHA-256 checksum for export bundles.

## Known Gaps

The following remain future hardening work:

- operator authentication and RBAC;
- encryption at rest for state and exported bundles;
- key management and signing policy;
- secret handling for future adapters;
- signed releases, attestations, and SBOM enforcement as part of the normal HomeGenome release lane;
- formal incident response and recovery playbooks.

## Operating Rule

If a future change claims stronger security posture than the controls above, it must update this document and the adjacent boundary documents in the same change set.