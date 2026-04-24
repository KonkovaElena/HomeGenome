---
title: "HomeGenome Case Export Bundle Contract"
status: "active"
version: "1.3.0"
last_updated: "2026-04-24"
tags: [homegenome, export, provenance, ro-crate, prov, drs]
mode: "reference"
---

# HomeGenome Case Export Bundle Contract

## Purpose

`CaseExportBundle` is the current portable export contract for HomeGenome case state.

It is designed as a practical local-first handoff unit with:

- RO-Crate-compatible metadata envelope;
- PROV-compatible provenance summary;
- DRS-like artifact identifiers for stable object references;
- pinned reference bundle manifests with per-file sha256 digests;
- a self-verifiable bundle checksum over canonical JSON;
- a Phenopackets-oriented projection that can evolve toward broader GA4GH portability without changing the rest of the bundle contract.

The contract is implemented in:

- `src/application/HomeGenomeControlPlane.ts` (`exportCaseBundle()`)

## Contract Shape (v1.2.0)

Top-level fields:

- `schemaVersion`: fixed `"1.0.0"`
- `bundleId`: stable bundle identifier
- `caseId`: HomeGenome case identifier
- `generatedAt`: ISO timestamp
- `generatedBy`: exporter actor
- `bundleChecksum`: `sha256:*` digest over the canonical JSON export payload
- `auditCheckpoint`: export-time digest anchor for the case audit chain
- `referenceBundles`: pinned input manifests for each referenced reference bundle
- `phenopacket`: Phenopackets-oriented v2-shaped projection
- `roCrateMetadata`: RO-Crate metadata block
- `workflowRunCrates`: workflow-run projection records
- `drsObjects`: DRS-like artifact records
- `prov`: PROV summary block
- `snapshot`: embedded case snapshot

Within `snapshot.events[]`, persisted audit events now carry a tamper-evident chain:

- `eventHash`: SHA-256 digest of the canonical persisted event record;
- `previousEventHash`: SHA-256 digest of the previous event in the same aggregate stream, when one exists.

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

## Audit Event Integrity

HomeGenome audit events are still append-only, but the runtime slice now also makes them tamper-evident:

- each persisted event carries `eventHash`;
- every non-genesis event carries `previousEventHash`;
- the chain is validated when event streams are appended and when persisted streams are read back.

This does not replace signatures or external attestation, but it raises local evidence quality above plain append-only JSON logs.

## Audit Checkpoint Digest

Every exported bundle now also carries `auditCheckpoint`.

It summarizes the current case audit stream with:

- `eventCount` and `latestVersion`;
- `firstEventHash` and `lastEventHash`;
- `checkpointHash`, computed over the canonical checkpoint payload.

This is the current bridge from local tamper-evidence toward later signed or externally attested evidence packs.

## Reference Bundle Manifest Pinning

Each exported bundle now includes `referenceBundles[]`.

For every referenced bundle, HomeGenome exports:

- `bundleId`, `name`, `version`, and `createdAt`;
- `assets[]` manifest entries;
- one normalized `sha256:*` checksum per manifest asset.

This turns reference inputs into an explicit bill of materials instead of an implicit runtime assumption.

## Bundle Checksum

`bundleChecksum` is computed as a SHA-256 digest over the canonical JSON representation of the export payload, excluding the checksum field itself.

This gives the current runtime slice a lightweight integrity anchor for export transport, snapshot review, and later attestation work.

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
- `used`: also includes referenced reference bundle entities
- `wasAssociatedWith`: export activity linked to exporter agent
- `wasDerivedFrom`: exported bundle linked to the case entity, referenced reference bundles, and artifact entities

## Phenopackets-Oriented Projection

`phenopacket` is an additive export surface, not a claim of full normative Phenopackets conformance yet.

Current projection includes:

- `id` mapped from `caseId`;
- `subject.id` mapped from `subjectId`;
- `biosamples[]` projected from registered HomeGenome samples;
- `files[]` projected from exported artifacts and their DRS-like identifiers;
- `interpretations[]` projected from workflow runs;
- `metaData` with generation provenance and a local resource descriptor.

This keeps HomeGenome aligned with the Phenopackets direction while remaining honest about the current runtime slice.

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
- This contract does not yet claim full GA4GH Phenopackets schema parity.
- This contract does not yet package large binary payloads into archival objects (for example OCFL object trees).
- This contract does not claim clinical interoperability readiness.

It is an implementation baseline for portable provenance and controlled future interoperability.