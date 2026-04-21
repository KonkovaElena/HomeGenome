---
title: "HomeGenome Documentation Master Plan"
status: "active"
version: "1.0.0"
last_updated: "2026-04-21"
tags: [homegenome, documentation, github, roadmap, diataxis]
mode: "how-to"
---

# HomeGenome Documentation Master Plan

## Goal

Превратить HomeGenome из сильной, но плоской директории с исследовательскими markdown-файлами в самостоятельный GitHub-ready documentation repository с понятной информационной архитектурой, прозрачной source provenance, корректными community health surfaces и безопасной publication boundary.

## Non-goals

1. Не превращать HomeGenome в clinical product или executable diagnostics platform.
2. Не обещать медицинскую точность там, где проект остаётся research-grade.
3. Не вычищать историю монорепозитория задним числом в рамках этой задачи.
4. Не публиковать remote автоматически без финального provenance review.

## Current-State Diagnosis

| Area | Current state | Required outcome |
| --- | --- | --- |
| Repository identity | Corpus exists, but repo identity was implicit | Explicit GitHub-facing identity, audience, scope and boundaries |
| Diataxis separation | Modes mixed in flat root | Clear split between router, reference, explanation, article and evidence surfaces |
| Community health | Missing | Present and repo-specific |
| Source provenance | Partially present, inconsistent | Explicit, normalized, auditable |
| Publication safety | No standalone git, no audit | Separate git, publication checklist, blockers registry |
| Contribution workflow | Undefined | Docs-first, evidence-first contribution rules |

## Dominant-Mode Classification Of Existing Corpus

| Current file | Dominant mode | Future role | Recommended long-term path |
| --- | --- | --- | --- |
| `README.md` | tutorial/router | Repo landing page | keep at root |
| `docs/reference/pipeline-architecture.md` | reference | canonical technical reference | `docs/reference/pipeline-architecture.md` |
| `docs/explanation/home-sequencing-analysis.md` | explanation | long-form domain analysis | `docs/explanation/home-sequencing-analysis.md` |
| `docs/research/2026-ai-research-report.md` | explanation | focused research memo | `docs/research/2026-ai-research-report.md` |
| `docs/explanation/openrna-bridge.md` | explanation | concept architecture / horizon doc | `docs/explanation/openrna-bridge.md` |
| withheld Habr-oriented article asset | article | publication asset, not SSOT | keep outside the active snapshot until separate review is complete |

## Workstreams

### Workstream A. Repository Baseline

| ID | Priority | Action | Output | Acceptance criteria |
| --- | --- | --- | --- | --- |
| A1 | P0 | Initialize separate git boundary for `HomeGenome` | standalone local repo | `git status` works from `HomeGenome` independently of parent repo |
| A2 | P0 | Add repo-local `.gitignore` for sequencing outputs, caches and sensitive artifacts | ignore policy | raw data and generated bioinformatics outputs are not accidentally staged |
| A3 | P0 | Add `LICENSE` and health files | governance baseline | repo has minimal public OSS hygiene surfaces |
| A4 | P0 | Add issue and PR templates | collaboration baseline | external users have a clear intake path |

### Workstream B. Landing And Navigation

| ID | Priority | Action | Output | Acceptance criteria |
| --- | --- | --- | --- | --- |
| B1 | P0 | Rewrite root README as GitHub landing page | visitor-oriented README | README answers what, why, for whom, how to start, where to get help |
| B2 | P1 | Add explicit reading order and doc map | navigation in README or dedicated map | new visitor can choose architecture, explanation or article path in under 30 seconds |
| B3 | P1 | Mark article surfaces as secondary to SSOT docs | clearer hierarchy | Habr article no longer competes with technical reference docs |

### Workstream C. Source Provenance And Academic Discipline

| ID | Priority | Action | Output | Acceptance criteria |
| --- | --- | --- | --- | --- |
| C1 | P0 | Build a source provenance register for each major document | `docs/reference/sources-and-provenance.md` or equivalent future surface | each core doc lists its primary external basis and editorial status |
| C2 | P0 | Review all text that explicitly derives from `How I Sequenced My Genome at Home` | provenance review pass | public repo contains only independently written analysis or properly scoped secondary material |
| C3 | P1 | Normalize bibliography style across documents | consistent references | DOI, official URLs and vendor attributions follow one style |
| C4 | P1 | Label vendor numbers as vendor-supplied where applicable | claim hygiene | readers can distinguish reproduced facts from vendor claims |
| C5 | P1 | Separate fact, recommendation and forecast language | rhetorical hygiene | speculative statements are visibly different from current-state statements |

### Workstream D. Content Surgery By Document

| ID | Priority | Surface | Required work | Acceptance criteria |
| --- | --- | --- | --- | --- |
| D1 | P1 | `docs/reference/pipeline-architecture.md` | Normalize versions, clarify which commands are reference vs tested examples, add provenance notes for tool-version claims | readers know what is canonical architecture and what still requires environment verification |
| D2 | P1 | `docs/explanation/home-sequencing-analysis.md` | Tighten long-form prose, normalize bibliography, label future-looking claims, keep medical disclaimer consistent | explanation doc reads as an academic review rather than mixed review + manifesto |
| D3 | P1 | `docs/research/2026-ai-research-report.md` | Add explicit scope note: Q1 2026 snapshot, not evergreen AI benchmark | report becomes stable as a dated research memo |
| D4 | P1 | `docs/explanation/openrna-bridge.md` | Strengthen “conceptual architecture” boundary and biosecurity caveats | no reader mistakes the document for an operational therapy protocol |
| D5 | P0 | withheld Habr-oriented article asset | Run separate editorial and provenance review before any public inclusion | article remains outside the active snapshot until the review is complete |

### Workstream E. Documentation Topology Refactor

| ID | Priority | Action | Output | Acceptance criteria |
| --- | --- | --- | --- | --- |
| E1 | P2 | Move from flat root to `docs/reference`, `docs/explanation`, `docs/research`, `docs/articles` | clearer topology | dominant mode is obvious from path alone |
| E2 | P2 | Keep backward-compatibility stubs or links if path churn matters | stable navigation | no dead internal links after moves |
| E3 | P2 | Add a concise local docs map after refactor | discoverability layer | repo remains scannable even as file count grows |

### Workstream F. Safety, Ethics And Public Boundary

| ID | Priority | Action | Output | Acceptance criteria |
| --- | --- | --- | --- | --- |
| F1 | P0 | Standardize non-medical disclaimer across landing and high-risk docs | consistent boundary language | clinical-looking sections always contain the same boundary |
| F2 | P1 | Add explicit “not for patient treatment” framing to OpenRNA bridge and therapy-adjacent sections | safer explanation layer | no direct therapeutic instruction remains without strong conceptual framing |
| F3 | P1 | Add a short ethics and biosafety policy surface | public responsibility statement | repo makes expectations explicit for sensitive use cases |

### Workstream G. Community And Collaboration

| ID | Priority | Action | Output | Acceptance criteria |
| --- | --- | --- | --- | --- |
| G1 | P0 | Define contribution rules for docs, sources and claims | `CONTRIBUTING.md` | contributors know evidence bar and scope constraints |
| G2 | P0 | Define support triage paths | `SUPPORT.md` | visitors know where to ask for docs help and what is out of scope |
| G3 | P0 | Define vulnerability path | `SECURITY.md` | no public issue is required for sensitive disclosures |
| G4 | P1 | Add citation/contribution etiquette for future external contributors | contributing policy expansion | new claims enter the repo with auditable evidence |

### Workstream H. GitHub Publication Control Plane

| ID | Priority | Action | Output | Acceptance criteria |
| --- | --- | --- | --- | --- |
| H1 | P0 | Prepare repo locally for first push | local git, health files, ignore rules | repo can be pushed without structural blockers |
| H2 | P1 | Create remote repository and set description/topics | GitHub repo metadata | repo card explains scope in one sentence |
| H3 | P1 | Enable private vulnerability reporting | GitHub setting | security surface exposes private reporting path |
| H4 | P1 | Configure branch protection after first push | GitHub setting | main branch is not editable without review by accident |
| H5 | P2 | Add optional CI for markdown lint, link checking and docs structure | lightweight automation | public repo has a minimal docs-only quality gate |

## Immediate Sequence Of Execution

### Phase 0. Baseline setup

1. Create standalone local git.
2. Add `.gitignore`.
3. Add health files and templates.
4. Rewrite README.

### Phase 1. Audit and boundary cleanup

5. Complete publication audit.
6. Review Habr article for provenance risk.
7. Mark concept-only surfaces more strictly.

### Phase 2. Citation and provenance normalization

8. Build a unified bibliography policy.
9. Attach official URLs and DOI where possible.
10. Distinguish vendor claim vs independently verified fact.

### Phase 3. Topology refactor

11. Move docs into a Diataxis-friendly `docs/` tree.
12. Keep router pages short and clear.
13. Add stub redirects or references if external links already exist.

### Phase 4. Public push readiness

14. Create GitHub remote.
15. Enable repo settings and PVR.
16. Perform first public push only after provenance blockers are cleared.

## Definition Of Done

HomeGenome documentation work can be considered complete for `Standard research documentation repository` publication when all of the following are true:

1. README is enough for a first-time visitor to understand project scope in under a minute.
2. Every active document has one dominant mode and a clear place in the navigation.
3. Every major external claim has provenance strong enough for a public research repo.
4. Community health files exist and are repo-specific.
5. Personal genomic data, generated outputs and heavy artifacts are excluded by default.
6. Article-like outreach text is clearly separated from technical SSOT.
7. Separate git boundary exists and remote publication requires no structural cleanup.

## What This Task Already Covers

- repository baseline;
- GitHub-facing README;
- publication audit;
- documentation master plan;
- community health and collaboration surfaces;
- separate local git initialization.

## What The Next Iteration Should Focus On

1. provenance cleanup for externally derived text;
2. bibliography normalization;
3. path refactor into a `docs/` tree;
4. optional CI for docs-only publication quality.