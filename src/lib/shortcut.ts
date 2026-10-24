const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

/** Mantine hotkey 'mod+shift+F' → '⇧⌘F' on macOS, 'Ctrl+Shift+F' elsewhere. */
export function formatKeys(hotkey: string): string {
  const parts = hotkey.split('+')
  // 'mod+shift+=' splits into ['mod', 'shift', '=']; a trailing '+' key would be lost, none is used
  const key = parts.pop() ?? ''
  const has = (m: string) => parts.includes(m)
  if (isMac) {
    return `${has('alt') ? '⌥' : ''}${has('shift') ? '⇧' : ''}${has('mod') ? '⌘' : ''}${key}`
  }
  return [has('mod') && 'Ctrl', has('alt') && 'Alt', has('shift') && 'Shift', key]
    .filter(Boolean)
    .join('+')
}
