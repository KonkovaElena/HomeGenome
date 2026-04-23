---
title: "HomeGenome Implementation Roadmap"
status: "active"
version: "1.1.0"
last_updated: "2026-04-23"
tags: [homegenome, roadmap, implementation, architecture]
mode: "how-to"
---

# HomeGenome Implementation Roadmap

## Goal

Перевести HomeGenome из docs-first research corpus в code-bearing local genomics control plane без преждевременного ухода в therapeutic, cloud-first или monolithic-bioinformatics направления.

## Implementation Rule

Каждая фаза должна оставаться совместимой с:

- [../reference/intended-use.md](../reference/intended-use.md)
- [../reference/research-and-safety-boundary.md](../reference/research-and-safety-boundary.md)
- [../reference/architecture-skeleton-2026-04-21.md](../reference/architecture-skeleton-2026-04-21.md)

## Phase 0. Documentation Baseline

Цель:

- закончить архитектурное и provenance-выравнивание.

Что должно существовать:

- intended-use surface;
- architecture skeleton;
- extraction and SOTA baseline;
- tightened OpenRNA bridge boundary.

Статус:

- выполнено этим циклом подготовки.

## Phase 1. Control-Plane Foundation

Цель:

- создать минимальный software skeleton без тяжёлого pipeline compute.

Первый кодовой срез:

- `ISampleRegistry`
- `ISequencingRunCatalog`
- `IReferenceBundleRegistry`
- `IArtifactStore`
- `IEventStore`
- `IMinKnowClient`
- `IStateMachineGuard` equivalent for HomeGenome lifecycle

Первые адаптеры:

- in-memory implementations;
- file-backed or SQLite-backed durable adapters.

Статус:

- in-memory implementations завершены;
- file-backed durable adapters for `IEventStore`, `IWorkflowDispatchSink` and `IAnalysisWorkflowRunner` завершены;
- sequencing run telemetry and adaptive sampling state are now modeled explicitly in the control plane;
- `IMinKnowClient` port is wired into the application layer for telemetry sync and adaptive sampling control;
- case-level export bundles now include RO-Crate metadata plus PROV/DRS-compatible fields for portable provenance handoff;
- SQLite-backed durability остаётся optional следующей итерацией, если появится потребность в richer query semantics.

Первые use cases:

- register sample;
- register sequencing run;
- attach artifacts;
- advance lifecycle state;
- ingest sequencing telemetry;
- apply adaptive sampling targets for active ONT runs;
- export case bundles with portable provenance metadata;
- query case lineage.

## Phase 2. Workflow Execution Layer

Цель:

- вынести execution orchestration за пределы ad hoc bash.

Основные deliverables:

- `IAnalysisWorkflowRunner`
- `IWorkflowDispatchSink`
- `NextflowWorkflowRunner`
- status reconciliation path for long-running workflow executions
- reference bundle selection and pinning
- run status tracking and idempotent submission

Правило:

- existing bash snippets remain reference material, but the canonical contract becomes workflow runner plus artifact manifests.

Статус:

- `IAnalysisWorkflowRunner`, `IWorkflowDispatchSink` and `NextflowWorkflowRunner` уже существуют;
- added file-backed durable workflow tracking closes the minimal persistence gap for the early workflow layer.
- next rational extension is workflow status reconciliation via polling or externally-triggered update ingestion, not transport-specific webhook lock-in.

## Phase 3. QC and Consensus Layer

Цель:

- ввести quality gates до интерпретации.

Deliverables:

- `IQcGateEvaluator`
- `IVariantConsensusProvider`
- `IHlaTypingConsensusProvider`
- threshold-based manual review state
- confidence and disagreement metadata

Bridge to interoperability:

- keep `CaseExportBundle` aligned with `RO-Crate`, `W3C PROV-O`, and DRS-like artifact identifiers so later GA4GH export layers are additive rather than disruptive.

Это фаза, где HomeGenome перестаёт быть просто run-tracker и становится evidence-aware genomics system.

Статус:

- `IQcGateEvaluator` and `ThresholdQcGateEvaluator` now exist in the minimal runtime slice.
- `HomeGenomeControlPlane.evaluateCaseQc()` now materializes explicit `PASS`, `FAIL`, and `MANUAL_REVIEW` decisions instead of relying on manual status changes only.
- the next rational extension is caller-consensus evidence (`IVariantConsensusProvider`, `IHlaTypingConsensusProvider`), not more ad hoc status branching.

## Phase 4. Interpretation Layer

Цель:

- оркестрировать специализированные interpretation modules без превращения проекта в один gigantic engine.

Deliverables:

- `IVariantAnnotationEngine`
- `IPharmacogenomicsInterpreter`
- `IPhenotypeContextProvider`
- `IResearchModelGateway`
- `IReportComposer`

Design rule:

- research-use models вроде AlphaGenome подключаются отдельно и маркируются как non-clinical research surfaces.

## Phase 5. Review and Release Layer

Цель:

- разделить завершение анализа и выпуск отчёта.

Deliverables:

- analyst review packet;
- final release decision;
- report bundle manifest;
- export history and audit trail.

Это обязательная фаза, если HomeGenome хочет быть серьёзным local operating layer, а не просто красивым пайплайном.

## Phase 6. Interoperability Layer

Цель:

- выпускать переносимые machine-readable outputs.

Deliverables:

- Phenopacket-oriented export;
- optional FHIR-oriented summary export;
- explicit file manifests for BAM, VCF and heavy artifacts.

## Phase 7. Horizon Integrations

Цель:

- держать future integrations изолированными и выключенными по умолчанию.

Potential modules:

- OpenRNA bridge;
- advanced methylation or expression modules;
- long-horizon synthetic-biology research surfaces.

Правило:

- no horizon module becomes part of baseline execution path without revisiting intended use and safety boundaries.

## Verification Strategy

### Architecture tests

- ports exist before adapters;
- no domain logic in workflow adapters;
- horizon integrations remain isolated.

### Behavioral tests

- lifecycle transitions;
- artifact lineage;
- QC gate behavior;
- consensus threshold behavior;
- release gating.

### Evidence tests

- reference bundle pinning;
- reproducibility manifests;
- export contract validation.

## Recommended First Coding Sprint

The smallest sound first coding sprint is:

1. create domain lifecycle enums and value objects;
2. add core ports for samples, runs, artifacts and events;
3. add in-memory adapters;
4. add one CLI or local API slice for case and run registration;
5. add architecture and behavior tests;
6. keep workflow execution mocked until the control plane is stable.

## Non-Goals For Early Implementation

1. do not start with AlphaGenome integration;
2. do not start with direct therapeutic or OpenRNA bridging;
3. do not start with full cloud sync;
4. do not start by rewriting every bash step into one internal mega-service.

## Definition Of A Good Early HomeGenome Runtime

A good early runtime is one that can answer, reproducibly:

- what sample was processed;
- with which reference bundle;
- by which workflow request;
- with which QC outcome;
- into which interpretation packet;
- and under which release decision.

If the system cannot answer those questions yet, it is still a pipeline toy, not a genomics control plane.