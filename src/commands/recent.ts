const KEY = 'prizma:recent-commands'
const LIMIT = 5

/** Recently used command ids, newest first. Survives reloads when storage is available. */
export function loadRecent(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function pushRecent(id: string): string[] {
  const next = [id, ...loadRecent().filter((x) => x !== id)].slice(0, LIMIT)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // storage unavailable: recency is a convenience only
  }
  return next
}
