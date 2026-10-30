# WCAG 2.2 AA manual checklist (review aid)

This is a checklist for human testers, not a conformance statement. Cite the success criterion for every issue.

- 1.1.1 Non-text content: every informative image has useful alt text; decorative images have empty alt.
- 1.3.1 Info and relationships: headings, lists, tables, form labels are real elements.
- 1.4.3 Contrast: text 4.5:1 (large text 3:1). 1.4.11 non-text contrast 3:1.
- 1.4.4 and 1.4.10: 200% text resize and 320 CSS px reflow without loss.
- 2.1.1 Keyboard: every function works without a mouse. 2.1.2 no keyboard trap.
- 2.4.3 Focus order; 2.4.7 Focus visible; 2.4.11 Focus not obscured (new in 2.2).
- 2.5.8 Target size minimum 24x24 CSS px (new in 2.2).
- 3.3.1 and 3.3.2 Errors identified and labels or instructions given; 3.3.7 redundant entry (2.2); 3.3.8 accessible authentication (2.2).
- 4.1.2 Name, role, value for custom controls.

Manual passes to schedule: keyboard-only walkthrough, screen reader (NVDA or JAWS on Windows, VoiceOver on macOS/iOS, TalkBack on Android), 200% zoom, 320px width, reduced motion, high-contrast mode.
