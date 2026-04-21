---
title: "HomeGenome GitHub Post-Push Polish"
status: "active"
version: "1.0.0"
last_updated: "2026-04-21"
tags: [homegenome, github, metadata, launch, release]
mode: "how-to"
---

# HomeGenome GitHub Post-Push Polish

## Purpose

This document captures the exact post-push copy prepared for the public GitHub repository at:

- `https://github.com/KonkovaElena/HomeGenome`

It is the maintainer-facing source for the GitHub `About` section, the first release draft, and the first public launch announcement.

## Repository Description

Use this as the GitHub repository description:

> Local-first genomics research repository for air-gapped nanopore sequencing, reproducible analysis workflows, and an early TypeScript control-plane scaffold.

## Suggested Topics

Use these repository topics:

- `genomics`
- `bioinformatics`
- `nanopore`
- `oxford-nanopore`
- `nextflow`
- `typescript`
- `local-first`
- `air-gapped`
- `event-sourcing`
- `research-software`
- `personal-genomics`
- `control-plane`

## Release Draft

### Suggested tag

- `v0.1.0`

### Suggested release title

- `HomeGenome v0.1.0 — public baseline`

### Suggested release text

HomeGenome is now public as a docs-first genomics research repository with an early local control-plane scaffold.

This first public baseline includes:

- a reference corpus on local and air-gapped nanopore sequencing workflows;
- an architecture skeleton for a future genomics control plane;
- a minimal TypeScript runtime slice with case lifecycle management, workflow dispatch tracking, append-only audit events, and file-backed durable adapters;
- sequencing telemetry and adaptive sampling control seams through explicit ports;
- public repository baseline files such as `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, issue templates, CI, dependency review, and CodeQL.

Current project boundary:

- research and technical evaluation only;
- not a medical device;
- not a clinical workflow;
- not a personal treatment system.

Current next steps:

- provenance tightening for externally derived long-form text;
- GitHub-side branch protection and private vulnerability reporting;
- expansion of durable stores beyond the current workflow and event slice.

Start with:

1. `README.md`
2. `README.ru.md`
3. `docs/reference/intended-use.md`
4. `docs/reference/architecture-skeleton-2026-04-21.md`
5. `docs/how-to/implementation-roadmap-2026-04-21.md`

## Launch Announcement

### English

HomeGenome is now public on GitHub.

It is a local-first genomics research repository focused on air-gapped nanopore sequencing, reproducible analysis workflows, and an early TypeScript control-plane scaffold for operator-driven genomics automation.

The repository is docs-first today, but it already includes a tested runtime slice with event-backed case lifecycle management, workflow tracking, file-backed durability, sequencing telemetry, and explicit MinKNOW/Nextflow integration seams.

Repository: `https://github.com/KonkovaElena/HomeGenome`

### Russian

HomeGenome теперь открыт на GitHub.

Это local-first genomics research repository про air-gapped nanopore sequencing, воспроизводимые analysis workflows и ранний TypeScript control plane scaffold для операторского управления геномным пайплайном.

Сегодня проект остаётся docs-first, но в репозитории уже есть протестированный runtime slice: lifecycle кейса, workflow tracking, event-backed provenance, file-backed durability, sequencing telemetry и явные integration seams для MinKNOW и Nextflow.

Репозиторий: `https://github.com/KonkovaElena/HomeGenome`

## Application Note

`gh` CLI was not available in the local environment during preparation, so the description and topics were prepared here as exact copy rather than applied automatically through the GitHub API.