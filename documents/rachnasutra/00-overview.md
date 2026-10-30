# RachnaSutra AI Documentation

RachnaSutra AI is an open-source UI/UX design engineering and auditing agent. It ships 13 portable Agent Skills, led by **RachnaSutra Prime**, and a keyless command-line tool that audits front-end source code for accessibility, responsive design, design-system, content and performance risks. This documentation set is written for four audiences: decision makers, product and design leads, engineers, and open-source contributors.

> **Note:** This documentation describes version 0.1.0. Every capability is labelled **implemented**, **adapter**, **planned** or **not-available**. Nothing planned is described as shipped.

## Start here

| If you are... | Read |
|---|---|
| A decision maker or sponsor | [Executive summary](01-executive-summary.md), then [Legal and compliance](09-legal-and-compliance.md) |
| A product owner or designer | [Functional specification](02-functional-specification.md), then [User guide](05-user-guide.md) |
| A developer using the tool | [User guide](05-user-guide.md), then [Audit rules reference](06-audit-rules-reference.md) |
| An architect or reviewer | [Architecture](03-architecture.md), then [Technical reference](04-technical-reference.md) |
| A security or compliance reviewer | [Security and privacy](08-security-and-privacy.md), then [Testing and evidence](10-testing-and-evidence.md) |
| A contributor or maintainer | [Maintainer handbook](13-maintainer-handbook.md) |
| Looking for something specific | [FAQ and glossary](14-faq-and-glossary.md) |

## The documentation set

| # | Document | Purpose |
|---|---|---|
| 01 | [Executive summary](01-executive-summary.md) | What it is, why it matters, what is proven, what is not |
| 02 | [Functional specification](02-functional-specification.md) | Features, user journeys, requirements, acceptance criteria |
| 03 | [Architecture](03-architecture.md) | Components, data flow, design decisions, trade-offs |
| 04 | [Technical reference](04-technical-reference.md) | Modules, data model, algorithms, extension points |
| 05 | [User guide](05-user-guide.md) | Install, run, read reports, fix, verify, CI |
| 06 | [Audit rules reference](06-audit-rules-reference.md) | Every rule with rationale, example and limits |
| 07 | [Skills and agents](07-skills-and-agents.md) | The 13 skills and how Prime orchestrates them |
| 08 | [Security and privacy](08-security-and-privacy.md) | Threat model, controls, residual risk |
| 09 | [Legal and compliance](09-legal-and-compliance.md) | Licence, disclaimers, accessibility law, trademarks |
| 10 | [Testing and evidence](10-testing-and-evidence.md) | Real test results, sample reports, how to reproduce |
| 11 | [Deployment and CI](11-deployment-and-ci.md) | Local, CI and server use, exit codes, pipelines |
| 12 | [Roadmap and status](12-roadmap-and-status.md) | Honest status per capability and next milestones |
| 13 | [Maintainer handbook](13-maintainer-handbook.md) | Release, rule authoring, adapter authoring, docs build |
| 14 | [FAQ and glossary](14-faq-and-glossary.md) | Answers and terms |

## At a glance

<div class="cards">
<div class="card"><b>13</b><span>Agent Skills, led by RachnaSutra Prime</span></div>
<div class="card"><b>26</b><span>deterministic static audit rules</span></div>
<div class="card"><b>4</b><span>report formats: JSON, Markdown, HTML, SARIF 2.1.0</span></div>
<div class="card"><b>22/22</b><span>automated tests passing (see evidence)</span></div>
<div class="card"><b>0</b><span>runtime dependencies, no network, no telemetry</span></div>
<div class="card"><b>0</b><span>API keys required</span></div>
</div>

## How the documentation is built

The Markdown files in `documents/rachnasutra/` are the source of truth. Run `node scripts/build-docs.mjs` to regenerate the HTML site in `documents/rachnasutra/html/`. The HTML is self-contained, works offline, supports light and dark themes, keyboard navigation, search and printing, and can be hosted on any static site. See the [Maintainer handbook](13-maintainer-handbook.md).

## Document conventions

- **Confirmed** means detected by a deterministic pattern or a measurement.
- **Review required** means a heuristic signal that a person must check.
- **Not run** means the check was not performed; it is never counted as a pass.
- File references use `path:line`. Commands are shown in code blocks and can be copied with the Copy button in the HTML version.
