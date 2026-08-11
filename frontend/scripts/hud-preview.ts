// andreas-mods: terminal HUD preview, in the spirit of evenTermidex's pure
// renderer tests — every glass screen is a pure (snapshot, nav) → lines
// function, so the exact frames the glasses will show can be printed here
// without hardware. Run:
//
//   bun scripts/hud-preview.ts            # all screens
//   bun scripts/hud-preview.ts picking    # one screen by name
//
// The 576x288 HUD fits ~10 lines × ~44 chars; the box below matches that.

import type { GlassNavState } from 'even-toolkit/types'
import { mainScreen } from '../src/glass/screens/main'
import { recordingScreen } from '../src/glass/screens/recording'
import { pickingScreen } from '../src/glass/screens/picking'
import { confirmingScreen } from '../src/glass/screens/confirming'
import { answeringScreen } from '../src/glass/screens/answering'
import { browsingScreen } from '../src/glass/screens/browsing'
import type { AppSnapshot } from '../src/glass/shared'

const WIDTH = 44

const base: AppSnapshot = {
  mode: 'main',
  sessions: [
    { id: 'a1', title: 'fix the OSFI ingest test', projectName: 'signal', createdAt: 1, lastActiveAt: 3, busy: true },
    { id: 'b2', title: 'draft the credit union post', projectName: 'autolink', createdAt: 2, lastActiveAt: 2 },
    { id: 'c3', title: 'clean the gallery CSS', projectName: 'BSCwebsite', createdAt: 3, lastActiveAt: 1 },
  ],
  activeSessionId: null,
  transcript: [],
  activeBusy: false,
  recordStartedAt: null,
  pendingTranscript: null,
  projects: ['signal', 'autolink', 'bsc', 'downloads', 'home'],
  sessionScrollOffset: 0,
  error: null,
  connection: 'ok',
  confirmAction: null,
  lastActivityAt: Date.now(),
  confirmTranscriptFlow: null,
  pendingQuestion: null,
  scrollingTranscript: false,
  sidebarVisible: false,
  browsePath: null,
  browseParent: null,
  browseDirs: [],
}

interface Preview {
  title: string
  screen: { display(s: AppSnapshot, n: GlassNavState): { lines: { text: string; style: string; inverted: boolean }[] } }
  snapshot: AppSnapshot
  nav?: Partial<GlassNavState>
}

const previews: Record<string, Preview> = {
  'main-sidebar': {
    title: 'main — session list (no active session)',
    screen: mainScreen,
    snapshot: { ...base, sidebarVisible: true },
  },
  'main-session': {
    title: 'main — active session transcript',
    screen: mainScreen,
    snapshot: {
      ...base,
      activeSessionId: 'a1',
      activeBusy: false,
      transcript: [
        { kind: 'user', text: 'fix the OSFI ingest test', ts: 1 },
        { kind: 'tool_use', toolUseId: 't1', name: 'Bash', input: { command: 'bun test' }, ts: 2 },
        { kind: 'assistant_text', text: 'The date parser assumed UTC; fixed and the test passes.', ts: 3 },
        { kind: 'result', subtype: 'success', isError: false, ts: 4 },
      ],
    },
  },
  recording: {
    title: 'recording — mic open',
    screen: recordingScreen,
    snapshot: { ...base, mode: 'recording-new', recordStartedAt: Date.now() - 3200 },
  },
  confirming: {
    title: 'confirming — spoken slash command (new session)',
    screen: confirmingScreen,
    snapshot: {
      ...base,
      mode: 'confirming-transcript',
      confirmTranscriptFlow: 'new',
      pendingTranscript: '/commit tighten the hero copy',
    },
  },
  picking: {
    title: 'picking — project list + browse entry',
    screen: pickingScreen,
    snapshot: {
      ...base,
      mode: 'picking-project',
      pendingTranscript: 'add a favicon to the gallery',
    },
    nav: { highlightedIndex: 5 },
  },
  browsing: {
    title: 'browsing — folder navigator at ~/Projects',
    screen: browsingScreen,
    snapshot: {
      ...base,
      mode: 'browsing-folder',
      pendingTranscript: 'add a favicon to the gallery',
      browsePath: '/Users/andreas/Projects',
      browseParent: '/Users/andreas',
      browseDirs: ['2212', 'Blog', 'BSCwebsite', 'Pangea', 'Tindelder'],
    },
    nav: { highlightedIndex: 4 },
  },
  answering: {
    title: 'answering — AskUserQuestion picker',
    screen: answeringScreen,
    snapshot: {
      ...base,
      mode: 'answering',
      activeSessionId: 'a1',
      pendingQuestion: {
        toolUseId: 'q1',
        text: 'Which fix do you prefer?',
        options: ['Patch the parser', 'Pin the timezone', 'Skip the test'],
      },
    },
    nav: { highlightedIndex: 1 },
  },
}

function box(title: string, lines: { text: string; style: string; inverted: boolean }[]): string {
  const top = `┌─ ${title} ` + '─'.repeat(Math.max(0, WIDTH - title.length - 3)) + '┐'
  const body = lines.map((l) => {
    const text = l.style === 'separator' ? '─'.repeat(WIDTH) : l.text
    const marked = l.inverted ? `▸${text}` : text
    const padded = marked.length > WIDTH ? marked.slice(0, WIDTH) : marked.padEnd(WIDTH)
    return `│${padded}│`
  })
  const bottom = '└' + '─'.repeat(WIDTH) + '┘'
  return [top, ...body, bottom].join('\n')
}

const only = process.argv[2]
for (const [name, p] of Object.entries(previews)) {
  if (only && name !== only && !name.startsWith(only)) continue
  const nav: GlassNavState = { screen: p.snapshot.mode, highlightedIndex: 0, ...p.nav }
  const { lines } = p.screen.display(p.snapshot, nav)
  console.log(box(p.title, lines as never))
  console.log()
}
