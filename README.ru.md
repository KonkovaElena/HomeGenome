# HomeGenome

English version: [README.md](README.md)
Русская версия: этот файл

HomeGenome — локальный genomics research repository про air-gapped секвенирование генома человека, воспроизводимые nanopore workflows и ранний TypeScript control plane scaffold для операторского управления без ухода в clinical-looking продуктовые обещания.

Это не медицинское изделие, не клинический workflow и не система для персональных лечебных решений. Репозиторий задаёт исследовательскую и инженерную базу для local genomics control plane.

## Статус

- Тип проекта: docs-first research repo с уже существующим code-bearing runtime slice.
- Текущая зрелость: архитектурный корпус плюс минимальный Node 24 / TypeScript control plane.
- Граница безопасности: research and technical evaluation only.
- Публикационный статус: локально проект подготовлен к GitHub, но provenance и GitHub-side настройки ещё требуют финального прохода.

Формальная граница intended use зафиксирована в [docs/reference/intended-use.md](docs/reference/intended-use.md).

## Что есть в репозитории

- reference и explanation corpus по локальному nanopore sequencing, bioinformatics toolchain и boundary между анализом, интерпретацией и review;
- ранний control plane scaffold с жизненным циклом кейса, workflow dispatch tracking и event-backed provenance;
- file-backed durable adapters с cross-process locking для текущей локальной persistence baseline;
- явные порты для sequencing telemetry и adaptive sampling через ONT MinKNOW.
- переносимый Case Export Bundle контракт с RO-Crate metadata, PROV summary и DRS-like ссылками на артефакты.

## Быстрый старт

Требования:

- Node.js 24+
- npm 11+

Локальная проверка:

```bash
npm install
npm test
npm run build
```

## Что уже реализовано в runtime slice

Код в `src/` и `tests/` пока сознательно узкий. Сейчас он покрывает:

- case lifecycle и state-machine enforcement;
- регистрацию biosamples, sequencing runs, artifacts и reference bundles;
- append-only audit trail для действий control plane;
- workflow dispatch и workflow-run tracking;
- file-backed durability для event и workflow state;
- ingestion sequencing telemetry;
- adaptive sampling updates через явный `IMinKnowClient` port.
- экспорт case bundle с RO-Crate metadata и PROV/DRS-совместимыми полями.

Пока здесь нет полноценного MinKNOW adapter, полного sequencing operations layer и clinical-grade durability.

## С чего читать

Если нужен короткий путь по репозиторию, начните с этого набора:

1. [docs/reference/intended-use.md](docs/reference/intended-use.md)
2. [docs/reference/architecture-skeleton-2026-04-21.md](docs/reference/architecture-skeleton-2026-04-21.md)
3. [docs/reference/case-export-bundle-contract.md](docs/reference/case-export-bundle-contract.md)
4. [docs/reference/homegenome-control-plane.openapi.yaml](docs/reference/homegenome-control-plane.openapi.yaml)
5. [docs/reference/standards-adoption-matrix-2026-04-22.md](docs/reference/standards-adoption-matrix-2026-04-22.md)
6. [docs/reference/pipeline-architecture.md](docs/reference/pipeline-architecture.md)
7. [docs/how-to/implementation-roadmap-2026-04-21.md](docs/how-to/implementation-roadmap-2026-04-21.md)
8. [docs/reference/sources-and-provenance.md](docs/reference/sources-and-provenance.md)

Полная карта документов находится в [docs/README.md](docs/README.md).

## Языковая политика

Глубокий документационный корпус сейчас остаётся в основном русскоязычным. Это не случайность: проект вырос из исследовательского и архитектурного контура, который изначально вёлся на русском.

Публичные entrypoints теперь разведены так:

- [README.md](README.md) — английский входной слой;
- [README.ru.md](README.ru.md) — русская версия для основного корпуса и аудитории;
- названия инструментов, стандартов и API сохранены на английском там, где это технически точнее.

## Safety и research boundary

HomeGenome не предназначен для:

- автономной диагностики;
- прямого выбора лечения;
- unsupervised therapeutic design;
- публичной работы с реальными персональными геномными данными внутри этого репозитория.

Связка с OpenRNA остаётся future, policy-gated architectural surface, а не частью текущего baseline. См. [docs/explanation/openrna-bridge.md](docs/explanation/openrna-bridge.md).

## Структура репозитория

- `src/` — TypeScript control-plane scaffold
- `tests/` — `node:test` regression suite
- `docs/reference/` — boundaries, architecture, provenance
- `docs/explanation/` — длинные технические объяснения
- `docs/research/` — датированные research memos
- `docs/how-to/` — implementation и publication workflows
- `docs/evidence/` — audits и evidence snapshots

## Community и citation

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [SECURITY.md](SECURITY.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [SUPPORT.md](SUPPORT.md)
- [CITATION.cff](CITATION.cff)

## Что ещё осталось до полного public launch

- финальный provenance pass для длинных текстов, опирающихся на внешние источники;
- GitHub-side настройка branch protection, private vulnerability reporting, repository topics и social preview;
- optional runtime follow-up: durable stores для sample/run/artifact slices beyond the current workflow and event baseline.

Актуальный publication audit находится в [docs/evidence/publication-readiness-audit-2026-04-21.md](docs/evidence/publication-readiness-audit-2026-04-21.md).