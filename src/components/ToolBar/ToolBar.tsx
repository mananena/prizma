import { ActionIcon, Button, Group, Popover, Stack, Text, Tooltip } from '@mantine/core'
import {
  IconAdjustmentsHorizontal,
  IconArrowBackUp,
  IconColorPicker,
  IconDimensions,
  IconFilter,
  IconPointer,
  IconTrash,
  IconZoomIn,
  IconZoomOut,
} from '@tabler/icons-react'
import { useState, type ComponentType } from 'react'
import type { CommandId } from '@/commands/commands'
import { useCommand, type BoundCommand } from '@/hooks/useCommand'
import { closeDocument, editorStore, useEditor, type EditorState } from '@/store/editor'
import classes from './ToolBar.module.css'

type Icon = ComponentType<{ size?: number; stroke?: number }>

const label = (cmd: BoundCommand) =>
  `${cmd.title.replace(/…$/, '')}${cmd.hint ? ` (${cmd.hint})` : ''}`

/** Dock button backed by a registry command. */
function CommandButton({
  id,
  icon: Icon,
  active,
}: {
  id: CommandId
  icon: Icon
  active?: boolean
}) {
  const cmd = useCommand(id)
  const text = label(cmd)
  return (
    <Tooltip label={text} position="top">
      <ActionIcon
        aria-label={text}
        aria-pressed={active}
        data-active={active || undefined}
        className={classes.tool}
        variant="subtle"
        color="gray"
        disabled={!cmd.enabled}
        onClick={cmd.run}
      >
        <Icon size={18} stroke={1.6} />
      </ActionIcon>
    </Tooltip>
  )
}

const TOOLS: { tool: EditorState['activeTool']; command: CommandId; icon: Icon }[] = [
  { tool: 'pointer', command: 'tool.pointer', icon: IconPointer },
  { tool: 'eyedropper', command: 'tool.eyedropper', icon: IconColorPicker },
]

const ACTIONS: { command: CommandId; icon: Icon }[] = [
  { command: 'image.levels', icon: IconAdjustmentsHorizontal },
  { command: 'filter.convolve', icon: IconFilter },
  { command: 'image.resize', icon: IconDimensions },
]

const Sep = () => <span className={classes.sep} aria-hidden />

function ResetButton() {
  const hasDoc = useEditor((s) => s.doc !== null)
  const [confirming, setConfirming] = useState(false)
  return (
    <Popover
      opened={confirming}
      onChange={setConfirming}
      position="top-end"
      withArrow
      trapFocus
      returnFocus
    >
      <Popover.Target>
        <Tooltip label="Сбросить изображение" position="top" disabled={confirming}>
          <ActionIcon
            aria-label="Сбросить изображение"
            className={classes.tool}
            variant="light"
            color="red"
            disabled={!hasDoc}
            onClick={() => setConfirming((o) => !o)}
          >
            <IconTrash size={18} stroke={1.6} />
          </ActionIcon>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap={8} maw={230}>
          <Text size="sm" fw={600}>
            Сбросить изображение?
          </Text>
          <Text size="xs" c="dimmed">
            Холст очистится, сохранённая копия удалится. Отменить нельзя.
          </Text>
          <Group gap={6} justify="flex-end">
            <Button variant="default" size="xs" onClick={() => setConfirming(false)}>
              Отмена
            </Button>
            <Button
              color="red"
              size="xs"
              data-autofocus
              onClick={() => {
                setConfirming(false)
                editorStore.setState(closeDocument)
              }}
            >
              Сбросить
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}

/** Floating dock: tools, image operations, undo, zoom, reset. */
export function ToolBar() {
  const active = useEditor((s) => s.activeTool)
  return (
    <div className={classes.root} role="toolbar" aria-label="Инструменты">
      <Tooltip.Group openDelay={300} closeDelay={100}>
        {TOOLS.map((t) => (
          <CommandButton key={t.tool} id={t.command} icon={t.icon} active={active === t.tool} />
        ))}
        <Sep />
        {ACTIONS.map((a) => (
          <CommandButton key={a.command} id={a.command} icon={a.icon} />
        ))}
        <Sep />
        <CommandButton id="edit.undo" icon={IconArrowBackUp} />
        <CommandButton id="view.zoomOut" icon={IconZoomOut} />
        <CommandButton id="view.zoomIn" icon={IconZoomIn} />
        <Sep />
        <ResetButton />
      </Tooltip.Group>
    </div>
  )
}
