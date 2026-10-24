import { useHotkeys } from '@mantine/hooks'
import { useMemo } from 'react'
import { COMMANDS, runCommand } from '@/commands/commands'
import { editorStore } from '@/store/editor'
import { useRequestOpen } from './useRequestOpen'

/** Every command shortcut from the registry; all ignored while a dialog is open. */
export function useCommandHotkeys(): void {
  const requestOpen = useRequestOpen()
  const hotkeys = useMemo(
    () =>
      COMMANDS.flatMap((cmd) =>
        (cmd.keys ?? []).map((key): [string, () => void] => [
          key,
          () => {
            if (editorStore.getState().dialog === null) runCommand(cmd.id, { requestOpen })
          },
        ]),
      ),
    [requestOpen],
  )
  useHotkeys(hotkeys)
}
