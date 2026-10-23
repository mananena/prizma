import { Button, Group, Kbd, Menu, Text } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import type { CommandId } from '@/commands/commands'
import { useCommand } from '@/hooks/useCommand'
import classes from './MenuBar.module.css'

/** Menu item driven by the command registry: label, shortcut hint and availability. */
function CommandItem({ id }: { id: CommandId }) {
  const cmd = useCommand(id)
  return (
    <Menu.Item
      disabled={!cmd.enabled}
      onClick={cmd.run}
      rightSection={
        cmd.hint && (
          <Text size="xs" c="dimmed">
            {cmd.hint}
          </Text>
        )
      }
    >
      {cmd.title}
    </Menu.Item>
  )
}

const MENUS: { title: string; items: (CommandId | '-')[] }[] = [
  { title: 'Файл', items: ['file.open', 'file.save', '-', 'file.revert', 'file.close'] },
  { title: 'Изображение', items: ['edit.undo', '-', 'image.levels', 'image.resize'] },
  { title: 'Фильтр', items: ['filter.convolve'] },
  { title: 'Вид', items: ['view.zoomIn', 'view.zoomOut', '-', 'view.fit', 'view.actual'] },
]

function PaletteButton() {
  const cmd = useCommand('app.palette')
  return (
    <Button
      variant="default"
      size="compact-sm"
      ml="auto"
      className={classes.palette}
      aria-label={`Команды${cmd.hint ? ` (${cmd.hint})` : ''}`}
      onClick={cmd.run}
      leftSection={<IconSearch size={14} />}
      rightSection={cmd.hint && <Kbd size="xs">{cmd.hint}</Kbd>}
    >
      <span className={classes.paletteText}>Команды</span>
    </Button>
  )
}

export function MenuBar() {
  return (
    <Group gap={0} className={classes.root} role="menubar">
      <span className={classes.brand} aria-label="Призма" role="img">
        <span className={classes.mark} aria-hidden>
          Призма
        </span>
      </span>
      {MENUS.map((menu) => (
        <Menu key={menu.title} position="bottom-start">
          <Menu.Target>
            <Button variant="subtle" color="gray" className={classes.menuButton}>
              {menu.title}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            {menu.items.map((item, i) =>
              item === '-' ? <Menu.Divider key={i} /> : <CommandItem key={item} id={item} />,
            )}
          </Menu.Dropdown>
        </Menu>
      ))}
      <PaletteButton />
    </Group>
  )
}
