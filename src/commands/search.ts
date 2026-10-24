import { GROUP_TITLE, type RegisteredCommand } from './commands'

const norm = (s: string) => s.toLowerCase().replaceAll('ё', 'е').trim()

/**
 * Palette search: every word of the query must occur in the title, aliases or group.
 * Title prefix beats title substring beats alias match; recently used commands go first among equals.
 */
export function searchCommands(
  commands: readonly RegisteredCommand[],
  query: string,
  recent: readonly string[] = [],
): RegisteredCommand[] {
  const q = norm(query)
  const words = q.split(/\s+/).filter(Boolean)
  const recency = (c: RegisteredCommand) => {
    const i = recent.indexOf(c.id)
    return i < 0 ? Infinity : i
  }
  const rank = (c: RegisteredCommand) => {
    const title = norm(c.title)
    return title.startsWith(q) ? 0 : title.includes(q) ? 1 : 2
  }
  return commands
    .map((c, order) => ({ c, order }))
    .filter(({ c }) => {
      const hay = norm([c.title, GROUP_TITLE[c.group], ...(c.aliases ?? [])].join(' '))
      return words.every((w) => hay.includes(w))
    })
    .sort(
      (a, b) =>
        (words.length ? rank(a.c) - rank(b.c) : 0) ||
        recency(a.c) - recency(b.c) ||
        a.order - b.order,
    )
    .map(({ c }) => c)
}
