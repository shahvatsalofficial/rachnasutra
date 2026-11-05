# Getting started

1. `node --version` must be 20 or newer.
2. `npx github:shahvatsalofficial/rachnasutra doctor`
3. `npx github:shahvatsalofficial/rachnasutra audit .`
4. Open `rachnasutra-reports/latest.html` (a Markdown copy, `latest.md`, and `latest.json` are next to it).
5. `npx github:shahvatsalofficial/rachnasutra skills install --host claude --target . --dry-run`, then again without `--dry-run`.
6. `npx github:shahvatsalofficial/rachnasutra plan-fixes --report rachnasutra-reports/latest.json` and open `rachnasutra-reports/fix-plan.html`.
7. After fixing issues: `npx github:shahvatsalofficial/rachnasutra verify --report rachnasutra-reports/latest.json .` and open `rachnasutra-reports/verify.html`.

`rachnasutra-reports/` is git-ignored by default because reports may contain code excerpts.
