# HomeGenome

[English](README.md) | Русский

`HomeGenome` — локальный исследовательский репозиторий по секвенированию генома человека в изолированном контуре, воспроизводимым пайплайнам на базе Oxford Nanopore и раннему TypeScript-слою управления для операторских сценариев.

Это не медицинское изделие, не клинический рабочий процесс и не система для выбора лечения. Репозиторий задаёт исследовательскую и инженерную основу для локального, трассируемого геномного контура.

## Статус

- Тип проекта: docs-first исследовательский репозиторий с ранним исполняемым срезом.
- Текущая зрелость: архитектурный корпус плюс минимальный Node 24 / TypeScript runtime slice.
- Граница безопасности: только исследовательская и инженерная оценка.
- Публикационная готовность: базовая подготовка к GitHub выполнена, но часть GitHub-side настроек и provenance-проходов остаётся финализировать на стороне платформы.

Формальная граница intended use зафиксирована в [docs/reference/intended-use.md](docs/reference/intended-use.md).

## Что есть в репозитории

- корпус справочной и объясняющей документации по локальному nanopore sequencing и биоинформатическому стеку;
- ранний слой управления с жизненным циклом кейса, отслеживанием workflow dispatch и event-backed provenance;
- file-backed durable adapters с блокировками между процессами;
- явные порты для sequencing telemetry и adaptive sampling через ONT MinKNOW;
- переносимый контракт Case Export Bundle с RO-Crate metadata, PROV summary и DRS-подобными ссылками на артефакты.

## Быстрый старт

Требования:

- Node.js 24+
- npm 11+

Локальная проверка:

```bash
npm install
npm run typecheck
npm run verify:contracts
npm test
npm run test:coverage
npm run build
```

## Что уже реализовано в коде

Текущий кодовый слой в `src/` и `tests/` покрывает:

- жизненный цикл кейса и контроль переходов состояния;
- регистрацию биоматериалов, sequencing runs, артефактов и reference bundles;
- append-only audit trail для действий контура управления;
- workflow dispatch и tracking выполнения;
- file-backed durable storage для event и workflow state;
- ingestion sequencing telemetry;
- обновления adaptive sampling через явный порт `IMinKnowClient`;
- экспорт case bundle с RO-Crate metadata и PROV/DRS-совместимыми полями.

Чего пока нет:

- полноценного адаптера MinKNOW;
- полного слоя sequencing operations;
- клинически ориентированной устойчивости хранения и развёртывания.

## С чего читать

Если нужен короткий маршрут по репозиторию, начните с:

1. [docs/reference/intended-use.md](docs/reference/intended-use.md)
2. [docs/reference/architecture-skeleton-2026-04-21.md](docs/reference/architecture-skeleton-2026-04-21.md)
3. [docs/reference/case-export-bundle-contract.md](docs/reference/case-export-bundle-contract.md)
4. [docs/reference/homegenome-control-plane.openapi.yaml](docs/reference/homegenome-control-plane.openapi.yaml)
5. [docs/reference/standards-adoption-matrix-2026-04-22.md](docs/reference/standards-adoption-matrix-2026-04-22.md)
6. [docs/reference/pipeline-architecture.md](docs/reference/pipeline-architecture.md)
7. [docs/how-to/implementation-roadmap-2026-04-21.md](docs/how-to/implementation-roadmap-2026-04-21.md)
8. [docs/reference/sources-and-provenance.md](docs/reference/sources-and-provenance.md)

Полная карта документации: [docs/README.md](docs/README.md).

## Языковая политика

Основной корпус документации по-прежнему в значительной степени русскоязычный, потому что проект рос из локального исследовательского и архитектурного контура.

Публичные входные точки теперь разделены так:

- [README.md](README.md) — английский входной слой;
- [README.ru.md](README.ru.md) — русская версия для основной аудитории проекта;
- названия инструментов, стандартов и API сохранены на английском там, где это технически точнее.

## Границы безопасности и применения

`HomeGenome` не предназначен для:

- автономной диагностики;
- прямого выбора лечения;
- неконтролируемого терапевтического проектирования;
- публикации или обработки реальных идентифицируемых геномных данных внутри этого репозитория.

Связка с `OpenRNA` остаётся будущим, policy-gated архитектурным швом, а не частью текущей рабочей базы. См. [docs/explanation/openrna-bridge.md](docs/explanation/openrna-bridge.md).

## Структура репозитория

- `src/` — TypeScript runtime slice;
- `tests/` — regression suite на `node:test`;
- `docs/reference/` — границы, архитектура, provenance;
- `docs/explanation/` — длинные технические объяснения;
- `docs/research/` — датированные исследовательские заметки;
- `docs/how-to/` — практические маршруты реализации и публикации;
- `docs/evidence/` — аудиты и снимки evidence base.

## Community и citation

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [SECURITY.md](SECURITY.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [SUPPORT.md](SUPPORT.md)
- [CITATION.cff](CITATION.cff)

## Что ещё осталось до полного публичного вывода

- финальный provenance-проход по длинным текстам, которые опираются на внешние источники;
- GitHub-side настройка branch protection, private vulnerability reporting, repository topics и social preview;
- дальнейшее развитие runtime для устойчивых sample/run/artifact slices поверх текущего event и workflow baseline.

Актуальный publication audit: [docs/evidence/publication-readiness-audit-2026-04-21.md](docs/evidence/publication-readiness-audit-2026-04-21.md).
