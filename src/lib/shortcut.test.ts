import { describe, expect, it } from 'vitest'
import { formatKeys } from './shortcut'

describe('formatKeys (non-mac)', () => {
  it('formats mantine hotkeys', () => {
    expect(formatKeys('mod+O')).toBe('Ctrl+O')
    expect(formatKeys('mod+shift+F')).toBe('Ctrl+Shift+F')
    expect(formatKeys('mod+alt+I')).toBe('Ctrl+Alt+I')
    expect(formatKeys('mod+=')).toBe('Ctrl+=')
    expect(formatKeys('V')).toBe('V')
  })
})
