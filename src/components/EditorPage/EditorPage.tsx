import { CommandPalette } from '@/components/CommandPalette/CommandPalette'
import { FilterDialog } from '@/components/dialogs/FilterDialog'
import { LevelsDialog } from '@/components/dialogs/LevelsDialog'
import { DropOverlay } from '@/components/DropOverlay/DropOverlay'
import { openAndNotify } from '@/store/actions/open-and-notify'
import { OpenFileProvider } from '@/components/OpenFileProvider'
import { useWindowFileDrop } from '@/hooks/useWindowFileDrop'
import { ResizeDialog } from '@/components/dialogs/ResizeDialog'
import { usePersistSession } from '@/store/session'
import { SaveDialog } from '@/components/dialogs/SaveDialog'
import { Viewport } from '@/components/Viewport/Viewport'
import { EditorLayout } from '@/components/EditorLayout/EditorLayout'
import { MenuBar } from '@/components/MenuBar/MenuBar'
import { SidePanel } from '@/components/SidePanel/SidePanel'
import { StatusBar } from '@/components/StatusBar/StatusBar'
import { ToolBar } from '@/components/ToolBar/ToolBar'
import { useCommandHotkeys } from '@/hooks/useCommandHotkeys'

function EditorShell() {
  useCommandHotkeys()
  usePersistSession()
  const dragging = useWindowFileDrop(openAndNotify)
  return (
    <>
      <DropOverlay visible={dragging} />
      <EditorLayout
        menuBar={<MenuBar />}
        toolBar={<ToolBar />}
        viewport={<Viewport />}
        sidePanel={<SidePanel />}
        statusBar={<StatusBar />}
      />
    </>
  )
}

/** The only page: editor shell plus all modal dialogs. */
export function EditorPage() {
  return (
    <OpenFileProvider>
      <EditorShell />
      <SaveDialog />
      <LevelsDialog />
      <ResizeDialog />
      <FilterDialog />
      <CommandPalette />
    </OpenFileProvider>
  )
}
