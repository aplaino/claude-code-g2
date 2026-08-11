// andreas-mods: spoken slash-command support.
//
// Whisper transcribes spoken slash commands as literal words ("Slash
// commit."). normalizeSpokenCommand rewrites "slash <word> ..." into
// "/<word> ..." after transcription, before the confirm screen — the wearer
// always sees the rewritten form before anything is sent.
//
// APP_COMMANDS never reach Claude: each turn runs a fresh `claude -p`
// process, so CLI built-ins like /exit and /clear have no REPL to act on.
// The app supplies the equivalent behavior itself:
//   close-session — leave the session view; the session stays in the list
//                   and resumes on reopen (CLI /exit).
//   clear-session — delete the current session entirely; one session is one
//                   context, so this is the app's /clear.

export type AppCommand = 'close-session' | 'clear-session'

export const APP_COMMANDS: Record<string, AppCommand> = {
  '/exit': 'close-session',
  '/quit': 'close-session',
  '/close': 'close-session',
  '/clear': 'clear-session',
}

export function normalizeSpokenCommand(text: string): string {
  const m = /^slash[,.]?\s+(\S+)(.*)$/i.exec(text.trim())
  if (!m) return text
  const command = m[1]!.toLowerCase().replace(/[.,!?]+$/, '')
  const rest = (m[2] ?? '').replace(/[.!?]+\s*$/, '').trim()
  return rest ? `/${command} ${rest}` : `/${command}`
}

export function appCommandFor(text: string): AppCommand | null {
  return APP_COMMANDS[text.trim().toLowerCase()] ?? null
}
