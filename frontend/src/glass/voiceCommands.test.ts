import { describe, expect, test } from 'bun:test'
import { appCommandFor, normalizeSpokenCommand } from './voiceCommands'

describe('normalizeSpokenCommand', () => {
  test('bare command with Whisper punctuation', () => {
    expect(normalizeSpokenCommand('Slash exit.')).toBe('/exit')
    expect(normalizeSpokenCommand('Slash, clear.')).toBe('/clear')
    expect(normalizeSpokenCommand('slash quit')).toBe('/quit')
  })

  test('command with arguments keeps the args', () => {
    expect(normalizeSpokenCommand('Slash commit please.')).toBe('/commit please')
    expect(normalizeSpokenCommand('slash compact focus on the auth flow')).toBe(
      '/compact focus on the auth flow',
    )
  })

  test('command word is lowercased, args keep their case', () => {
    expect(normalizeSpokenCommand('Slash Commit Fix The CSV')).toBe('/commit Fix The CSV')
  })

  test('ordinary sentences pass through untouched', () => {
    expect(normalizeSpokenCommand('fix the failing test')).toBe('fix the failing test')
    expect(normalizeSpokenCommand('slashing costs is the goal')).toBe(
      'slashing costs is the goal',
    )
    expect(normalizeSpokenCommand('add a slash to the URL')).toBe('add a slash to the URL')
  })

  test('only a leading slash-word triggers rewriting', () => {
    expect(normalizeSpokenCommand('please slash exit')).toBe('please slash exit')
  })
})

describe('appCommandFor', () => {
  test('close and clear commands resolve', () => {
    expect(appCommandFor('/exit')).toBe('close-session')
    expect(appCommandFor('/quit')).toBe('close-session')
    expect(appCommandFor('/close')).toBe('close-session')
    expect(appCommandFor('/clear')).toBe('clear-session')
    expect(appCommandFor('/EXIT')).toBe('close-session')
  })

  test('everything else goes to Claude', () => {
    expect(appCommandFor('/commit')).toBeNull()
    expect(appCommandFor('/compact')).toBeNull()
    expect(appCommandFor('fix the test')).toBeNull()
  })
})
