# Desktop layout

`src/desktop.css` provides responsive layout rules without changing study scheduling, data, or touch gestures. It is loaded after the shared palette and uses scoped selectors so lazy feature styles cannot enlarge desktop components again.

- Below 600 px: existing phone layout, two deck columns.
- 600–899 px: three deck columns inside the existing tablet workspace.
- 900–1199 px: desktop workspace up to 1060 px, three deck columns capped at 250 px.
- From 1200 px: four deck columns, keeping the same tile size.
- Individual desktop questions stay within 640 px; landscape chronology can use 1120 px. Images and chronology height are capped independently of monitor height. The chronology action stays near the bounded task area on tall displays.
- Property selection is a centered dialog. Statistics uses two columns with named areas; narrow screens retain the original document order.

## Browser verification

Start `pnpm dev`, then run `pnpm test:browser:desktop`. Install Chromium first with `pnpm exec playwright install chromium` if needed. `ENGI_TEST_URL` overrides the development server URL; `ENGI_BROWSER_PATH` overrides Chromium's executable.

The test creates a synthetic pack and imports it into a disposable Playwright context. It checks phone, laptop, desktop, and large monitor sizes, centered property dialogs, settings widths, statistics placement, introduction cards, choices, matching, and chronology. Source imports used by the task harness require the Vite development server. Screenshots and geometry reports are written to `artifacts/desktop-layout/`. Personal browser data is never opened.

## Chronology orientation

Landscape windows and phones show early events on the left and late events on the right; portrait screens keep early events at the bottom. The saved order and grading contract remain newest-first in both views. Horizontal presentation reverses the flex direction and measures dragging along the X axis, so rotation requires no migration or rewriting answers. A pending drag is cancelled on rotation; completed order, checked slots, and feedback remain intact. Keyboard controls follow the displayed axis.

Run `pnpm test:browser:chronology:landscape` against the development server to check 3–5 text/image cards, drag and keyboard moves, locked correct slots, neutral styling after corrections, unchanged grading, and rotation during a drag. `tests/chronology-layout-browser.mjs` also checks that all cards fit on portrait and landscape phones without scrolling.
