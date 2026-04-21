# Security Policy

## Scope

HomeGenome is a research and documentation repository.

The public repository state should be treated as reference material and design documentation, not as a clinically validated genomics platform or a production medical system.

## Supported Versions

| Surface | Status | Notes |
| --- | --- | --- |
| current `main` branch | best-effort fixes | active documentation line |
| historical snapshots and external publication drafts | unsupported | may contain stale claims or superseded guidance |

## Reporting A Security Issue

Do not disclose secrets, unsafe workflow details, personal genomic data, exploit steps or sensitive biosecurity concerns in a public issue.

Use a private channel with the repository owner or maintainer.

When this repository is published on GitHub, Private Vulnerability Reporting should be enabled and used as the default path.

## What Counts As A Security Issue Here

- accidental inclusion of personal genomic data;
- leaked credentials, API keys or internal infrastructure details;
- unsafe publication of synthesis-ready or misuse-prone operational detail beyond the intended educational scope;
- build or workflow configuration that would expose private data after publication.

## Safe Disclosure Expectations

1. include the affected file or surface;
2. describe the risk without pasting sensitive payloads into public threads;
3. state whether the issue affects publication safety, user privacy, or downstream misuse risk;
4. avoid attaching real biological samples, genomes, or clinical records.