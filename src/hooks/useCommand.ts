import { useCallback } from 'react'
import { getCommand, runCommand, type CommandId } from '@/commands/commands'
import { formatKeys } from '@/lib/shortcut'
import { useEditor } from '@/store/editor'
import { useRequestOpen } from './useRequestOpen'

export interface BoundCommand {
  title: string
  /** First shortcut, formatted for the platform. */
  hint: string | undefined
  enabled: boolean
  run: () => void
}

/** A registry command bound to the current state and React context. */
export function useCommand(id: CommandId): BoundCommand {
  const cmd = getCommand(id)
  const enabled = useEditor(cmd.enabled)
  const requestOpen = useRequestOpen()
  const run = useCallback(() => void runCommand(id, { requestOpen }), [id, requestOpen])
  const first = cmd.keys?.[0]
  return { title: cmd.title, hint: first ? formatKeys(first) : undefined, enabled, run }
}
