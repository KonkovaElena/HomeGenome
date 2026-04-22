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

- `artifact.checksum` is mandatory and must be a normalized `sha256:*` digest;
- `id` is a DRS-safe content-addressed identifier derived from the checksum;
- `selfUri = drs://homegenome.local/<url-encoded-id>`;
- `checksums[]` uses DRS-style checksum objects with `type = sha-256`;
- `accessMethods[]` currently exposes a local `file` access method;
- `sourceUri` preserves the control-plane logical artifact URI.

This is intentionally DRS-like, not a full DRS server implementation.

## Artifact Hashing Policy

For the current runtime baseline:

- `attachArtifact()` rejects artifacts that do not provide a normalized `sha256:*` checksum;
- exported DRS-like records always carry a checksum;
- RO-Crate file entities carry the same checksum into the metadata graph.

## RO-Crate Mapping

`roCrateMetadata` uses:

- `@context`: `https://w3id.org/ro/crate/1.1/context`
- metadata descriptor with `conformsTo = https://w3id.org/ro/crate/1.1`
- `@graph`: includes metadata entity, bundle dataset entity, case dataset entity, exporter agent entity, and one file entity per artifact.

This enables low-friction evolution toward richer RO-Crate packaging without breaking the current contract.

## PROV Mapping

`prov` uses:

- `@context`: `https://www.w3.org/ns/prov#`
- `entity`, `activity`, and `agent` maps keyed by URN
- `wasGeneratedBy`: exported bundle entity linked to export activity
- `used`: export activity linked to case and artifact entities
- `wasAssociatedWith`: export activity linked to exporter agent
- `wasDerivedFrom`: exported bundle linked to the case entity and artifact entities

## JSON Schema

Machine-readable schema:

- [schemas/case-export-bundle.schema.json](schemas/case-export-bundle.schema.json)

## Test Trap

Behavioral trap for this contract:

- `tests/homegenome-control-plane.test.ts`
- test name: `control plane exports a case bundle with RO-Crate, PROV, and DRS references`

Stability rail:

- the same test also uses a checked-in golden file snapshot for the exported bundle payload.
- `npm run verify:contracts` checks that the TypeScript contract, OpenAPI surface, and JSON Schema stay aligned.

## Non-Goals (Current)

- This contract does not yet implement full GA4GH DRS API, WES, TES, or TRS servers.
- This contract does not yet package large binary payloads into archival objects (for example OCFL object trees).
- This contract does not claim clinical interoperability readiness.

It is an implementation baseline for portable provenance and controlled future interoperability.