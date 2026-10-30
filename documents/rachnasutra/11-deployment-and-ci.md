# Deployment and CI

## Modes of use

| Mode | How | Network | Model |
|---|---|---|---|
| Local developer | `npx github:shahvatsalofficial/rachnasutra audit .` | Only to fetch the package | None |
| Cloned source | `npm install && npm run build && node dist/cli.js ...` | Only to install dev dependencies | None |
| CI | `rachnasutra ci .` in a pipeline | Only to fetch the package | None |
| IDE-assisted | Skills installed into the project | Per the IDE | The IDE's own model |
| Server or container | Same CLI, JSON output, exit codes | None at run time | None |

## GitHub Actions example

```yaml
name: UI audit
on: [pull_request]
permissions:
  contents: read
  security-events: write
jobs:
  rachnasutra:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Audit
        run: npx --yes github:shahvatsalofficial/rachnasutra ci . > rachnasutra.json
      - name: SARIF
        if: always()
        run: npx --yes github:shahvatsalofficial/rachnasutra export --format sarif . > rachnasutra.sarif
      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: rachnasutra.sarif
```

The first step fails the job (exit 1) when a confirmed high or critical finding exists. Do not give audit jobs for forked pull requests access to secrets.

## Choosing a gate

| Gate | Command | Use when |
|---|---|---|
| Confirmed critical or high | `rachnasutra ci .` | Default; low risk of false-positive blocks |
| Any high | `rachnasutra audit . --fail-on high` | You accept review-required findings blocking |
| Any medium | `rachnasutra audit . --fail-on medium` | Mature codebases |
| Regression only | `rachnasutra verify --report baseline.json .` | Existing debt; block only new findings |

Subjective visual critique is never an automatic gate.

## Regression-only workflow

1. On the main branch, store `reports/latest.json` as a build artifact.
2. On pull requests, download the artifact and run `rachnasutra verify --report latest.json .`.
3. The job fails (exit 4) only when the change introduces findings.

## Exit codes

See [Technical reference](04-technical-reference.md). In scripts, treat 0 as success, 1 as policy failure, 2 as configuration error, 3 as not available, 4 as verification failure, 5 as tool error.

## Containers (planned)

A Dockerfile is not included in 0.1.0. The CLI already runs headlessly, so a minimal image is a Node 22 slim base with the package installed, running as a non-root user with the project mounted read-only. When added it will pin the base image digest and document memory and time limits.

## Resource guidance

| Repository size | Suggestion |
|---|---|
| Under 5,000 relevant files | Defaults are fine |
| Larger | Run per package, use `exclude`, or raise `maxFiles` knowingly |

The tool is single-threaded and uses memory proportional to the largest files it reads.

## Release and distribution

Current: install straight from GitHub with `npx github:...`. Planned: tagged releases and an npm package. Publishing to npm needs an authenticated maintainer and is a manual, reviewed step. Package name `rachnasutra` and a scoped alternative `@vatsalshah/rachnasutra` are proposals; availability has not been checked.

## Upgrade and rollback

- Upgrade: run the newest version; `schemaVersion` identifies the report contract. Breaking changes will increase the major version of the schema and be listed in `CHANGELOG.md`.
- Skills: reinstall to update unmodified files; modified files are preserved as conflicts.
- Rollback: pin the earlier version or tag; uninstall skills with `skills uninstall`.

## Operations checklist

- [ ] Node 20 or newer on runners
- [ ] `reports/` ignored or uploaded as a private artifact
- [ ] SARIF upload permission limited to the job
- [ ] Baseline report updated on a schedule you control
- [ ] Gate threshold documented in the repository
