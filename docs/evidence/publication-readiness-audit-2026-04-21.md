---
title: "HomeGenome Publication Readiness Audit"
status: "active"
version: "1.0.0"
last_updated: "2026-04-21"
tags: [homegenome, github, publication, audit, documentation]
mode: "evidence"
---

# HomeGenome Publication Readiness Audit

## Scope

Этот аудит оценивает текущую готовность HomeGenome к выносу в отдельный публичный GitHub-репозиторий. Оценка основана на фактическом состоянии директории `HomeGenome` на 2026-04-21 и на актуальных GitHub Docs и локальном publication protocol.

## Метод

Проверены:

- состав corpus и роль каждого markdown-файла;
- наличие или отсутствие community health surfaces;
- структура README с точки зрения GitHub landing page;
- публикационные риски: source provenance, legal/copyright ambiguity, medical framing, missing governance;
- техническая готовность к отдельному git-контуру.

## Corpus Snapshot

| Surface | Type | Assessment |
| --- | --- | --- |
| README corpus | router | Был содержательным, но не выполнял роль GitHub landing page: не хватало статуса, аудитории, community links и publication lane. |
| Pipeline architecture | reference | Высокая техническая ценность, есть tooling matrix, QC gates, bash pipeline, roadmap. |
| Sequencing analysis | explanation | Сильный обзорный документ с библиографией, но высока плотность claims, которые нужно унифицировать и лучше маркировать по provenance. |
| Academic research report | explanation | Компактный high-signal обзор ИИ-моделей, полезен как отдельный research memo. |
| OpenRNA bridge | explanation | Сильная vision-architecture связка, но требует осторожного позиционирования как концептуального горизонта, а не текущей реализации. |
| Habr article | article | Полезна как outreach asset, но перед публичным репозиторием требует отдельной source provenance и copyright review. |

## Strengths

1. Проект уже обладает насыщенным высокосигнальным knowledge corpus, а не пустым GitHub scaffold.
2. Архитектурный уровень выше среднего: есть layered thinking, quality gates, cost model, integration horizon и tool compatibility view.
3. Материалы хорошо синтезируют genomics, wet lab, bioinformatics, AI interpretation и privacy-first framing.
4. В проекте есть явная сквозная идея: local genomics as sovereign infrastructure.
5. В sequencing analysis уже присутствует библиография и попытка отделить present-state от future forecast.

## Gaps Before This Task

1. Не было отдельного git-контура для HomeGenome как самостоятельного проекта.
2. Не было `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SUPPORT.md`, issue templates и PR template на уровне самой директории.
3. README не давал visitor-ориентированный обзор по стандарту GitHub: what, why, get started, support, contribution path.
4. Не было формального publication audit и поэтапного documentation roadmap.
5. Не было repo-local `.gitignore` для тяжёлых bioinformatics outputs и персональных данных.

## High-Risk Publication Issues

### 1. Source provenance and copyright ambiguity

В corpus есть явная опора на внешнюю публикацию `How I Sequenced My Genome at Home` и на vendor/research materials. Перед публичной публикацией нужно отдельно подтвердить:

- что все тексты являются самостоятельным пересказом, анализом или синтезом, а не близким пересобранным изложением первоисточника;
- что у Habr-oriented narrative нет участков, которые стоит переписать более явно в собственный голос;
- что vendor benchmarks и product claims помечены как vendor-provided, если они не были independently reproduced.

### 2. Medical interpretation boundary

Проект содержит клинически чувствительные темы: BRCA, HLA, pharmacogenomics, incidental findings, mRNA therapy horizon. Публичный репозиторий должен удерживать чёткую границу:

- research and education only;
- no medical advice;
- no operational guidance for patient treatment;
- no invitation to act on genomic findings without clinical confirmation.

### 3. Claims density versus citation density

Документы содержат много чисел, сроков, product claims и future statements. До public-ready academic standard нужно:

- унифицировать стиль библиографии;
- добавить DOI/official URLs там, где это возможно;
- разделить факт, vendor claim, recommendation и forecast.

## Readiness Matrix

| Area | Before task | After task | Comment |
| --- | --- | --- | --- |
| Standalone git boundary | red | green | Отдельный локальный git-контур инициализируется в этой задаче. |
| README landing quality | red | green | README now reflects the actual docs topology, runtime slice and publication boundary. |
| Community health | red | green | Базовые governance files и templates добавлены. |
| Data/output hygiene | red | green | Repo-local `.gitignore` добавлен. |
| Source provenance | red | amber | Основной article blocker выведен из active snapshot, но full provenance normalization ещё не завершён. |
| Medical boundary clarity | amber | amber | Базовые disclaimers усилены, но нужен repo-wide consistency pass. |
| Academic citation discipline | amber | green | `CITATION.cff` added and normalized; final remote URL fields remain post-remote work. |
| Workflow security baseline | red | green | CI, pinned dependency review and CodeQL are now present in the local repo snapshot. |
| GitHub-side settings | red | red | Это остаётся post-local action: remote, branch protection, PVR, topics, social preview. |

## Recommended Publication Strategy

### Recommended lane

`Standard research documentation repository`, а не `production biotech system` и не `portfolio-only landing page`.

### Why this lane

1. Corpus уже достаточно глубокий для самостоятельного research repo.
2. Основная ценность проекта — документация, архитектура и synthesis, а не executable product.
3. Публикация должна emphasise reference and explanation surfaces, а не создавать ложное ощущение clinical readiness.

## Concrete Outputs Added In This Task

1. GitHub-facing README.
2. Publication audit.
3. Detailed documentation master plan.
4. `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SUPPORT.md`.
5. Issue templates and PR template.
6. Repo-local `.gitignore` for sequencing outputs and sensitive/generated data.
7. Separate local git initialization for `HomeGenome`.
8. `CITATION.cff`, `CODEOWNERS`, pinned dependency-review workflow and CodeQL workflow.
9. File-backed durable adapters for event storage, workflow dispatch storage and workflow run storage.

## Open Blockers Before Real Public Push

1. Confirm legal and editorial ownership of all externally derived text.
2. Normalize bibliography and external source links into a single documented style.
3. Keep the Habr-oriented article asset excluded from the active repository snapshot until a separate editorial and provenance review is complete.
4. Add final repository URL fields to `CITATION.cff` once the canonical GitHub remote is created.
5. Configure GitHub-side settings after remote creation.

## Final Assessment

HomeGenome теперь можно считать `locally GitHub-prepared with a code-bearing local runtime baseline, but not yet fully publication-cleared`.

Это хорошее состояние для следующего шага: создать remote-репозиторий, выполнить provenance cleanup по master plan и только потом делать публичный push. Для runtime-линии следующий логичный шаг — durable adapters для sample/run/artifact/reference stores или переход к QC layer.