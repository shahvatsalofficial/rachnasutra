# RachnaSutra AI - UI/UX audit report

- Generated: 2026-10-30T20:46:41.001Z
- Mode: static (read-only, no network, no model)
- Root: `<project>\fixtures\intentionally-broken-ui`
- Files scanned: 2 (.html: 1, .css: 1)
- Tool: rachnasutra 0.1.0

## Executive summary

21 finding(s): 0 critical, 8 high, 7 medium, 5 low, 1 info.
13 confirmed by deterministic pattern or measurement; 8 need human or runtime review.

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

### RS-0001 - Image has no alt attribute

- Rule: RS-A11Y-001 | Category: accessibility | Severity: **high** | Confidence: high | Status: confirmed
- Criterion: WCAG 2.2: 1.1.1 Non-text Content
- Location: `index.html:11`
- Evidence: `<img src="hero.jpg">`
- User impact: Screen-reader users hear the file name or nothing, and lose the information the image carries.
- Fix: Add a meaningful alt, or alt="" when the image is purely decorative.
- Verify: Re-run 'rachnasutra accessibility', then check the image with a screen reader.
- Limitations: Whether the alt text is meaningful needs human review.

### RS-0002 - Viewport meta disables or limits zoom

- Rule: RS-A11Y-003 | Category: accessibility | Severity: **high** | Confidence: high | Status: confirmed
- Criterion: WCAG 2.2: 1.4.4 Resize Text
- Location: `index.html:5`
- Evidence: `<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">`
- User impact: Low-vision users cannot pinch-zoom to read text.
- Fix: Remove user-scalable=no and any maximum-scale below 2 from the viewport meta.
- Verify: Pinch-zoom the page on a real device or emulator.
- Limitations: None for the declared value.

### RS-0003 - Button has no accessible name

- Rule: RS-A11Y-004 | Category: accessibility | Severity: **high** | Confidence: high | Status: confirmed
- Criterion: WCAG 2.2: 4.1.2 Name, Role, Value
- Location: `index.html:13`
- Evidence: `<button class="icon-btn"></button>`
- User impact: Screen-reader users hear only "button" and cannot tell what it does.
- Fix: Add visible text or an aria-label describing the action.
- Verify: Re-run the audit; check the accessible name in the browser accessibility tree.
- Limitations: Content injected at runtime would not be seen by static analysis.

### RS-0004 - Form control has no programmatic label

- Rule: RS-A11Y-005 | Category: accessibility | Severity: **high** | Confidence: medium | Status: review-required
- Criterion: WCAG 2.2: 1.3.1 Info and Relationships, 3.3.2 Labels or Instructions, 4.1.2
- Location: `index.html:16`
- Evidence: `<input type="email" placeholder="Email">`
- User impact: Screen-reader and voice-control users cannot identify the field; a placeholder alone disappears on input.
- Fix: Associate a visible <label for> (or wrap the control), or add aria-label when no visible label is possible.
- Verify: Click the label to focus the field; check the accessible name in the accessibility tree.
- Limitations: Labels supplied by a component wrapper or at runtime are not visible to a static scan.

### RS-0005 - Click handler on non-interactive <div> without role or tabindex

- Rule: RS-A11Y-007 | Category: accessibility | Severity: **high** | Confidence: high | Status: confirmed
- Criterion: WCAG 2.2: 2.1.1 Keyboard, 4.1.2 Name, Role, Value
- Location: `index.html:12`
- Evidence: `<div class="card" onclick="openCart()">Open cart</div>`
- User impact: Keyboard and assistive-technology users cannot reach or activate the control.
- Fix: Use a real <button> (or <a href>); if impossible, add role, tabindex="0" and key handlers.
- Verify: Operate the control with Tab, Enter and Space only.
- Limitations: Delegated key handlers elsewhere are not visible to a static scan.

### RS-0006 - Focus indicator removed (button:focus, a:focus)

- Rule: RS-A11Y-010 | Category: accessibility | Severity: **high** | Confidence: high | Status: confirmed
- Criterion: WCAG 2.2: 2.4.7 Focus Visible
- Location: `styles.css:2`
- Evidence: `button:focus, a:focus { outline: none; }`
- User impact: Keyboard users cannot see where focus is.
- Fix: Keep the default outline or provide a clearly visible :focus-visible style with 3:1 contrast.
- Verify: Tab through the control and confirm a visible indicator.
- Limitations: A replacement style in another rule or file may exist.

### RS-0007 - Text contrast 2.32:1 is below 4.5:1 (#aaaaaa on #ffffff)

- Rule: RS-A11Y-013 | Category: accessibility | Severity: **high** | Confidence: high | Status: confirmed
- Criterion: WCAG 2.2: 1.4.3 Contrast (Minimum)
- Location: `index.html:20`
- Evidence: `<p style="color:#aaaaaa;background:#ffffff">Light grey inline text</p>`
- User impact: Low-vision users and anyone in bright light may be unable to read this text.
- Fix: Darken the text or lighten the background until the ratio is at least 4.5:1 (3:1 for large text).
- Verify: Re-run the audit; spot-check the rendered colour pair with a contrast tool.
- Limitations: Measured from literal inline declarations. Large-text exemption is not applied to inline styles.

### RS-0008 - Text contrast 2.85:1 is below 4.5:1 (#999999 on #ffffff)

- Rule: RS-A11Y-013 | Category: accessibility | Severity: **high** | Confidence: high | Status: confirmed
- Criterion: WCAG 2.2: 1.4.3 Contrast (Minimum)
- Location: `styles.css:1`
- Evidence: `.hero { width: 1200px; background: #ffffff; color: #999999; }`
- User impact: Low-vision users and anyone in bright light may be unable to read this text.
- Fix: Darken the text or lighten the background until the ratio is at least 4.5:1.
- Verify: Re-run the audit; spot-check the rendered colour pair with a contrast tool.
- Limitations: Measured from literal declarations in one rule. Cascade, opacity, gradients and images are not resolved.

### RS-0009 - Document has no lang attribute

- Rule: RS-A11Y-002 | Category: accessibility | Severity: **medium** | Confidence: high | Status: confirmed
- Criterion: WCAG 2.2: 3.1.1 Language of Page
- Location: `index.html:2`
- Evidence: `<html>`
- User impact: Screen readers may pronounce content with the wrong language rules.
- Fix: Add lang to the <html> element, for example <html lang="en">.
- Verify: Re-run the audit; confirm with a screen reader that pronunciation is correct.
- Limitations: None for the missing attribute; the right language code is a content decision.

### RS-0010 - Positive tabindex overrides natural focus order

- Rule: RS-A11Y-006 | Category: accessibility | Severity: **medium** | Confidence: high | Status: confirmed
- Criterion: WCAG 2.2: 2.4.3 Focus Order
- Location: `index.html:17`
- Evidence: `<input type="text" tabindex="3" aria-label="Name">`
- User impact: Keyboard users tab through elements in a surprising order.
- Fix: Use tabindex="0" or "-1" only, and fix the DOM order instead.
- Verify: Tab through the page and confirm the order matches the visual order.
- Limitations: None for the declared value.

### RS-0011 - Document has no title

- Rule: RS-A11Y-008 | Category: accessibility | Severity: **medium** | Confidence: high | Status: confirmed
- Criterion: WCAG 2.2: 2.4.2 Page Titled
- Location: `index.html:3`
- Evidence: `<head>`
- User impact: Users cannot tell tabs, history entries or search results apart.
- Fix: Add a unique, descriptive <title> in <head>.
- Verify: Re-run the audit and check the browser tab.
- Limitations: A title may be set at runtime by a script.

### RS-0012 - Interactive target smaller than 24x24 CSS px (.icon-btn)

- Rule: RS-A11Y-014 | Category: accessibility | Severity: **medium** | Confidence: low | Status: review-required
- Criterion: WCAG 2.2: 2.5.8 Target Size (Minimum)
- Location: `styles.css:3`
- Evidence: `.icon-btn { width: 16px; height: 16px; }`
- User impact: Users with tremor or on touch screens may mis-tap.
- Fix: Make the target at least 24x24 CSS px (44x44 recommended for touch) or add spacing.
- Verify: Measure the rendered bounding box in a browser at the target viewport.
- Limitations: Padding may enlarge the real target; selector-name match is heuristic.

### RS-0013 - Animations or transitions exist but no prefers-reduced-motion handling

- Rule: RS-MOT-001 | Category: motion | Severity: **medium** | Confidence: high | Status: confirmed
- Criterion: WCAG 2.2: 2.3.3 Animation from Interactions (AAA, best practice)
- Location: `styles.css:6`
- Evidence: `.fade { transition: opacity 0.4s; animation: spin 2s infinite; }`
- User impact: Users with vestibular disorders may be made unwell by motion they asked the OS to reduce.
- Fix: Wrap non-essential motion in @media (prefers-reduced-motion: no-preference) or disable it under reduce.
- Verify: Enable "reduce motion" in the OS and confirm motion stops.
- Limitations: Motion may be handled in JavaScript; only CSS was scanned.

### RS-0014 - Fixed width 1200px can overflow narrow viewports

- Rule: RS-RESP-002 | Category: responsive | Severity: **medium** | Confidence: medium | Status: review-required
- Criterion: WCAG 2.2: 1.4.10 Reflow
- Location: `styles.css:1`
- Evidence: `.hero { width: 1200px; background: #ffffff; color: #999999; }`
- User impact: On a 320px-wide screen this forces horizontal scrolling.
- Fix: Use max-width with width: 100%, or relative units, and let content reflow.
- Verify: Render at 320x568 and confirm no horizontal scroll.
- Limitations: A parent container or media query may constrain the element; not rendered.

### RS-0015 - No responsive CSS found (media/container queries, clamp, grid auto-fit, flex-wrap)

- Rule: RS-RESP-003 | Category: responsive | Severity: **medium** | Confidence: medium | Status: review-required
- Location: `styles.css:1`
- Evidence: `.hero { width: 1200px; background: #ffffff; color: #999999; }`
- User impact: Layouts may not adapt to phones, tablets or large displays.
- Fix: Adopt a mobile-first approach with media or container queries and fluid sizing.
- Verify: Render at 320, 390, 768, 1024 and 1440 widths and review each screenshot.
- Limitations: CSS frameworks (Tailwind, Bootstrap) supply responsive rules not visible in source CSS.

### RS-0016 - Heading level skips from h1 to h3

- Rule: RS-A11Y-009 | Category: accessibility | Severity: **low** | Confidence: medium | Status: review-required
- Criterion: WCAG 2.2: 1.3.1 Info and Relationships
- Location: `index.html:10`
- Evidence: `<h3>Featured</h3>`
- User impact: Heading navigation implies a broken outline; users may miss that sections are related.
- Fix: Use sequential heading levels, and style headings with CSS rather than by level.
- Verify: Inspect the heading outline in the browser accessibility tree.
- Limitations: Heading order across included partials is not visible to a single-file scan.

### RS-0017 - No main landmark

- Rule: RS-A11Y-015 | Category: accessibility | Severity: **low** | Confidence: medium | Status: review-required
- Criterion: WCAG 2.2: 1.3.1 Info and Relationships, 2.4.1 Bypass Blocks
- Location: `index.html:8`
- Evidence: `<body>`
- User impact: Keyboard and screen-reader users cannot jump straight to the primary content.
- Fix: Wrap the primary content in <main> and add a skip link if there is repeated navigation.
- Verify: Check landmarks with a screen-reader landmark list or the browser accessibility tree.
- Limitations: A shared layout file may provide <main> for this page.

### RS-0018 - Vague link text "click here"

- Rule: RS-CONT-001 | Category: content | Severity: **low** | Confidence: high | Status: confirmed
- Criterion: WCAG 2.2: 2.4.4 Link Purpose (In Context)
- Location: `index.html:14`
- Evidence: `<a href="/sale">click here</a>`
- User impact: Links listed out of context (screen-reader link lists) are indistinguishable.
- Fix: Describe the destination in the link text, for example "Read the pricing guide".
- Verify: Re-run the audit; review the page link list.
- Limitations: Surrounding context may make the purpose clear to sighted users.

### RS-0019 - Image has no explicit width and height

- Rule: RS-PERF-001 | Category: performance | Severity: **low** | Confidence: medium | Status: review-required
- Location: `index.html:11`
- Evidence: `<img src="hero.jpg">`
- User impact: Late-loading images can shift layout (Cumulative Layout Shift) while the page renders.
- Fix: Set width and height attributes (or CSS aspect-ratio) so the browser reserves space.
- Verify: Measure CLS in a lab run (Lighthouse) before and after; compare field data if available.
- Limitations: CSS elsewhere may already reserve the space; not measured at runtime.

### RS-0020 - Very small text (10px)

- Rule: RS-VIS-001 | Category: visual | Severity: **low** | Confidence: high | Status: confirmed
- Criterion: WCAG 2.2: 1.4.4 Resize Text (readability)
- Location: `styles.css:4`
- Evidence: `.note { font-size: 10px; }`
- User impact: Small text is hard to read, especially on mobile and for low-vision users.
- Fix: Use at least 12px for supplementary text and 16px for body text; prefer rem units.
- Verify: View on a real phone at normal distance.
- Limitations: Context (legal footers, labels) may justify small text; this is a readability signal.

### RS-0021 - Urgency or scarcity wording needs review

- Rule: RS-TRUST-001 | Category: trust | Severity: **info** | Confidence: low | Status: review-required
- Location: `index.html:19`
- Evidence: `<p class="urgent">Hurry! Only 3 left in stock.</p>`
- User impact: False scarcity or urgency is a dark pattern that manipulates users.
- Fix: Confirm the claim is true and sourced from real data; otherwise remove it.
- Verify: Human review of the data source behind the claim.
- Limitations: Wording alone does not prove the claim is false.

## Design token inventory

CSS custom properties: 0. Literal colour share: 100%.

## Limitations

- Static analysis reads source text only. Nothing was rendered, executed or sent over a network.
- Findings are review aids. Automated checks cannot establish WCAG conformance; manual testing is required.
- CSS frameworks, CSS-in-JS and runtime-injected markup are only partly visible.
- No numeric quality score is given because category coverage is partial.
