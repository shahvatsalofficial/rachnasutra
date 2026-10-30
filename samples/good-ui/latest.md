# RachnaSutra AI - UI/UX audit report

- Generated: 2026-10-30T20:46:41.847Z
- Mode: static (read-only, no network, no model)
- Root: `<project>\fixtures\good-ui`
- Files scanned: 2 (.html: 1, .css: 1)
- Tool: rachnasutra 0.1.0

## Executive summary

0 finding(s): 0 critical, 0 high, 0 medium, 0 low, 0 info.
0 confirmed by deterministic pattern or measurement; 0 need human or runtime review.

This is a static review. It does not certify WCAG conformance and gives no quality score, because large areas were not evaluated (see Coverage).

## Coverage

| Area | State | Detail |
|---|---|---|
| accessibility (static) | partial | Source patterns and measured literal colour contrast only. Keyboard, screen-reader and axe runtime checks were not run. |
| responsive (static) | partial | Viewport meta, fixed widths and responsive CSS presence. No viewport was rendered. |
| design system | partial | Token inventory from literal CSS values; no Figma, Storybook or component API inspection. |
| content | partial | Link text, placeholder copy and urgency wording only. No tone or localisation review. |
| performance (static) | partial | Image dimensions and asset size only. Core Web Vitals were not measured. |
| motion | partial | CSS reduced-motion handling only. |
| browser runtime | not-run | Not available in this version. Requires an authorized browser audit. |
| visual review | not-run | Needs screenshots and a vision-capable host. No screenshot was taken. |
| screen-reader and keyboard testing | not-run | Manual testing required. |
| Core Web Vitals (lab and field) | not-run | No measurement taken. |

## Findings

No findings from the static rules. This does not mean the UI is accessible or well designed.

## Design token inventory

CSS custom properties: 4. Literal colour share: 56%.

## Limitations

- Static analysis reads source text only. Nothing was rendered, executed or sent over a network.
- Findings are review aids. Automated checks cannot establish WCAG conformance; manual testing is required.
- CSS frameworks, CSS-in-JS and runtime-injected markup are only partly visible.
- No numeric quality score is given because category coverage is partial.
