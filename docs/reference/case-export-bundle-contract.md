---
title: "HomeGenome Case Export Bundle Contract"
status: "active"
version: "1.0.0"
last_updated: "2026-04-22"
tags: [homegenome, export, provenance, ro-crate, prov, drs]
mode: "reference"
---

# HomeGenome Case Export Bundle Contract

## Purpose

`CaseExportBundle` is the current portable export contract for HomeGenome case state.

It is designed as a practical local-first handoff unit with:

- RO-Crate-compatible metadata envelope;
- PROV-compatible provenance summary;
- DRS-like artifact identifiers for stable object references.

The contract is implemented in:

- `src/application/HomeGenomeControlPlane.ts` (`exportCaseBundle()`)

## Contract Shape (v1.0.0)

Top-level fields:

- `schemaVersion`: fixed `"1.0.0"`
- `bundleId`: stable bundle identifier
- `caseId`: HomeGenome case identifier
- `generatedAt`: ISO timestamp
- `generatedBy`: exporter actor
- `roCrateMetadata`: RO-Crate metadata block
- `workflowRunCrates`: workflow-run projection records
- `drsObjects`: DRS-like artifact records
- `prov`: PROV summary block
- `snapshot`: embedded case snapshot

## DRS-Like Object Rules

Each artifact in `snapshot.artifacts` is mapped to one `drsObjects[]` entry:

- if `artifact.checksum` exists, `objectId` is checksum-normalized (prefer `sha256:*`);
- otherwise `objectId = "artifact:<artifactId>"`;
- `uri = drs://homegenome/<url-encoded-objectId>`;
- `sourceUri` preserves the local artifact URI.

This is intentionally DRS-like, not a full DRS server implementation.

## RO-Crate Mapping

`roCrateMetadata` uses:

- `@context`: `https://w3id.org/ro/crate/1.1/context`
- `@graph`: includes metadata entity, bundle dataset entity, case dataset entity, exporter agent entity, and one file entity per artifact.

This enables low-friction evolution toward richer RO-Crate packaging without breaking the current contract.

## PROV Mapping

`prov` uses:

- `@context`: `https://www.w3.org/ns/prov#`
- `entity`: case URN
- `activity`: export activity URN
- `agent`: exporter URN
- `wasDerivedFrom`: event URNs derived from case audit events
- `generatedAt`: export timestamp

## JSON Schema

Machine-readable schema:

- [schemas/case-export-bundle.schema.json](schemas/case-export-bundle.schema.json)

## Test Trap

Behavioral trap for this contract:

- `tests/homegenome-control-plane.test.ts`
- test name: `control plane exports a case bundle with RO-Crate, PROV, and DRS references`

## Non-Goals (Current)

- This contract does not yet implement full GA4GH DRS API, WES, TES, or TRS servers.
- This contract does not yet package large binary payloads into archival objects (for example OCFL object trees).
- This contract does not claim clinical interoperability readiness.

It is an implementation baseline for portable provenance and controlled future interoperability.