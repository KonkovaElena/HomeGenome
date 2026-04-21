---
title: "HomeGenome GitHub Launch Checklist"
status: "active"
version: "1.0.0"
last_updated: "2026-04-21"
tags: [homegenome, github, launch, publication, checklist]
mode: "how-to"
---

# HomeGenome GitHub Launch Checklist

## Purpose

Этот документ закрывает последний локальный gap между текущим состоянием HomeGenome и реальной публикацией на GitHub. Он описывает:

1. рекомендуемые metadata для репозитория;
2. GitHub-side settings, которые нельзя подготовить локально;
3. sequence для первого push после завершения provenance review.

## Recommended Repository Identity

| Field | Recommended value |
| --- | --- |
| Repository name | `homegenome` |
| Short description | `Local-first genomics research repository for air-gapped nanopore sequencing, reproducible analysis workflows, and an early TypeScript control-plane scaffold.` |
| Visibility | `Public` only after provenance review is complete |
| Default branch | `main` |

## Suggested Topics

Add these repository topics after repo creation:

- `genomics`
- `bioinformatics`
- `nanopore`
- `oxford-nanopore`
- `nextflow`
- `typescript`
- `local-first`
- `data-sovereignty`
- `air-gapped`
- `event-sourcing`
- `research-software`
- `personal-genomics`
- `control-plane`

## GitHub UI Settings To Apply After Remote Creation

### General

1. Set the repository description and topics.
2. Keep Issues enabled.
3. Keep Wiki disabled until there is a real need for a second documentation surface.
4. Keep Projects optional; do not enable by default unless issue volume grows.
5. Keep Discussions optional; enable only if community interaction becomes real, not hypothetical.

### Security And Quality

1. Enable Private Vulnerability Reporting.
2. Enable secret scanning and push protection if available for the chosen plan.
3. Review the Security tab after the first push and confirm that `SECURITY.md` is detected.

### Branch Protection

1. Protect `main` after the first push.
2. Require pull requests for changes if more than one maintainer will edit the repo.
3. Require linear history only if the future workflow demands it.

## Local Preconditions Before First Push

Do not push until all P0 blockers below are cleared:

- [ ] provenance review for externally derived text is complete;
- [ ] Habr article has either passed editorial review or been excluded from the initial public snapshot;
- [ ] license metadata is consistent across `LICENSE`, `package.json` and `CITATION.cff`;
- [ ] no generated data, private genomes, `.bam`, `.vcf`, `.pod5` or credentials are present in the staged diff;
- [ ] README, audit and master plan still describe the repo accurately.

## First Push Sequence

Run these commands from `HomeGenome` after creating an empty GitHub repository:

```powershell
git remote add origin <YOUR_GITHUB_REPO_URL>
git add .
git commit -m "Initial public documentation baseline for HomeGenome"
git push -u origin main
```

## Immediate Post-Push Checks

After the first push, verify the following in the GitHub web UI:

1. README renders correctly and all relative links resolve.
2. GitHub detects `LICENSE`, `SECURITY.md` and issue templates.
3. No raw data, binaries or sensitive artifacts appeared in the repository tree.
4. `About` section shows the intended description and topics.
5. `Security` tab exposes private vulnerability reporting.

Exact suggested copy for the `About` section, first release text and short launch announcements is captured in [github-post-push-polish-2026-04-21.md](github-post-push-polish-2026-04-21.md).

## Optional But Recommended Next Iteration

1. Add lightweight docs CI for markdown link checking and style validation.
2. Create a social preview image only after the public narrative is stabilized.
3. Add release automation and SBOM generation when the repo moves beyond the initial public baseline.

## Launch Decision Rule

HomeGenome should be published only when the answer to both questions is `yes`:

1. Can a first-time visitor understand the repository without overreading or false clinical expectations?
2. Can the maintainer defend the provenance of every major public-facing document if asked in public?

If either answer is `no`, finish the provenance pass first and delay the public push.