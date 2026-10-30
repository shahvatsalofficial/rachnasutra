# Audit rules reference

All rules are implemented in `src/rules.ts` and listed in `RULE_CATALOG`. Every rule has a true-positive and a false-positive path covered by the fixtures and tests. "Confirmed" means the rule emits high confidence; "review" means medium or low.

## Reading this reference

Each rule lists the trigger, the reason it matters, how to fix it, and what it cannot see. WCAG references are to WCAG 2.2.

## Accessibility

### RS-A11Y-001 Image has no alt attribute

- **Trigger:** an `<img>` with no `alt` attribute and no prop spread.
- **Why:** screen-reader users lose the information the image carries (1.1.1).
- **Fix:** add meaningful alt text, or `alt=""` if purely decorative.
- **Cannot see:** whether alt text is meaningful. **Confidence:** high.

### RS-A11Y-002 Document has no lang attribute

- **Trigger:** an `<html>` element in an `.html` file without `lang`.
- **Why:** assistive technology may use wrong pronunciation (3.1.1).
- **Fix:** `<html lang="en">` or the correct code. **Confidence:** high.

### RS-A11Y-003 Viewport meta disables or limits zoom

- **Trigger:** `user-scalable=no` or `maximum-scale` below 2 in the viewport meta.
- **Why:** low-vision users cannot zoom (1.4.4).
- **Fix:** remove the restriction. **Confidence:** high.

### RS-A11Y-004 Button or link has no accessible name

- **Trigger:** `<button></button>` or `<a href></a>` with no content, `aria-label`, `aria-labelledby` or `title`.
- **Why:** announced as just "button" or "link" (4.1.2, 2.4.4).
- **Fix:** visible text or an `aria-label`.
- **Cannot see:** content injected at runtime. **Confidence:** high.

### RS-A11Y-005 Form control has no programmatic label

- **Trigger:** `input` (except hidden, submit, button, reset, image), `select` or `textarea` with no `aria-label`, `aria-labelledby`, `title`, matching `<label for>` or wrapping `<label>`.
- **Why:** unnamed fields cannot be identified by assistive technology or voice control (1.3.1, 3.3.2, 4.1.2).
- **Fix:** add a visible label associated by `for`/`id`.
- **Cannot see:** labels supplied by wrapper components. **Confidence:** medium (review).

### RS-A11Y-006 Positive tabindex

- **Trigger:** `tabindex` of 1 or more.
- **Why:** overrides natural focus order (2.4.3).
- **Fix:** use `0` or `-1` and correct the DOM order. **Confidence:** high.

### RS-A11Y-007 Click handler on non-interactive element

- **Trigger:** `onclick` or `onClick` on `div`, `span`, `li`, `p`, `td` or `section` with no `role` and no `tabindex`.
- **Why:** not reachable or operable by keyboard (2.1.1, 4.1.2).
- **Fix:** use `<button>` or `<a href>`.
- **Cannot see:** delegated key handlers elsewhere. **Confidence:** high.

### RS-A11Y-008 Document has no title

- **Trigger:** an HTML document with `<head>` and no non-empty `<title>`.
- **Why:** users cannot distinguish tabs or results (2.4.2). **Confidence:** high.

### RS-A11Y-009 Heading level skipped

- **Trigger:** in an `.html` file, a heading level more than one deeper than the previous (for example h1 to h3).
- **Why:** breaks the heading outline (1.3.1). **Confidence:** medium (review).

### RS-A11Y-010 Focus indicator removed

- **Trigger:** a rule that sets `outline: none` or `0` without a `box-shadow` replacement, and not inside a `:focus-visible` selector.
- **Why:** keyboard users cannot see focus (2.4.7).
- **Cannot see:** replacement styles in other rules. **Confidence:** high, lowered to medium when the project has any `:focus-visible` rule.

### RS-A11Y-011 Hover styles without focus styles

- **Trigger:** the project has `:hover` rules and no `:focus` or `:focus-visible` rules.
- **Why:** unequal feedback for keyboard users (2.4.7). **Confidence:** medium (review).

### RS-A11Y-012 Media autoplays without muted or controls

- **Trigger:** `<video>` or `<audio>` with `autoplay`, no `muted`, no `controls`.
- **Why:** uncontrolled audio interferes with screen readers (1.4.2). **Confidence:** high.

### RS-A11Y-013 Text contrast below minimum (measured)

- **Trigger:** a rule block, or an inline style, with literal text and background colours whose ratio is below 4.5:1 (3:1 for large text).
- **Why:** low-vision users cannot read the text (1.4.3).
- **Fix:** darken text or lighten background to reach the threshold.
- **Cannot see:** cascade, opacity, gradients, background images. **Confidence:** high for the declared pair.

### RS-A11Y-014 Interactive target smaller than 24x24 CSS px

- **Trigger:** a selector naming button, btn, link or icon with an explicit width or height under 24 px.
- **Why:** hard to hit for users with tremor or on touch (2.5.8).
- **Cannot see:** padding that enlarges the target. **Confidence:** low (review).

### RS-A11Y-015 No main landmark

- **Trigger:** an HTML document with `<body>` and no `<main>` or `role="main"`.
- **Why:** users cannot skip to primary content (1.3.1, 2.4.1).
- **Cannot see:** layouts that inject `<main>`. **Confidence:** medium (review).

## Responsive

### RS-RESP-001 No viewport meta tag

- **Trigger:** an HTML document with `<head>` and no viewport meta.
- **Why:** mobile browsers render a zoomed-out desktop layout (1.4.10). **Confidence:** high.

### RS-RESP-002 Fixed width can overflow narrow viewports

- **Trigger:** `width` of 600 px or more with no `max-width` in the same rule.
- **Why:** forces horizontal scrolling on small screens (1.4.10).
- **Cannot see:** parent constraints and media queries. **Confidence:** medium (review).

### RS-RESP-003 No responsive CSS found

- **Trigger:** styles exist but contain no `@media`, `@container`, `clamp(`, `auto-fit`, `auto-fill` or `flex-wrap`.
- **Cannot see:** utility frameworks such as Tailwind. **Confidence:** medium (review).

## Visual

### RS-VIS-001 Very small text

- **Trigger:** `font-size` below 12 px. **Why:** readability. **Confidence:** high; severity low.

## Performance

### RS-PERF-001 Image without width and height

- **Trigger:** `<img>` missing `width` or `height` and not using `aspect-ratio`.
- **Why:** layout shift while loading. **Confidence:** medium (review).

### RS-PERF-002 Oversized image asset

- **Trigger:** an image file larger than `imageBudgetKb` (default 500). **Confidence:** high.

## Motion

### RS-MOT-001 No reduced-motion handling

- **Trigger:** CSS animations or transitions exist and no `prefers-reduced-motion` appears anywhere in scanned CSS.
- **Why:** motion can cause discomfort for users with vestibular disorders. WCAG 2.3.3 is a AAA criterion, so this is best practice.
- **Cannot see:** JavaScript-driven motion. **Confidence:** high.

## Design system

### RS-TOK-001 Many hard-coded colours, no design tokens

- **Trigger:** 12 or more distinct hex colours and no CSS custom properties.
- **Why:** theming and brand changes become costly. **Confidence:** medium (review).

## Content and trust

### RS-CONT-001 Vague link text

- **Trigger:** link text exactly "click here", "here", "read more", "more", "link" or "learn more" without `aria-label` (2.4.4). **Confidence:** high.

### RS-CONT-002 Placeholder text present

- **Trigger:** "lorem ipsum" or "dolor sit amet". **Confidence:** high.

### RS-TRUST-001 Urgency or scarcity wording needs review

- **Trigger:** phrases such as "only N left", "act now", "hurry", "limited time offer", "N people viewing".
- **Why:** false urgency is a dark pattern. The wording alone does not prove the claim false, so this is info severity, low confidence.

## Severity summary

| Severity | Rules (default) |
|---|---|
| high | A11Y-001, 003, 004, 005, 007, 010, 013 (below 3:1) |
| medium | A11Y-002, 006, 008, 011, 012, 013, 014; RESP-001, 002, 003; PERF-002; MOT-001 |
| low | A11Y-009, 015; VIS-001; PERF-001; TOK-001; CONT-001, 002 |
| info | TRUST-001 |

## Disabling a rule

Add its ID to `disableRules` in `rachnasutra.config.json`. Unknown IDs are rejected by `config validate`. Disable only when you have a reason you can document.
