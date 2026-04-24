# HomeGenome

English: this file
Русская версия: [README.ru.md](README.ru.md)

HomeGenome is a local-first genomics research repository about air-gapped human genome sequencing with Oxford Nanopore, reproducible analysis workflows, and a small TypeScript control-plane scaffold for future operator-driven automation.

The repository is not a medical device, not a clinical workflow, and not a personal treatment system. It is a research and engineering baseline for building a traceable local genomics control plane.

## Status

- Repository type: docs-first research project with an early code-bearing runtime slice.
- Current maturity: architecture corpus plus a minimal Node 24 / TypeScript control plane.
- Safety boundary: research and technical evaluation only.
- Publication state: GitHub-published baseline; provenance tightening and GitHub-side settings still need final review.

The formal intended-use boundary is in [docs/reference/intended-use.md](docs/reference/intended-use.md).

## What Is In The Repository

- A reference documentation corpus on local nanopore sequencing, tooling choices, interpretation boundaries, and future architecture.
- An early control-plane scaffold with case lifecycle state management, workflow dispatch tracking, event-backed audit history, and Nextflow integration seams.
- File-backed durable adapters with cross-process locking for the current local persistence baseline.
- Explicit ports for sequencing telemetry and ONT MinKNOW adaptive sampling control.
- A portable Case Export Bundle contract with RO-Crate metadata, PROV summary, and DRS-like artifact references.

## Quick Start

Requirements:

- Node.js 24+
- npm 11+

Local validation:

```bash
npm install
npm run typecheck
npm run verify:contracts
npm test
npm run test:coverage
npm run build
```

## Current Runtime Slice

The code in `src/` and `tests/` is intentionally narrow. It currently covers:

- case lifecycle and state-machine enforcement;
- biosample, sequencing run, artifact, and reference-bundle registration;
- append-only audit events for control-plane actions;
- tamper-evident hash chaining for persisted audit events;
- workflow dispatch and workflow-run tracking;
- file-backed durability for events and workflow state;
- hashed reference-bundle manifests for pinned analysis inputs;
- threshold-based QC gate evaluation with explicit pass, fail, and manual-review outcomes;
- threshold-based variant and HLA consensus review before interpretation release;
- sequencing telemetry ingestion;
- adaptive sampling updates through an explicit `IMinKnowClient` port.
- case-level export bundles with RO-Crate metadata, PROV/DRS-compatible fields, pinned reference-bundle manifests, a canonical bundle checksum, and a Phenopackets-oriented projection.

It does not yet implement a full sequencing operations stack, a MinKNOW adapter, or clinical-grade durability.

## Recommended Reading Order

Start here if you want the shortest path through the repo:

1. [docs/reference/intended-use.md](docs/reference/intended-use.md)
2. [docs/reference/architecture-skeleton-2026-04-21.md](docs/reference/architecture-skeleton-2026-04-21.md)
3. [docs/reference/case-export-bundle-contract.md](docs/reference/case-export-bundle-contract.md)
4. [docs/reference/security-threat-model-2026-04-24.md](docs/reference/security-threat-model-2026-04-24.md)
5. [docs/reference/homegenome-control-plane.openapi.yaml](docs/reference/homegenome-control-plane.openapi.yaml)
6. [docs/reference/standards-adoption-matrix-2026-04-22.md](docs/reference/standards-adoption-matrix-2026-04-22.md)
7. [docs/reference/pipeline-architecture.md](docs/reference/pipeline-architecture.md)
8. [docs/how-to/implementation-roadmap-2026-04-21.md](docs/how-to/implementation-roadmap-2026-04-21.md)
9. [docs/reference/sources-and-provenance.md](docs/reference/sources-and-provenance.md)

The full docs map is in [docs/README.md](docs/README.md).

## Documentation Language

The deeper documentation corpus is currently Russian-first. This is deliberate: the project started as a research notebook and architecture corpus for a Russian-speaking workflow.

The publication-facing entrypoints now include:

- [README.md](README.md) in English;
- [README.ru.md](README.ru.md) in Russian;
- English terminology preserved where tool names or standards are clearer that way.

## Safety And Research Boundary

HomeGenome is not intended for:

- autonomous diagnosis;
- direct treatment selection;
- unsupervised therapeutic design;
- public handling of real personal genomic data inside this repository.

The OpenRNA connection remains a future, policy-gated architecture surface rather than part of the current baseline. See [docs/explanation/openrna-bridge.md](docs/explanation/openrna-bridge.md).

## Repository Structure

- `src/` — TypeScript control-plane scaffold
- `tests/` — `node:test` regression suite
- `docs/reference/` — boundaries, architecture, provenance
- `docs/explanation/` — long-form technical explanations
- `docs/research/` — dated research memos
- `docs/how-to/` — implementation and publication workflows
- `docs/evidence/` — audits and evidence snapshots

## Community And Citation

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [SECURITY.md](SECURITY.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [SUPPORT.md](SUPPORT.md)
- [CITATION.cff](CITATION.cff)

## What Still Needs To Be Done Before A Full Public Launch

- final provenance tightening for externally derived long-form text;
- GitHub-side configuration such as branch protection, private vulnerability reporting, repository topics, and social preview;
- optional next-step runtime work: sample/run/artifact durable stores beyond the current workflow and event slice.

The current public-preparation audit is in [docs/evidence/publication-readiness-audit-2026-04-21.md](docs/evidence/publication-readiness-audit-2026-04-21.md).
