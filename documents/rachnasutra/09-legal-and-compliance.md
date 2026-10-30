# Legal and compliance

> **Important:** This page is an engineering and project-policy statement, not legal advice. Consult a qualified lawyer for your jurisdiction before relying on it, especially for accessibility compliance and licensing questions.

## Licence

RachnaSutra AI is licensed under the **Apache License, Version 2.0**. The full text is in `LICENSE`.

| You may | Conditions |
|---|---|
| Use, copy, modify and distribute, including commercially | Include the licence and the `NOTICE` file; mark changed files |
| Receive a patent licence from contributors for their contributions | The licence terminates for you if you start patent litigation over the work |
| Use in closed-source products | Keep attribution; no trademark rights are granted |

The software is provided "as is", without warranty. Contributors are not liable for damages arising from its use (Apache-2.0 sections 7 and 8).

Copyright 2026 Vatsal Shah. Contributions are accepted under the same licence (Apache-2.0 section 5).

## Dependencies and third-party licences

| Item | Licence | Scope |
|---|---|---|
| Runtime dependencies | None | Nothing third-party is bundled at runtime |
| `typescript` | Apache-2.0 | Development only |
| `@types/node` | MIT | Development only |
| WCAG success criteria names and numbers | W3C document licence | Referenced by identifier only; no W3C text is copied |
| Agent Skills specification | Referenced only | Format followed; no text copied |

Check `package-lock.json` for the exact transitive development dependencies before redistributing source.

## Trademarks and independence

RachnaSutra AI is an independent project. It is not affiliated with or endorsed by W3C, Deque Systems, Anthropic, OpenAI, Google, GitHub, Microsoft, Cursor, Windsurf, Kiro or any other vendor. Names such as Claude Code, Cursor, Codex, GitHub Copilot and Gemini CLI belong to their owners and are used only to describe compatibility. ArchSutra AI and VigilSutra AI are separate products by the same author.

Before wide promotion, search trademark and domain databases in the jurisdictions you care about for the names "RachnaSutra", "ArchSutra" and "VigilSutra". The project has not performed a trademark clearance.

## What the tool does and does not establish

| The tool | Does | Does not |
|---|---|---|
| Static audit | Report patterns and measured colour pairs with evidence | Certify conformance with WCAG, ADA, Section 508, EN 301 549, the European Accessibility Act or any standard |
| Reports | Identify likely barriers to review | Constitute a VPAT, ACR or legal opinion |
| Skills | Guide an assistant to a documented process | Replace testing by people with disabilities or by qualified specialists |

Automated testing, in any tool, finds only a portion of accessibility issues. Conformance claims need manual evaluation, ideally including assistive-technology users.

## Accessibility law context (orientation only)

Accessibility obligations may apply to websites and apps depending on country, sector and customer base. Examples include the Americans with Disabilities Act and Section 508 in the United States, the European Accessibility Act and EN 301 549 in the European Union, the Equality Act in the United Kingdom, and the Rights of Persons with Disabilities Act and Guidelines for Indian Government Websites in India. Requirements, deadlines and enforcement differ. This project does not interpret them.

**Recommended practice:** use RachnaSutra to find and fix issues early, record the manual testing you do, and have a specialist review any public conformance statement.

## Privacy and data protection

The CLI does not collect, transmit or store personal data. Reports may contain code excerpts, which could include personal data if it is present in source. Treat reports as confidential. If you process personal data with AI IDEs, your obligations (for example under GDPR or India's Digital Personal Data Protection Act) relate to your use of those services, not to the RachnaSutra CLI.

## Claims policy

The project does not make, and contributors must not add, claims that are not backed by evidence in this repository:

- No "WCAG compliant", "ADA compliant" or "certified" claims.
- No "supports all IDEs". Support levels are in the compatibility table.
- No performance, conversion or revenue promises.
- No fake ratings, downloads, endorsements or customer logos.
- No copied branding or artwork. Any logo added must be created by or licensed to the project.

## Contributor terms

By submitting a contribution you confirm you have the right to submit it and agree it is licensed under Apache-2.0. Do not submit code copied from incompatible sources. See `CONTRIBUTING.md`.

## Using the sample reports and fixtures

`fixtures/` and `samples/` are test data created for this project and are covered by the repository licence. The "intentionally broken" fixture contains deliberately flawed markup; do not copy it as an example of good practice.

## Export and sanctions

The project contains no cryptography and no restricted technology of its own. Users remain responsible for their compliance with applicable export and sanctions law.

## Security reporting and takedown

Security issues: see [Security and privacy](08-security-and-privacy.md). Copyright or trademark concerns: contact the maintainer through the repository's issue tracker or the security advisory channel, and the issue will be reviewed promptly.

## Checklist before commercial adoption

- [ ] Legal review of the Apache-2.0 obligations for your distribution model
- [ ] Decision on trademark use of the project name
- [ ] Policy on whether code may be sent to your AI IDE provider
- [ ] Plan for manual accessibility testing and conformance reporting
- [ ] Process for handling security reports
