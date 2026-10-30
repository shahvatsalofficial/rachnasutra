# Contributing

Thanks for helping. Keep changes small and evidence-backed.

## Setup

```bash
git clone https://github.com/shahvatsalofficial/rachnasutra.git
cd rachnasutra
npm install
npm test
npm run verify
```

Node.js 20 or newer. The CLI has no runtime dependencies; do not add one without discussion.

## Add an audit rule

1. Add detection in `src/rules.ts` and an entry in `RULE_CATALOG`.
2. Give it: rule ID (`RS-<AREA>-<NNN>`), WCAG criterion if any, severity, honest confidence, user impact, fix, verification and limitations.
3. Add a true-positive and a false-positive test in `test/rachnasutra.test.mjs` using small inline fixtures.
4. Update [docs/rubric.md](docs/rubric.md).

Confidence is `high` only for deterministic patterns or measurements. Anything heuristic is `medium` or `low`, which becomes `review-required`.

## Add or change a skill

Edit `skills/<name>/SKILL.md` (directory name equals frontmatter `name`). Required sections are checked by `npm run verify`. Keep the file under 500 lines; put long checklists in `references/`.

## Add a host adapter

Add an entry to `HOSTS` in `src/adapters.ts`, cite the vendor documentation, mark support `experimental` until smoke-tested in the real host, and update [docs/compatibility.md](docs/compatibility.md).

## Pull requests

Describe what changed and how it was verified. Do not commit real secrets or personal data. Do not make marketing claims (compliance, coverage, speed-ups) without evidence.
