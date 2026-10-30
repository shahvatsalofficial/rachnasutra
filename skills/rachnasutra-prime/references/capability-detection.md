# Capability detection

Before promising work, determine what the host provides. Record each as `available`, `not-available` or `unknown`.

| Capability | How to detect | If missing |
|---|---|---|
| File read/search | try reading the project root | stop and ask for files |
| Shell | run `node --version` | skip CLI, inspect source |
| RachnaSutra CLI | `rachnasutra doctor` | inspect source manually |
| Browser / screenshots | host tool list | mark runtime checks `not tested` |
| Vision model | host capability | no visual critique from images |
| Network | never assume | do not fetch; ask first |
