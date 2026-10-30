# Getting started

1. `node --version` must be 20 or newer.
2. `npx github:shahvatsalofficial/rachnasutra doctor`
3. `npx github:shahvatsalofficial/rachnasutra audit . --format html,json --out reports`
4. Open `reports/latest.html`.
5. `npx github:shahvatsalofficial/rachnasutra skills install --host claude --target . --dry-run`, then again without `--dry-run`.
6. After fixing issues: `npx github:shahvatsalofficial/rachnasutra verify --report reports/latest.json .`

`reports/` is git-ignored by default because reports may contain code excerpts.
