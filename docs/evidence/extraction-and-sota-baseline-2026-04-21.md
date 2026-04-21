---
title: "HomeGenome Extraction And SOTA Baseline"
status: "active"
version: "1.0.0"
last_updated: "2026-04-21"
tags: [homegenome, extraction, sota, competitors, research]
mode: "evidence"
---

# HomeGenome Extraction And SOTA Baseline

## Purpose

Этот документ фиксирует три вещи в одном месте:

1. что именно извлечено из MicroPhoenix и OpenRNA как donor material;
2. какие внешние official and public sources были проверены как April 2026 baseline;
3. какие архитектурные выводы из этого следуют для HomeGenome.

## Extraction Summary

## MicroPhoenix → HomeGenome

### What was extracted

1. **Ports and adapters as a default boundary discipline**.
2. **Architecture-first thinking instead of tool-first accretion**.
3. **Verification and docs governance as part of architecture work**.
4. **Extraction discipline**: adopt, extend, compose, build instead of donor copying.
5. **Separation between active implementation surfaces and horizon material**.

### Why it matters

HomeGenome already has strong research prose, but without these patterns it risks becoming a dense markdown knowledge base with no implementation boundary. MicroPhoenix contributes the operating model that turns an idea into a system.

### Local anchors checked

- `04-REFERENCE/architecture.md`
- `04-REFERENCE/extraction-protocol.md`

## OpenRNA → HomeGenome

### What was extracted

1. **Explicit lifecycle state machine** for sensitive workflows.
2. **Interface-first control plane** with in-memory and durable adapters.
3. **Audit and lineage graph** as first-class system behavior.
4. **Registry pattern** for modalities, reference bundles and policy-controlled features.
5. **Consensus gating** when multiple tools disagree.
6. **Review and final release separation**.
7. **Intended-use boundary** and explicit honesty about what the system does not do.

### Why it matters

HomeGenome needs exactly these capabilities if it evolves beyond documentation into a real local genomics operating layer. OpenRNA proves that a research-oriented biotech system can stay technically rigorous without pretending to be clinically cleared.

### Local anchors checked

- `OpenRNA/README.ru.md`
- `OpenRNA/docs/design.md`
- `OpenRNA/docs/INTENDED_USE.md`
- `OpenRNA/docs/REGULATORY_CONTEXT.md`
- `OpenRNA/docs/archive/MEDICAL_EVIDENCE_AND_COMPETITOR_BASELINE_2026-03.md`

## External SOTA Baseline

## Workflow and pipeline engineering

### Nextflow

Checked source:

- `https://docs.seqera.io/nextflow`

Confirmed signals:

- portable and reproducible workflow execution remains the core official message;
- local, HPC and cloud execution are all first-class deployment targets;
- Nextflow is still the clearest orchestration baseline for complex scientific pipelines.

### nf-core/sarek

Checked source:

- `https://nf-co.re/sarek/latest/`

Confirmed signals:

- DSL2 modularity and per-process containers remain central;
- multiple aligners and variant callers are a supported baseline, not a smell;
- benchmarking on full datasets and published result dashboards are part of release discipline;
- consensus calling and MultiQC-style aggregation remain standard practice.

## Specialized immunogenomics and interpretation tooling

### pVACtools

Checked source:

- `https://pvactools.readthedocs.io/en/latest/`

Confirmed signals:

- the suite remains modular: pVACseq, pVACbind, pVACfuse, pVACsplice, pVACvector, pVACview;
- the tool family includes review, comparison and downstream vaccine-construction helpers;
- this reinforces a key design rule for HomeGenome: specialized logic should stay decomposed, not fused into a single opaque service.

## Portable schema and interoperability

### GA4GH Phenopackets

Checked source:

- `https://phenopacket-schema.readthedocs.io/en/latest/`

Confirmed signals:

- version 2 remains the active shape of the schema;
- `Individual`, `Biosample`, `File`, `Interpretation`, `GenomicInterpretation`, `PhenotypicFeature` and FHIR guidance are all available;
- this is the strongest portable schema baseline for HomeGenome exports.

## AI interpretation layer

### AlphaGenome

Checked source:

- `https://deepmind.google/discover/blog/alphagenome-ai-for-better-understanding-the-genome/`

Confirmed signals:

- 1Mbp input context;
- multimodal regulatory prediction and efficient variant scoring;
- research-use API availability;
- explicit limitation: not validated for direct clinical use or personal genome prediction.

Design implication:

- AlphaGenome belongs behind a research-use interpretation port, not inside a default report generator.

## Clinical trajectory around the OpenRNA bridge horizon

### V940

Checked source:

- `https://clinicaltrials.gov/study/NCT05933577`

Confirmed signals:

- Phase 3 melanoma study;
- sponsor-backed ongoing large international program;
- individualized neoantigen therapy is no longer a purely speculative domain.

### Autogene cevumeran

Checked source:

- `https://clinicaltrials.gov/study/NCT05968326`

Confirmed signals:

- Phase 2 PDAC program;
- active recruiting international study;
- continued relevance of individualized RNA oncology workflows.

Design implication:

- OpenRNA bridge can remain a horizon module without being science-fiction, but it still must not define HomeGenome MVP scope.

## Competitor and analogue baseline

### Consumer genomics competitor checked directly

#### Sequencing.com

Checked source:

- `https://www.sequencing.com/`

Confirmed signals:

- consumer-facing 30x WGS offer;
- cloud-centered continuous reanalysis and report marketplace positioning;
- raw FASTQ, BAM and VCF download promise;
- privacy language used as a product differentiator.

Design implication:

- Sequencing.com is useful as a competitor baseline and UX/product framing counterexample.
- HomeGenome should consciously differentiate by being local-first, operator-controlled and evidence-centric.

### Sources that were partially unavailable in this pass

- direct fetch of the EPI2ME workflow marketing page returned 404;
- direct fetch of OpenCRAVAT docs returned 404;
- some paper landing pages on Nature and Lancet redirected to access or protection surfaces.

These are not blockers because the core architectural choices were still supportable from the official and public sources above plus the local donor material.

## Architecture Decisions Derived From The Extraction

### Adopt

1. Nextflow or equivalent workflow orchestrator as the default heavy-compute execution contract.
2. Phenopackets as the default portable case export model.
3. OpenRNA-style state machine and lineage design.

### Extend

1. OpenRNA registry pattern into `ReferenceBundleRegistry`, `AnalysisModalityRegistry`, `ModelActivationRegistry`.
2. MicroPhoenix verification and provenance discipline into HomeGenome docs and later runtime.

### Compose

1. ONT-specific tooling.
2. Multi-caller variant analysis.
3. AI interpretation ports.
4. Specialty modules like PGx, HLA, methylation, panel-specific analysis.

### Build

1. HomeGenome-native case and biosample control plane.
2. Artifact manifests and lineage graph.
3. QC and consensus gate layer.
4. Review and release packaging.
5. Local-only interoperability surfaces.

## What HomeGenome Should Avoid

1. Reimplementing mature workflow ecosystems.
2. Treating current bash scripts as the long-term system boundary.
3. Shipping AI interpretation as if it were clinically validated.
4. Letting the OpenRNA bridge collapse the distinction between diagnosis and therapy.
5. Drifting into a cloud subscription business model by default.

## Bottom Line

The best April 2026 architecture for HomeGenome is not a clone of any single donor.

It is a synthesis:

- **MicroPhoenix** provides architectural discipline and extraction method.
- **OpenRNA** provides the control-plane and governance pattern.
- **Nextflow + nf-core/sarek** provide the reproducible workflow baseline.
- **pVACtools** proves modular specialty-tool decomposition.
- **Phenopackets** provide the portable schema baseline.
- **AlphaGenome** defines the upper bound of research-use interpretation.
- **Sequencing.com** clarifies what HomeGenome should differentiate against.

That synthesis is the foundation for [../reference/architecture-skeleton-2026-04-21.md](../reference/architecture-skeleton-2026-04-21.md).