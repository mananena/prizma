import { Kbd, Modal, Text, TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { useMemo, useState, type KeyboardEvent } from 'react'
import { COMMANDS, GROUP_TITLE, runCommand, type RegisteredCommand } from '@/commands/commands'
import { loadRecent, pushRecent } from '@/commands/recent'
import { searchCommands } from '@/commands/search'
import { useRequestOpen } from '@/hooks/useRequestOpen'
import { formatKeys } from '@/lib/shortcut'
import { editorStore, setDialog, useEditor } from '@/store/editor'
import classes from './CommandPalette.module.css'

const close = () => editorStore.setState((s) => setDialog(s, null))

function PaletteBody() {
  const requestOpen = useRequestOpen()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [recent] = useState(loadRecent)
  // availability depends on the document only; re-render when it changes
  useEditor((s) => s.doc)
  const state = editorStore.getState()
  const results = useMemo(
    () => searchCommands(COMMANDS, query, recent).filter((c) => c.id !== 'app.palette'),
    [query, recent],
  )
  const current = Math.min(active, Math.max(results.length - 1, 0))

  const run = (cmd: RegisteredCommand | undefined) => {
    if (!cmd || !cmd.enabled(state)) return
    close()
    pushRecent(cmd.id)
    runCommand(cmd.id, { requestOpen })
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((current + step + results.length) % Math.max(results.length, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(results[current])
    }
  }

  return (
    <>
      <TextInput
        data-autofocus
        aria-label="Поиск команды"
        placeholder="Что сделать? Например: размытие, уровни, 100 %"
        leftSection={<IconSearch size={14} />}
        value={query}
        onChange={(e) => {
          setQuery(e.currentTarget.value)
          setActive(0)
        }}
        onKeyDown={onKeyDown}
      />
      <div className={classes.list} role="listbox" aria-label="Команды">
        {results.length === 0 && (
          <Text size="sm" c="dimmed" p="sm">
            Ничего не найдено
          </Text>
        )}
        {results.map((cmd, i) => {
          const enabled = cmd.enabled(state)
          const hint = cmd.keys?.[0]
          return (
            <button
              key={cmd.id}
              type="button"
              role="option"
              aria-selected={i === current}
              data-active={i === current || undefined}
              disabled={!enabled}
              className={classes.item}
              onMouseEnter={() => setActive(i)}
              onClick={() => run(cmd)}
            >
              <span className={classes.group}>{GROUP_TITLE[cmd.group]}</span>
              <span className={classes.title}>{cmd.title}</span>
              {!query && recent.includes(cmd.id) && <span className={classes.recent}>недавно</span>}
              {hint && <Kbd size="xs">{formatKeys(hint)}</Kbd>}
            </button>
          )
        })}
      </div>
    </>
  )
}

/** Ctrl/⌘+K: search and run any command from the registry. */
export function CommandPalette() {
  const opened = useEditor((s) => s.dialog === 'palette')
  return (
    <Modal
      opened={opened}
      onClose={close}
      withCloseButton={false}
      size="lg"
      yOffset="12vh"
      title={null}
      aria-label="Палитра команд"
    >
      {opened && <PaletteBody />}
    </Modal>
  )
}
