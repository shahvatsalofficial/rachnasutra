# Deployment and CI

## Modes of use

| Mode | How | Network | Model |
|---|---|---|---|
| Local developer | `npx rachnasutra audit .` | Only to fetch the package | None |
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
        run: npx --yes rachnasutra ci . > rachnasutra.json
      - name: SARIF
        if: always()
        run: npx --yes rachnasutra export --format sarif . > rachnasutra.sarif
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

A Dockerfile is not included in 0.2.0. The CLI already runs headlessly, so a minimal image is a Node 22 slim base with the package installed, running as a non-root user with the project mounted read-only. When added it will pin the base image digest and document memory and time limits.

## Resource guidance

| Repository size | Suggestion |
|---|---|
| Under 5,000 relevant files | Defaults are fine |
| Larger | Run per package, use `exclude`, or raise `maxFiles` knowingly |

The tool is single-threaded and uses memory proportional to the largest files it reads.

## Container

`Dockerfile` uses `node:22-bookworm-slim`, runs `npm ci --ignore-scripts` and `npm run build`, and starts `node dist/cli.js`. Mount the project read-only and pass the audit command. The image has no browser. `.github/workflows/docker.yml` builds it on Ubuntu and runs `version`. This PC has no Docker, so the image was not built here. Example: `docker build -t rachnasutra .` then `docker run --rm -v "$PWD:/work:ro" -w /work rachnasutra audit /work`.

## Saved-report history

`rachnasutra history <directory>` reads every JSON audit in that directory and writes `history.md` and `history.html` next to them, or under `--out`. The table is finding counts. It does not open a browser and it does not diff screenshots.

## Doctor

`rachnasutra doctor` prints OK or FAIL for checks that can pass or fail. Browser audit, visual review and live host loading print NOTE. NOTE means doctor did not launch a browser and did not open a live IDE. It is not a pass. The process still exits 0 when every real check passed. `audit --mode browser` is a separate command.

`failOn` may be `confirmed-critical`. That value fails the command when a finding is confirmed and high, or confirmed and critical. The word critical in the name is historical. `ci` uses this gate by default.

## Documentation site

The HTML documentation is live at <https://shahvatsalofficial.github.io/rachnasutra/>. `.github/workflows/pages.yml` uploads `documents/rachnasutra/html/` with GitHub Pages. A push to `main` that changes the docs deploys it. `workflow_dispatch` can deploy the current `main` without a docs edit.

## Release and distribution

Install from npm. Node 20 or newer. No API key.

```bash
npx rachnasutra audit .
npm install --save-dev rachnasutra
```

The package name is `rachnasutra`. It is public. The npm account that publishes it is `shahvatsal`. GitHub install still works: `npx github:shahvatsalofficial/rachnasutra audit .`.

Maintainer publish, from a clean `main` after CI is green:

1. Bump `version` in `package.json` and `toolVersion()` in `src/audit.ts`. Add a `CHANGELOG.md` section. Commit and push. Wait until the Linux and Windows CI run is green.
2. Publish with GitHub Actions, not from a laptop. `.github/workflows/publish.yml` runs on **Actions → Publish → Run workflow**, and also when a tag `vX.Y.Z` is pushed. The tag must equal `package.json` `version`. The job refuses to publish a version that is already on npm. `prepublishOnly` still runs `npm test` and `npm run verify`.
3. One-time setup on npm, as `shahvatsal`. Open the `rachnasutra` package on npmjs.com, then **Settings → Trusted Publisher → GitHub Actions**. Set the repository owner to `shahvatsalofficial`, the repository to `rachnasutra`, and the workflow filename to `publish.yml`. Leave the environment name empty. Save. Do not create an `NPM_TOKEN` secret. The Action uses GitHub's short-lived OIDC token.
4. After that save, run the workflow, or push the tag: `git tag -a vX.Y.Z -m "vX.Y.Z"` then `git push origin vX.Y.Z`.
5. `npm view rachnasutra version` must print the version you just published.

A local `npm publish --access public` still works if `npm whoami` prints `shahvatsal`. npm will ask for a one-time password in that terminal. Do not paste the password or a token into chat.

Unpublish is only available for 72 hours, and only if nothing else depends on the version. The publish workflow does not unpublish. Prefer a new patch version over an unpublish. Removing `0.0.0-stage` still needs `npm unpublish rachnasutra@0.0.0-stage` from a terminal, and npm will ask for the one-time password.

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
