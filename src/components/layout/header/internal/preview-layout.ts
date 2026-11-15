// Shared geometry for the header preview panel.
//
// The panel is a two-column layout: a section rail plus a content column. The
// content column is pinned to a fixed width (its previously allowed maximum),
// so the panel no longer re-measures itself every time the entries change and
// the rail divider stays at one constant x position.
export const previewRailWidth = '12.5rem'
export const previewContentWidth = '26rem'

export const previewGridStyle: { gridTemplateColumns: string } = {
  gridTemplateColumns: `${previewRailWidth} ${previewContentWidth}`,
}
