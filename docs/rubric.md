# Audit rubric

## Severity

Severity reflects user impact first (blocks a task, degrades it, polish), then scope. Each rule sets a default severity; contrast failures below 3:1 are raised to high.

## Confidence and status

- `high` confidence: deterministic pattern or measurement, status `confirmed`.
- `medium` or `low`: heuristic, status `review-required`.
- Anything not run is `not-run` in the coverage table. Missing evidence is never a pass.

## Coverage, not scores

No numeric score is produced. Most categories are `partial` in static mode, so a score would reward a narrow scan. Read the coverage table.

## Rules (0.1.0)

| ID | Rule | Default severity | Criterion |
|---|---|---|---|
| RS-A11Y-001 | Image without alt | high | 1.1.1 |
| RS-A11Y-002 | No `lang` on `<html>` | medium | 3.1.1 |
| RS-A11Y-003 | Viewport meta blocks zoom | high | 1.4.4 |
| RS-A11Y-004 | Button or link without accessible name | high | 4.1.2, 2.4.4 |
| RS-A11Y-005 | Form control without label | high | 1.3.1, 3.3.2, 4.1.2 |
| RS-A11Y-006 | Positive tabindex | medium | 2.4.3 |
| RS-A11Y-007 | Click handler on non-interactive element | high | 2.1.1, 4.1.2 |
| RS-A11Y-008 | No document title | medium | 2.4.2 |
| RS-A11Y-009 | Heading level skipped | low | 1.3.1 |
| RS-A11Y-010 | Focus outline removed | high | 2.4.7 |
| RS-A11Y-011 | Hover without focus styles | medium | 2.4.7 |
| RS-A11Y-012 | Autoplay media | medium | 1.4.2 |
| RS-A11Y-013 | Text contrast below minimum (measured) | high or medium | 1.4.3 |
| RS-A11Y-014 | Target under 24x24 CSS px | medium | 2.5.8 |
| RS-A11Y-015 | No main landmark | low | 1.3.1, 2.4.1 |
| RS-RESP-001 | No viewport meta | medium | 1.4.10 |
| RS-RESP-002 | Fixed width of 600px or more | medium | 1.4.10 |
| RS-RESP-003 | No responsive CSS | medium | - |
| RS-VIS-001 | Text under 12px | low | - |
| RS-PERF-001 | Image without width and height | low | - |
| RS-PERF-002 | Image over budget | medium | - |
| RS-MOT-001 | No reduced-motion handling | medium | 2.3.3 (AAA, practice) |
| RS-TOK-001 | Many hard-coded colours, no tokens | low | - |
| RS-CONT-001 | Vague link text | low | 2.4.4 |
| RS-CONT-002 | Placeholder text | low | - |
| RS-TRUST-001 | Urgency or scarcity wording | info | - |

Subjective visual critique is never a CI blocker. Gate CI on `confirmed-critical` or an explicit severity.
