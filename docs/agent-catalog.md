# Agent catalog

Prime reads the task, detects capabilities (file access, shell, CLI, browser, vision), then picks specialists. It does not run all of them.

| Skill | Pick it when the task is about | Typical tools |
|---|---|---|
| `rachnasutra-prime` | any UI/UX request; start here | file read, CLI |
| `rachnasutra-audit` | a full report | CLI, file read |
| `rachnasutra-access` | accessibility, WCAG | CLI `accessibility` |
| `rachnasutra-adapt` | responsive, mobile, TV | file read, browser if allowed |
| `rachnasutra-tokens` | design system, theming | CLI `design-system inspect` |
| `rachnasutra-vision` | look and feel, hierarchy | file read, images supplied |
| `rachnasutra-flow` | journeys, forms, states | file read |
| `rachnasutra-content` | copy, i18n, RTL | file read |
| `rachnasutra-motion` | animation, reduced motion | file read |
| `rachnasutra-speed` | page speed, Core Web Vitals | file read, reports supplied |
| `rachnasutra-convert` | CTAs, funnels, dark patterns | file read |
| `rachnasutra-canvas` | applying approved changes | file write (approved paths) |
| `rachnasutra-verify` | proving fixes worked | CLI `verify --report`, tests |

Without native subagents, Prime runs the same steps sequentially in one conversation.
