---
title: "HomeGenome Intended Use"
status: "active"
version: "1.0.0"
last_updated: "2026-04-21"
tags: [homegenome, intended-use, genomics, boundary]
mode: "reference"
---

# HomeGenome Intended Use

## Current Repository State

HomeGenome is currently a docs-first research repository about local, air-gapped human genome sequencing and interpretation workflows.

At its current maturity, the repository is intended to:

- document architecture and workflow design;
- consolidate evidence about home and local nanopore genomics;
- define a future software skeleton for a local genomics control plane;
- clarify the boundary between sequencing analysis, interpretation, review and future research integrations.

## Intended Future Software Scope

If the project evolves into executable software, the intended software scope is:

> a local genomics operating layer for advanced personal, translational or research genomics workflows that coordinates biosample intake, sequencing-run lineage, reproducible analysis workflows, quality gates, interpretation modules, review decisions and portable export bundles.

## Intended Users

- bioinformatics engineers;
- genomics workflow operators;
- technically advanced self-hosting or citizen-science practitioners;
- translational research teams working in closed and operator-controlled environments.

## Intended Operating Context

- local-first or air-gapped environments;
- operator-controlled deployments;
- research, translational and advanced personal-genomics settings;
- environments where raw genomic data custody is expected to remain under user or site control.

## Primary Outputs

HomeGenome may eventually produce:

- structured case and biosample records;
- sequencing-run and artifact lineage manifests;
- workflow execution records;
- QC, consensus and interpretation packets;
- review-ready report bundles;
- portable exports such as Phenopacket-oriented summaries and file manifests.

## Not Intended For

HomeGenome is not intended for:

- autonomous diagnosis;
- patient-facing medical decision support;
- direct treatment selection;
- unsupervised therapeutic design or release;
- public upload, storage or review of real personal genomic data inside the repository.

## Boundary With OpenRNA

The OpenRNA connection is a research and horizon architecture surface.

It is not part of the current HomeGenome baseline and must not be read as:

- a ready-to-run therapy workflow;
- a home-treatment claim;
- a clinical manufacturing claim;
- evidence that HomeGenome is a medical device or therapeutic platform.

## Operating Rule

If a future contribution expands HomeGenome toward executable software, that change should remain compatible with this intended-use boundary or update this document explicitly in the same change set.