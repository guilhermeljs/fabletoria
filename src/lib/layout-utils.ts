/** Height of the node header: 28px min-height + 1px border-bottom */
const HEADER_HEIGHT = 29

/** Target width-to-height ratio for a well-proportioned node */
const TARGET_RATIO = 2.5

let _probe: HTMLDivElement | null = null

function getProbe(): HTMLDivElement {
  if (!_probe) {
    _probe = document.createElement('div')

    // Apply exact styles from .content + narrative-content in the actual node.
    // font-family must be explicit — inherited body font is "Plus Jakarta Sans".
    // Not a pretty workaround, but it is a functional workaround
    // Refactor this someday
    _probe.style.cssText = [
      'position:absolute',
      'top:-9999px',
      'left:-9999px',
      'visibility:hidden',
      'pointer-events:none',
      'font-family:"Plus Jakarta Sans",Inter,system-ui,sans-serif',
      'font-size:13px',
      'line-height:1.5',
      'padding:8px 10px',
      'overflow-wrap:break-word',
      'word-break:break-word',
      'white-space:pre-wrap',
      'box-sizing:border-box',
    ].join(';')

    // narrative-content class ensures .narrative-content p, ul, etc. from
    // index.css are applied (e.g. p { margin: 0 0 0.5rem 0 })
    _probe.classList.add('narrative-content')

    document.body.appendChild(_probe)
  }
  return _probe
}

function measureAt(html: string, width: number): number {
  const probe = getProbe()
  probe.style.width = `${width}px`
  probe.innerHTML = html
  return probe.scrollHeight
}

/**
 * Measures the ideal node size using an off-screen DOM element with the same
 * styles as the actual node content area.
 *
 * Samples candidate widths between minWidth and maxWidth, then picks the one
 * whose total (header + content) height produces a W/H ratio closest to
 * TARGET_RATIO — giving a compact but readable card.
 */
const SAFETY_MARGIN = 4
export function measureNodeSize(
  contentHtml: string,
  maxWidth = 500,
  minWidth = 160,
): { width: number; height: number } {
  // Empty nodes get a sensible minimum size
  const baseH = measureAt(contentHtml, maxWidth)
  if (baseH === 0) {
    return { width: minWidth, height: HEADER_HEIGHT + SAFETY_MARGIN }
  }

  // Sample 10 evenly-spaced candidate widths
  const STEPS = 10
  let bestWidth = maxWidth
  let bestDiff = Infinity

  for (let i = 0; i < STEPS; i++) {
    const w = Math.round(minWidth + (i / (STEPS - 1)) * (maxWidth - minWidth))
    const contentH = measureAt(contentHtml, w)
    const totalH = HEADER_HEIGHT + contentH
    const diff = Math.abs(w / totalH - TARGET_RATIO)
    if (diff < bestDiff) {
      bestDiff = diff
      bestWidth = w
    }
  }

  const contentH = measureAt(contentHtml, bestWidth)
  return { width: bestWidth, height: HEADER_HEIGHT + contentH + SAFETY_MARGIN }
}
