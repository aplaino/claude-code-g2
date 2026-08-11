import type { GlassScreen } from 'even-toolkit/glass-screen-router'
import { buildScrollableList } from 'even-toolkit/glass-display-builders'
import { moveHighlight } from 'even-toolkit/glass-nav'
import type { AppSnapshot, AppActions } from '../shared'
import { line } from '../theme'

// andreas-mods: ad-hoc directory picker. Reached from the project picker's
// "browse folders…" entry. Navigates the home tree via GET /api/browse and
// starts the pending session in whichever folder is confirmed.
//
//   BROWSE  ~/Projects
//   ● use this folder
//   ↑ ..
//   BSCwebsite
//   Blog
//   ...

const USE_HERE = '● use this folder'
const UP = '↑ ..'
const CANCEL = '× cancel'

function shortenPath(p: string, maxLen: number): string {
  const home = p.replace(/^\/Users\/[^/]+/, '~')
  if (home.length <= maxLen) return home
  return '…' + home.slice(home.length - maxLen + 1)
}

function items(snapshot: AppSnapshot): string[] {
  const list = [USE_HERE]
  if (snapshot.browseParent) list.push(UP)
  list.push(...snapshot.browseDirs)
  list.push(CANCEL)
  return list
}

export const browsingScreen: GlassScreen<AppSnapshot, AppActions> = {
  display(snapshot, nav) {
    const list = items(snapshot)
    const lines = [
      line(`BROWSE  ${shortenPath(snapshot.browsePath ?? '~', 34)}`, 'meta'),
      line('━'.repeat(40), 'meta'),
    ]
    lines.push(...buildScrollableList({
      items: list,
      highlightedIndex: Math.min(nav.highlightedIndex, list.length - 1),
      maxVisible: 6,
      formatter: (item) => item,
    }))
    while (lines.length < 9) lines.push(line(''))
    lines.push(line('tap: open/select · 2tap: cancel', 'meta'))
    return { lines }
  },

  action(action, nav, snapshot, ctx) {
    const list = items(snapshot)
    const max = list.length - 1
    if (action.type === 'HIGHLIGHT_MOVE') {
      return { ...nav, highlightedIndex: moveHighlight(nav.highlightedIndex, action.direction, max) }
    }
    if (action.type === 'SELECT_HIGHLIGHTED') {
      const idx = Math.min(nav.highlightedIndex, max)
      const item = list[idx]
      const cur = snapshot.browsePath
      if (item === CANCEL) {
        ctx.cancelRecording()
      } else if (item === USE_HERE && cur) {
        ctx.pickBrowsedFolder(cur)
      } else if (item === UP && snapshot.browseParent) {
        ctx.browseTo(snapshot.browseParent)
      } else if (item && cur) {
        ctx.browseTo(`${cur}/${item}`)
      }
      return { ...nav, highlightedIndex: 0 }
    }
    if (action.type === 'GO_BACK') {
      ctx.cancelRecording()
      return { ...nav, highlightedIndex: 0 }
    }
    return nav
  },
}
