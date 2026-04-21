---
title: "HomeGenome Sources And Provenance Register"
status: "active"
version: "1.0.0"
last_updated: "2026-04-21"
tags: [homegenome, provenance, sources, publication, research]
mode: "reference"
---

# HomeGenome Sources And Provenance Register

## Purpose

Этот документ фиксирует происхождение основных HomeGenome surfaces перед публичной GitHub-публикацией. Он нужен для трёх задач:

1. отличать самостоятельный анализ от текста, основанного на внешнем первоисточнике;
2. отделять current fact, vendor claim и future forecast;
3. делать publication blockers по provenance видимыми до первого public push.

## Status Vocabulary

| Status | Meaning |
| --- | --- |
| `cleared` | Документ в текущем виде рассматривается как самостоятельный repo-authored surface; обычная source hygiene всё ещё обязательна. |
| `review-needed` | Документ пригоден для локальной работы, но перед public push нужен provenance review или editorial tightening. |
| `high-review-needed` | Документ особенно сильно зависит от внешнего narrative/source corpus или содержит claims, требующие отдельной проверки перед публикацией. |
| `withheld` | Surface сознательно исключён из активного репозитория или initial public snapshot до завершения отдельного review. |

## Document Register

| Document | Dominant mode | Main source basis | Current status | Why |
| --- | --- | --- | --- | --- |
| `README.md` | tutorial/router | repo-authored synthesis of current corpus | `cleared` | Новый landing page написан как навигационный слой над внутренними документами. |
| `docs/reference/pipeline-architecture.md` | reference | ONT toolchain docs, bioinformatics tooling references, repo-authored system synthesis | `review-needed` | Высокая ценность и самостоятельная структура, но версии инструментов и command examples перед public push нужно точечно сверить с official docs. |
| `docs/explanation/home-sequencing-analysis.md` | explanation | анализ домашнего sequencing stack + сильная опора на external article and 2026 ecosystem sources | `review-needed` | Документ уже содержит библиографию, но плотность claims и часть риторики требуют source normalization и clearer separation of facts vs forecasts. |
| `docs/research/2026-ai-research-report.md` | explanation | Q1 2026 papers and announcements around AlphaGenome, Evo 2, Clair3 v2.0 | `cleared` | Это короткий research memo с явным временным срезом и меньшим narrative debt. |
| `docs/reference/architecture-skeleton-2026-04-21.md` | reference | repo-authored synthesis of MicroPhoenix extraction, OpenRNA patterns and April 2026 external docs | `cleared` | Документ создан как самостоятельный synthesis surface с явным указанием donor and external evidence classes. |
| `docs/evidence/extraction-and-sota-baseline-2026-04-21.md` | evidence | repo-authored extraction summary plus public-source baseline for April 2026 | `cleared` | Документ фиксирует donor extraction и внешний evidence trail как отдельный evidence surface. |
| `docs/explanation/openrna-bridge.md` | explanation | repo-authored conceptual bridge between HomeGenome and OpenRNA | `cleared` | Документ был перепозиционирован как horizon architecture with explicit safety and intended-use boundaries. |
| `docs/reference/intended-use.md` | reference | repo-authored intended-use boundary for HomeGenome | `cleared` | Документ описывает текущую docs-first границу и будущий software scope без overclaiming. |
| `withheld Habr-oriented article asset` | article | explicitly based on `How I Sequenced My Genome at Home` plus 2026 source synthesis | `withheld` | Article surface intentionally removed from the active repository snapshot until separate editorial and copyright-sensitive review is complete. |
| `docs/evidence/publication-readiness-audit-2026-04-21.md` | evidence | repo-authored audit of local state | `cleared` | Основан на текущем состоянии директории и GitHub/docs protocol review. |
| `docs/how-to/documentation-master-plan-2026-04-21.md` | how-to | repo-authored planning surface | `cleared` | Это внутренний roadmap document, не зависящий от спорных narrative sources. |
| `docs/how-to/implementation-roadmap-2026-04-21.md` | how-to | repo-authored staged implementation plan for the software baseline | `cleared` | Документ выводит skeleton architecture в поэтапный implementation sequence без premature code claims. |
| `docs/how-to/github-launch-checklist-2026-04-21.md` | how-to | GitHub Docs and local publication protocol | `cleared` | Operational checklist derived from platform guidance and local repo state. |

## External Source Families Already Embedded In The Corpus

### Family A. Primary narrative source

- `How I Sequenced My Genome at Home`.

Use in HomeGenome:

- provides the original practical story arc and several hands-on failure modes;
- strongly influences the Habr article;
- informs parts of the long-form sequencing analysis.

Publication rule:

- keep derivative narrative clearly identified as analysis, commentary or article adaptation;
- avoid sentence-level closeness to the primary source in public repo content;
- prefer original synthesis in README and reference surfaces.

### Family B. Official vendor and project docs

Examples already referenced inside the corpus:

- Oxford Nanopore product and protocol surfaces;
- Dorado and HERRO GitHub repositories;
- tool documentation for minimap2, samtools, Clair3, Sniffles2 and others.

Publication rule:

- tool versions and platform claims should be treated as time-bound;
- where possible, cite official docs or release sources rather than secondary summaries.

### Family C. 2026 research papers and announcements

Examples already named inside the corpus:

- AlphaGenome;
- Evo 2;
- AlphaMissense;
- Clair3 v2.0 migration claims;
- clinical and HLA-related 2026 updates.

Publication rule:

- distinguish peer-reviewed publication, preprint, vendor announcement and conference-style claim;
- keep dated claims explicitly date-scoped.

## Claim Classes Used In HomeGenome

| Claim class | Meaning | How it should appear publicly |
| --- | --- | --- |
| `current fact` | concrete statement about a tool, protocol, publication or regulation at a given date | cite primary or official source when practical |
| `vendor claim` | benchmark or capability figure supplied by a vendor or project maintainer | mark as vendor-provided if not independently reproduced |
| `repo recommendation` | HomeGenome-specific judgment or architectural recommendation | keep visibly normative, not disguised as universal fact |
| `future forecast` | horizon 2031-2036 or speculative next-wave architecture | label as forecast, not current capability |

## Immediate Provenance Blockers Before Public Push

1. Normalize bibliography style in `docs/explanation/home-sequencing-analysis.md`.
2. Check that `docs/reference/pipeline-architecture.md` marks command blocks as reference implementation unless independently rerun in the intended environment.
3. Tighten safety framing in `docs/explanation/openrna-bridge.md`.
4. Add official links and DOI where currently only text labels exist.
5. Keep the Habr-oriented article asset out of the active snapshot until separate review is complete.

## Recommended Next Pass Order

1. `docs/explanation/home-sequencing-analysis.md`
2. `docs/reference/pipeline-architecture.md`
3. `docs/explanation/openrna-bridge.md`

## Operating Rule

If a future contributor adds a major external claim, benchmark or derived narrative surface, they should update this file in the same change set. Provenance is an active repository surface, not a one-time audit artifact.