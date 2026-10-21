import { Stack, Text } from '@mantine/core'
import { useEditor } from '@/store/editor'
import { ChannelsPanel } from './ChannelsPanel'
import { PickedInfo } from './PickedInfo'
import { ZoomControl } from '@/components/StatusBar/ZoomControl'
import classes from './SidePanel.module.css'
import { formatLabel } from '@/store/status-text'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack gap={6} className={classes.section}>
      <Text size="sm" fw={600} className={classes.title}>
        {title}
      </Text>
      {children}
    </Stack>
  )
}

export function SidePanel() {
  const doc = useEditor((s) => s.doc)
  return (
    <div className={classes.root}>
      <Section title="Каналы">
        <ChannelsPanel />
      </Section>
      <Section title="Инфо">
        {doc ? (
          <>
            <Text size="xs">Файл: {doc.source.fileName}</Text>
            <Text size="xs">Формат: {formatLabel(doc.source.format)}</Text>
            <ZoomControl />
            <PickedInfo />
          </>
        ) : (
          <Text size="xs" c="dimmed">
            Нет изображения
          </Text>
        )}
      </Section>
    </div>
  )
}
