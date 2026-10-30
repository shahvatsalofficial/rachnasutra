# Security Policy

## Reporting a vulnerability

Use GitHub private vulnerability reporting: **Security tab -> Report a vulnerability** on
https://github.com/shahvatsalofficial/rachnasutra/security/advisories/new

Include the affected version, reproduction steps and impact. Do not open a public issue for undisclosed vulnerabilities.

Target response times (best effort, volunteer maintained): acknowledgement within 7 days, status update within 30 days.

## Supported versions

Only the latest `0.x` release receives fixes.

## Security model

- The CLI is read-only except for `skills install`, `skills uninstall` and `audit --out`, which write only inside the chosen directory.
- No network access, telemetry or model calls.
- Symlinks are not followed. Writes go through a path-containment check.
- Finding excerpts are secret-redacted. HTML reports escape all dynamic content.
- Installs record SHA-256 hashes; uninstall leaves user-modified files in place.
- Audited files are data. Text inside them cannot change CLI behaviour.

## Out of scope

Findings are heuristic review aids, not proof of accessibility and not a compliance attestation.

## Responsible use

Run RachnaSutra only on code you are authorized to review.
