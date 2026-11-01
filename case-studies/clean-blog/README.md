# Case study: auditing and fixing a real template

Subject: the built pages (`dist/`) of the MIT-licensed [Clean Blog](https://github.com/startbootstrap/startbootstrap-clean-blog) template by Start Bootstrap, at commit `1ebc4f8f3b`. The template's images were removed from the audited copy to keep it small; no template files are included here, only the diff.

## Method

1. Copy `dist/` to a scratch folder and audit it: `rachnasutra audit <folder> --format json --out <reports>`.
2. Fix the confirmed and clearly real findings by hand in a second copy (`fixes.diff`).
3. Re-audit against the saved baseline: `rachnasutra verify --report <baseline> <fixed folder>`.
4. Cross-check with axe-core (jsdom) and read the names of all links in a real browser.

## Baseline

31 findings across 5 files (22 high, 5 medium, 4 low), saved as [before-report.json](before-report.json). The ones that matter most:

| Finding | Where | Why it is real |
|---|---|---|
| RS-A11Y-004 Link has no accessible name (12 findings) | the three social-media icon links in the footer of every page | The links contain only Font Awesome icons, so a screen reader announces "link" with no destination |
| RS-A11Y-015 No main landmark | `index.html`, `post.html` | Keyboard and screen-reader users cannot jump to the content |
| RS-A11Y-013 Text contrast (5) and RS-A11Y-010 Focus indicator removed (10) | compiled Bootstrap CSS | Present in the CSS, but the classes involved (`list-group-item-*`, `form-control-plaintext`, `offcanvas`, `carousel`, and others) are not used by these pages |
| RS-CONT-002, RS-PERF-001 | `about.html`, `post.html` | Placeholder text; an image without width and height |

## Fixes applied ([fixes.diff](fixes.diff), 172 lines)

- Added `aria-label="Twitter"`, `"Facebook"` and `"GitHub"` to the 12 icon links and `aria-hidden="true"` to the decorative icon stacks.
- Wrapped the page content in `<main>` on the two pages that lacked it.

Not changed, by decision: the framework CSS findings (unused classes) and the placeholder and image notes.

## Result

`rachnasutra verify --report before-report.json <fixed folder>`:

```text
Baseline 31 -> current 17
Resolved: 14  Remaining: 17  Introduced: 0
```

| Check | Before | After |
|---|---|---|
| RachnaSutra RS-A11Y-004 link findings | 12 | 0 |
| RachnaSutra RS-A11Y-015 findings | 2 | 0 |
| axe-core 4.10.2 `link-name` violations (4 pages, jsdom) | 12 | 0 |
| Links with an empty name in a real browser (index page) | 3 | 0 |
| `<main>` elements on the index page | 0 | 1 |

## What this does not show

- No screen reader was used and no keyboard-only walkthrough was done, so the quality of the new link names in practice is unverified.
- Colour contrast of the rendered page and visual design were not reviewed.
- One template is one data point.

## Reproduce

```bash
git clone --depth 1 https://github.com/startbootstrap/startbootstrap-clean-blog.git
cp -r startbootstrap-clean-blog/dist clean-blog-before && rm -rf clean-blog-before/assets/img
rachnasutra audit clean-blog-before --format json --out reports
cp -r clean-blog-before clean-blog-after && (cd clean-blog-after && patch -p2 < <path-to>/fixes.diff)
rachnasutra verify --report reports/latest.json clean-blog-after
```
