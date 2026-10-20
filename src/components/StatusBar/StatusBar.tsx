import { Group, Text } from '@mantine/core'
import { CHANNEL_LABEL, channelsForLayout, type ChannelId } from '@/lib/image'
import { formatStatusText } from '@/store/status-text'
import { useEditor } from '@/store/editor'
import classes from './StatusBar.module.css'

/** One lit segment per visible channel of the current version. */
function ChannelStrip() {
  const layout = useEditor((s) => (s.doc ? s.doc.versions[s.doc.currentIndex]?.layout : undefined))
  const channels = useEditor((s) => s.channels)
  if (!layout) return null
  const ids: readonly ChannelId[] = channelsForLayout(layout)
  const visible = ids.filter((c) => channels[c]).map((c) => CHANNEL_LABEL[c])
  return (
    <span
      className={classes.strip}
      role="img"
      aria-label={`Видимые каналы: ${visible.join(', ') || 'нет'}`}
      title={`Видимые каналы: ${visible.join(', ')}`}
    >
      {ids.map((c) => (
        <span
          key={c}
          className={classes.segment}
          data-channel={c}
          data-on={channels[c] || undefined}
        />
      ))}
    </span>
  )
}

/** File name · size, depth, format · visible channels · zoom. */
export function StatusBar() {
  const doc = useEditor((s) => s.doc)
  const zoom = useEditor((s) => s.view.zoom)
  return (
    <Group className={classes.root} role="status" justify="space-between" wrap="nowrap" gap="md">
      <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
        {doc && (
          <Text size="xs" fw={600} truncate="end" maw={260} title={doc.source.fileName}>
            {doc.source.fileName}
          </Text>
        )}
        <Text size="xs" c="dimmed" truncate="end">
          {formatStatusText(doc)}
        </Text>
      </Group>
      {doc && (
        <Group gap="md" wrap="nowrap">
          <ChannelStrip />
          <Text size="xs" fw={500} className={classes.zoom}>
            {Math.round(zoom * 100)} %
          </Text>
        </Group>
      )}
    </Group>
  )
}
