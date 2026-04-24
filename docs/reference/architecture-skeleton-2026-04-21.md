---
title: "HomeGenome Architecture Skeleton"
status: "active"
version: "1.1.0"
last_updated: "2026-04-24"
tags: [homegenome, architecture, genomics, control-plane, openrna]
mode: "reference"
---

# HomeGenome Architecture Skeleton

## Executive Thesis

Лучший April 2026 path для HomeGenome — строить не «ещё один пайплайн» и не «ещё один DNA marketplace», а **local-first genomics control plane**.

Это значит:

- тяжёлые вычислительные шаги выполняют внешние, воспроизводимые workflow engines и специализированные инструменты;
- HomeGenome управляет case model, workflow intents, evidence lineage, QC and review gates, interpretation assembly, report release and future handoff;
- OpenRNA bridge остаётся отдельным, policy-gated future subsystem, а не частью базового MVP.

## What Was Extracted

### From MicroPhoenix

Из MicroPhoenix полезно забирать не весь 10-layer stack целиком, а проверенные архитектурные принципы:

1. ports/adapters and inward dependency discipline;
2. explicit authority docs and verification rails;
3. extraction-driven architecture work instead of ad hoc copying donor patterns;
4. event and lineage thinking for traceable systems;
5. strict separation between active control plane and future or horizon docs.

Relevant local anchors:

- `04-REFERENCE/architecture.md`
- `04-REFERENCE/extraction-protocol.md`

### From OpenRNA

OpenRNA contributes the most reusable donor patterns for turning a research stack into a serious control plane:

1. explicit state machine instead of hidden route-level transitions;
2. interface-first ports plus in-memory and durable adapters;
3. lineage graph and append-only audit model;
4. registry pattern for reference bundles, modalities and governance-gated features;
5. multi-tool consensus with disagreement thresholds and manual review gates;
6. dual review or release ceremony for sensitive outputs;
7. intended-use and regulatory boundary as first-class documents.

Relevant local anchors:

- `OpenRNA/README.ru.md`
- `OpenRNA/docs/design.md`
- `OpenRNA/docs/INTENDED_USE.md`
- `OpenRNA/docs/REGULATORY_CONTEXT.md`
- `OpenRNA/docs/archive/MEDICAL_EVIDENCE_AND_COMPETITOR_BASELINE_2026-03.md`

### External April 2026 Signals

#### Workflow orchestration and reproducibility

- Nextflow is still positioned by Seqera as a scalable, portable and reproducible workflow system across local, HPC and cloud environments.
- nf-core/sarek shows the strongest open-source pattern for genomics pipeline engineering: DSL2 modularity, per-process containers, multi-caller support, release benchmarking on full datasets, published citations and public support channels.

#### Specialized genomics and immunogenomics tooling

- pVACtools remains a modular suite rather than a monolith: pVACseq, pVACbind, pVACfuse, pVACsplice, pVACvector, pVACview.
- pVACtools 6.1.0 continues to evolve tiering, review, comparison and vaccine-construction helpers, which reinforces the design lesson: specialized steps should stay separable.

#### Portable case and interpretation schemas

- GA4GH Phenopackets v2 remains the strongest portable schema family for individual, biosample, phenotype, file, interpretation and genomic interpretation payloads.

#### AI-based interpretation

- AlphaGenome is now exposed publicly as a research-use API for non-commercial use, with up to 1Mbp input context and joint multimodal regulatory prediction.
- DeepMind explicitly says AlphaGenome is not designed or validated for direct clinical use or personal genome prediction.

#### Clinical trajectory and competitor realism

- ClinicalTrials.gov confirms V940/intismeran autogene in Phase 3 melanoma (`NCT05933577`) and autogene cevumeran in Phase 2 PDAC (`NCT05968326`).
- Sequencing.com positions itself as a consumer-facing whole-genome service with cloud reanalysis, marketplace reports, downloadable FASTQ/BAM/VCF and privacy marketing.

## Design Conclusion From The Evidence

HomeGenome should **adopt** workflow reproducibility from Nextflow/nf-core, **compose** specialty tools instead of reimplementing them, **extend** OpenRNA-style control-plane patterns into personal genomics, and **avoid** becoming a cloud genomics marketplace or a therapy system.

## Recommended Product Identity

HomeGenome should be framed as:

> A local, air-gapped genomics operating layer that coordinates sample intake, sequencing runs, artifact lineage, reproducible analysis workflows, interpretation modules, review gates and portable outputs for advanced personal or research genomics.

Not as:

- a direct medical device;
- a universal variant caller;
- a cloud report marketplace;
- an autonomous therapeutic design engine.

## Canonical Architecture Style

### Global principles

1. local-first and air-gapped by default;
2. ports/adapters everywhere a heavy tool, external model or storage backend can vary;
3. append-only evidence and artifact lineage;
4. explicit state machine for sample and analysis lifecycle;
5. multi-tool consensus for high-risk calls;
6. review and release gates before any externally consumable report;
7. future OpenRNA bridge disabled by default and guarded by policy.

### Layered skeleton

#### 1. Presentation Layer

Surfaces:

- local web UI;
- CLI;
- local API.

Responsibilities:

- operator interaction;
- sample and run dashboards;
- review screens;
- report download and export.

#### 2. Protocol Layer

Surfaces:

- local REST or gRPC boundary;
- import and export contracts;
- optional plugin and model invocation contracts.

Responsibilities:

- stable API contracts;
- schema validation at the edge;
- versioned local automation interface.

#### 3. Application Orchestration Layer

Responsibilities:

- submit sequencing and analysis workflows;
- coordinate retries and idempotency;
- trigger QC, consensus and review steps;
- assemble interpretation packets;
- publish release packages.

This is the primary control plane.

#### 4. Domain Layer

Core aggregates and value objects:

- `IndividualCase`
- `Biosample`
- `SequencingRun`
- `AnalysisRun`
- `ReferenceBundle`
- `ArtifactManifest`
- `VariantSet`
- `InterpretationPacket`
- `ReviewDecision`
- `ReleasePackage`

Domain rules:

- no interpretation release before QC passes;
- no consensus-dependent result release while unresolved disagreements exceed threshold;
- no OpenRNA handoff unless policy and safety gates explicitly allow it.

#### 5. Evidence And Lineage Layer

Responsibilities:

- append-only event stream;
- tamper-evident event chain for persisted audit records;
- correlation IDs;
- artifact hashing;
- lineage graph from biosample to report;
- reproducibility metadata per run.

This is the subsystem that makes HomeGenome auditable rather than just functional.

#### 6. Workflow Execution Integration Layer

Responsibilities:

- run external pipelines;
- capture run status and outputs;
- ingest device telemetry and operator-visible health metrics;
- expose adaptive sampling control as an explicit software surface;
- attach resource usage and provenance.

Preferred execution adapters:

- `NextflowWorkflowRunner`
- `IMinKnowClient` for ONT telemetry sync and adaptive sampling updates
- `LocalBashWorkflowRunner` for legacy reference scripts
- `OntWorkflowRunner` for ONT-specific wrappers

Design rule:

- the current bash examples in HomeGenome remain valuable as reference implementations, but they should not become the long-term canonical orchestration surface.
- for long-running workflow status updates, prefer a webhook-neutral polling or reconciliation surface over callback-only orchestration; transport may vary, but the control-plane contract should remain stable.

#### 7. Interpretation Layer

Responsibilities:

- annotation orchestration;
- PGx, HLA and phenotype-specific modules;
- AI-assisted regulatory variant interpretation;
- variant prioritization and triage.

Design rule:

- AlphaGenome and similar models must stay behind explicitly labeled research-use ports.

#### 8. Review And Release Layer

Responsibilities:

- analyst review;
- lab or operator release;
- report packaging;
- downstream export.

Recommended release model:

- first gate: analyst or bioinformatics review;
- second gate: final release or publish decision.

#### 9. Interoperability Layer

Responsibilities:

- Phenopacket export;
- optional FHIR-oriented export;
- machine-readable report bundle;
- OpenRNA bridge requests once enabled.

#### 10. Policy And Safety Layer

Responsibilities:

- intended-use enforcement;
- RBAC and operator roles;
- model and modality activation policy;
- boundary checks for therapy-adjacent flows.

## Proposed Domain Ports

The initial port set should look closer to OpenRNA than to a generic bioinformatics monolith.

### Core orchestration ports

- `ISampleRegistry`
- `ISequencingRunCatalog`
- `IAnalysisWorkflowRunner`
- `IWorkflowDispatchSink`
- `IReferenceBundleRegistry`
- `IArtifactStore`
- `IEventStore`

### Quality and consensus ports

- `IQcGateEvaluator`
- `IVariantConsensusProvider`
- `IHlaTypingConsensusProvider`
- `IReviewGate`

### Interpretation ports

- `IVariantAnnotationEngine`
- `IPhenotypeContextProvider`
- `IResearchModelGateway`
- `IPharmacogenomicsInterpreter`
- `IReportComposer`

### Interop and policy ports

- `IPhenopacketExporter`
- `IFhirExporter`
- `IPolicyGate`
- `IConsentTracker`
- `IRbacProvider`
- `IOpenRnaBridge`

## Recommended State Machine

Suggested case and run lifecycle:

1. `INTAKE_PENDING`
2. `BIOSAMPLE_REGISTERED`
3. `SEQUENCING_REQUESTED`
4. `SEQUENCING_RUNNING`
5. `RAW_ARTIFACTS_CAPTURED`
6. `QC_PENDING`
7. `QC_FAILED`
8. `QC_PASSED`
9. `PRIMARY_ANALYSIS_RUNNING`
10. `CONSENSUS_REVIEW_REQUIRED`
11. `INTERPRETATION_RUNNING`
12. `ANALYST_REVIEW_PENDING`
13. `RELEASE_PENDING`
14. `RELEASED`
15. `ARCHIVED`

Optional re-entry states:

- `REANALYSIS_REQUESTED`
- `REFERENCE_BUNDLE_UPDATED`

## Data Contracts

### Internal canonical records

At minimum, each case should preserve:

- subject metadata;
- biosample metadata;
- sequencing platform and library prep metadata;
- run IDs and raw artifact manifests;
- reference bundle version;
- QC metrics snapshots;
- alignment and variant calling outputs;
- consensus records;
- interpretation records;
- review decisions;
- release package metadata.

### Portable external contracts

Recommended portable export baseline:

- GA4GH Phenopackets for individual, biosample, file and interpretation context;
- VCF/BAM manifests rather than blindly embedding raw heavy files;
- optional FHIR-oriented summaries for institutional interoperability.

## Non-Functional Requirements

### Mandatory

1. full local execution possible without cloud dependencies for the core path;
2. reproducible workflow invocation with versioned reference bundles;
3. explicit audit events and lineage;
4. clear separation between research-use models and production-safe outputs;
5. report release gate separate from analysis completion;
6. large artifacts excluded from git and tracked via manifests.

### Strongly recommended

1. in-memory plus durable adapter strategy from day one;
2. containerized execution for heavy workflows;
3. per-run environment and tool-version manifest;
4. benchmarked default workflows instead of one-off shell scripts.

## What HomeGenome Should Borrow From Analogs

### From Nextflow and nf-core/sarek

- declarative workflow orchestration;
- reusable modules and subworkflows;
- containerized per-step reproducibility;
- benchmark and test datasets as release discipline;
- explicit input samplesheets and output contracts.

### From pVACtools

- modular special-purpose tool suite rather than false all-in-one abstraction;
- explicit filter, tier and review surfaces;
- downstream visualization and selection tools as separate modules.

### From OpenRNA

- case-centric state machine;
- port and registry patterns;
- multi-tool consensus gates;
- intended-use boundary;
- independent release gate.

## What HomeGenome Should Not Copy

### From OpenRNA

- do not import oncology-specific release workflows or Part-11-like compliance surfaces into HomeGenome MVP;
- do not make therapeutic handoff part of the base personal-genomics flow;
- do not reuse vocabulary that implies treatment readiness where the project is still research-grade.

### From consumer genomics competitors

- do not adopt cloud-first data centralization as the default architecture;
- do not model HomeGenome as a DNA report marketplace;
- do not let continuous reanalysis subscriptions define the architecture before the local evidence model is mature.

### From the current HomeGenome docs themselves

- do not treat the current bash pipeline as the long-term control-plane contract;
- do not blur present capability and 2036 horizon material in runtime-facing design docs.

## Concrete Repository Skeleton

```text
HomeGenome/
  README.md
  docs/
    reference/
    explanation/
    research/
    reports/
  src/
    presentation/
      api/
      cli/
      ui/
    application/
      usecases/
        intake/
        sequencing/
        qc/
        analysis/
        interpretation/
        review/
        release/
        export/
    domain/
      entities/
      events/
      policies/
      value-objects/
    ports/
    infrastructure/
      workflows/
        nextflow/
        local-bash/
        ont/
      storage/
      lineage/
      ai/
      exports/
      policy/
  tests/
    architecture/
    application/
    integration/
    fixtures/
```

## Roadmap Recommendation

### Phase 0

Keep HomeGenome docs-first, but normalize architecture docs and provenance.

### Phase 1

Build only the control-plane skeleton:

- ports;
- state machine;
- sample and run and artifact registry;
- event lineage;
- Nextflow runner adapter.

### Phase 2

Integrate QC, variant consensus, annotation and portable exports.

### Phase 3

Add research-use interpretation ports for AlphaGenome-class and phenotype-aware engines.

### Phase 4

Add analyst review and release gate.

### Phase 5

Add OpenRNA bridge as disabled-by-default integration surface behind safety policy.

## Final Recommendation

The smallest sound implementation is:

1. **adopt** Nextflow and nf-core-style reproducible workflow orchestration;
2. **extend** OpenRNA-style control-plane patterns into personal genomics;
3. **compose** specialized tools like pVACtools and research models behind ports;
4. **build** a HomeGenome-native evidence, review and local interoperability layer.

That gives HomeGenome a serious architecture without overclaiming, without reinventing mature tooling, and without collapsing into either a brittle bash project or a cloud consumer-genomics clone.