# Example: a RachnaSutra Prime review of the broken fixture

> **Note:** this example was produced by the project author with an AI assistant, following the steps in `skills/rachnasutra-prime/SKILL.md` and using the real CLI output. It illustrates the workflow and the evidence contract. It is not a measurement of how any AI IDE behaves; see [Host smoke tests](../documents/rachnasutra/17-host-smoke-tests.md).

**Request:** "Use rachnasutra-prime to review this project's UI and suggest the most valuable accessible and responsive improvements with source evidence. Stay read-only."

## 1. Scope and capabilities

| Capability | State |
|---|---|
| File read and search | available |
| Shell and RachnaSutra CLI | available (`rachnasutra audit`, `doctor`) |
| Browser, screenshots, vision | **not available**, so nothing below is rendered or visual |
| Network | not used |

Mode: **read-only**. Target: `fixtures/intentionally-broken-ui` (2 files). No file will be edited without approval.

## 2. Specialists selected

Only the specialists the task needs: `rachnasutra-access` (accessibility evidence), `rachnasutra-adapt` (responsive), `rachnasutra-content` (link text). Not used: vision, motion, speed, convert, tokens (no evidence or tool for them in this run).

## 3. Evidence

Command: `rachnasutra audit fixtures/intentionally-broken-ui --json`. Result: 21 findings (8 high, 7 medium, 5 low, 1 info); 13 confirmed, 8 review required.

Highest-severity findings, each verified against the source:

| ID | Status | Location | Finding | User impact |
|---|---|---|---|---|
| RS-0001 | confirmed | `index.html:11` | Image has no alt attribute | Screen-reader users hear the file name or nothing, and lose the information the image carries. |
| RS-0002 | confirmed | `index.html:5` | Viewport meta disables or limits zoom | Low-vision users cannot pinch-zoom to read text. |
| RS-0003 | confirmed | `index.html:13` | Button has no accessible name | Screen-reader users hear only "button" and cannot tell what it does. |
| RS-0004 | review-required | `index.html:16` | Form control has no programmatic label | Screen-reader and voice-control users cannot identify the field; a placeholder alone disappears on input. |
| RS-0005 | confirmed | `index.html:12` | Click handler on non-interactive <div> without role or tabindex | Keyboard and assistive-technology users cannot reach or activate the control. |
| RS-0006 | confirmed | `styles.css:2` | Focus indicator removed (button:focus, a:focus) | Keyboard users cannot see where focus is. |
| RS-0007 | confirmed | `index.html:20` | Text contrast 2.32:1 is below 4.5:1 (#aaaaaa on #ffffff) | Low-vision users and anyone in bright light may be unable to read this text. |
| RS-0008 | confirmed | `styles.css:1` | Text contrast 2.85:1 is below 4.5:1 (#999999 on #ffffff) | Low-vision users and anyone in bright light may be unable to read this text. |

## 4. Recommended order of work

1. **Contrast (RS-0007, RS-0008):** darken `#aaaaaa` and `#999999` text to at least 4.5:1 on white. Measured, so confirmed.
2. **Zoom and names (RS-0002, RS-0001, RS-0003):** remove `user-scalable=no`; add alt text to the hero image; give the icon button an `aria-label`.
3. **Keyboard (RS-0005, RS-0006):** replace the clickable `div` with a `button`; restore a visible focus style (for example `:focus-visible` with a 3:1 outline).
4. **Review required (RS-0004):** the email input has only a placeholder. Confirm whether a wrapper supplies a label, then add a visible `<label>`.

## 5. What was not tested

- Browser rendering at 320, 390, 768, 1024 and 1440 px: **not tested**.
- Keyboard-only and screen-reader walkthroughs: **not tested**; manual checks are required before any accessibility claim.
- Core Web Vitals and visual hierarchy: **not tested**. No numeric score is given because most categories were not evaluated.

## 6. Next step (needs your approval)

No files were changed. If you approve, `rachnasutra-canvas` would apply fixes for RS-0001 to RS-0008 as a small diff, and `rachnasutra-verify` would run `rachnasutra verify --report` to show which findings are resolved and whether any were introduced.
