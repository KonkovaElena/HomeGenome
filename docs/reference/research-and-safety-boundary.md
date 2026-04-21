---
title: "HomeGenome Research And Safety Boundary"
status: "active"
version: "1.0.0"
last_updated: "2026-04-21"
tags: [homegenome, safety, boundary, medical, biosecurity]
mode: "reference"
---

# HomeGenome Research And Safety Boundary

## Purpose

Этот документ задаёт жёсткую boundary line для HomeGenome как публичного research repository. Его задача — уменьшить риск того, что проект будет воспринят как клинический сервис, терапевтический протокол или operational bioengineering manual.

## What HomeGenome Is

HomeGenome is:

- research documentation;
- architecture and workflow analysis;
- toolchain synthesis around local nanopore sequencing;
- publication and discussion surface for privacy-first genomics.

## What HomeGenome Is Not

HomeGenome is not:

- a medical device;
- a clinical diagnostic workflow;
- a substitute for a licensed clinician, genetic counselor or accredited laboratory;
- a patient-specific treatment engine;
- a repository for storing or reviewing real personal genomic data.

## Medical Boundary

1. Nothing in this repository should be used as a sole basis for diagnosis.
2. Nothing in this repository should be used as a sole basis for changing medication, dosage or treatment.
3. Any clinically significant genomic finding requires confirmation in an accredited setting.
4. Readers are expected to treat examples, toolchains and interpretations as research-grade material.

## Data Boundary

Do not use this repository to publish or request review of:

- personal genomes;
- BAM, CRAM, VCF, FASTQ or POD5 files from identifiable individuals;
- patient reports, pathology records or clinical attachments;
- credentials or infrastructure details from private sequencing environments.

## Biosecurity Boundary

HomeGenome may discuss sequencing, synthesis-adjacent futures and integration with OpenRNA. Those discussions are conceptual and architectural unless explicitly marked otherwise.

The repository should not evolve into:

- a step-by-step patient treatment manual;
- an unsafe synthesis playbook;
- an operational misuse guide for sensitive biological workflows.

When content approaches therapy, synthesis, delivery or dual-use risk, prefer:

1. conceptual explanation;
2. explicit caveats;
3. omission of unnecessary operational detail;
4. separate security review before publication.

## Contribution Rule

Contributors should avoid adding text that:

- overstates clinical readiness;
- blurs the line between architectural exploration and patient care;
- invites users to upload or expose real genomic data;
- turns future-looking therapy concepts into actionable instructions.

## Default Reader Guidance

If you are here because you want to understand the technology, start with [README.md](README.md) and the reference documents.

If you are here because you need medical interpretation of your own data, this repository is the wrong tool and the wrong venue.