import { ZOOM_PRESETS } from '@/lib/image'
import { revertToOriginal, undoVersion } from '@/store/actions/undo'
import { fitToView, setZoom } from '@/store/actions/zoom'
import {
  closeDocument,
  editorStore,
  setDialog,
  type DialogKind,
  type EditorState,
} from '@/store/editor'

/** Things a command may need from React (the hidden file input). */
export interface CommandContext {
  requestOpen: () => void
}

export type CommandGroup = 'app' | 'file' | 'edit' | 'image' | 'filter' | 'view' | 'tool'

export const GROUP_TITLE: Record<CommandGroup, string> = {
  app: 'Приложение',
  file: 'Файл',
  edit: 'Правка',
  image: 'Изображение',
  filter: 'Фильтр',
  view: 'Вид',
  tool: 'Инструмент',
}

/**
 * One user action, described once. Menu, toolbar, hotkeys and the command palette
 * are all built from this list, so labels, shortcuts and availability never drift apart.
 */
export interface Command {
  id: string
  title: string
  group: CommandGroup
  /** Mantine hotkey notation; the first one is shown in hints. */
  keys?: readonly string[]
  /** Extra words for palette search. */
  aliases?: readonly string[]
  enabled: (s: EditorState) => boolean
  run: (ctx: CommandContext) => void
}

const always = () => true
const hasDoc = (s: EditorState) => s.doc !== null
const canUndo = (s: EditorState) => (s.doc ? s.doc.currentIndex > 0 : false)

const openDialog = (dialog: DialogKind) => () => editorStore.setState((s) => setDialog(s, dialog))

const setTool = (tool: EditorState['activeTool']) => () =>
  editorStore.setState((s) => (s.activeTool === tool ? s : { ...s, activeTool: tool }))

function stepZoom(dir: 1 | -1) {
  const z = editorStore.getState().view.zoom
  const next =
    dir > 0
      ? ZOOM_PRESETS.find((p) => p > z + 1e-9)
      : [...ZOOM_PRESETS].reverse().find((p) => p < z - 1e-9)
  if (next !== undefined) setZoom(next)
}

const DEFINITIONS = [
  {
    id: 'file.open',
    title: 'Открыть…',
    group: 'file',
    keys: ['mod+O'],
    aliases: ['файл', 'загрузить'],
    enabled: always,
    run: (ctx) => ctx.requestOpen(),
  },
  {
    id: 'file.save',
    title: 'Сохранить как…',
    group: 'file',
    keys: ['mod+S', 'mod+shift+S'],
    aliases: ['экспорт', 'скачать', 'png', 'jpeg', 'gb7'],
    enabled: hasDoc,
    run: openDialog('save'),
  },
  {
    id: 'file.revert',
    title: 'Вернуть исходное',
    group: 'file',
    aliases: ['оригинал', 'сброс'],
    enabled: canUndo,
    run: revertToOriginal,
  },
  {
    id: 'file.close',
    title: 'Закрыть',
    group: 'file',
    enabled: hasDoc,
    run: () => editorStore.setState(closeDocument),
  },
  {
    id: 'edit.undo',
    title: 'Отменить',
    group: 'edit',
    keys: ['mod+Z'],
    aliases: ['назад'],
    enabled: canUndo,
    run: undoVersion,
  },
  {
    id: 'image.levels',
    title: 'Уровни…',
    group: 'image',
    keys: ['mod+L'],
    aliases: ['гистограмма', 'яркость', 'гамма'],
    enabled: hasDoc,
    run: openDialog('levels'),
  },
  {
    id: 'image.resize',
    title: 'Размер изображения…',
    group: 'image',
    keys: ['mod+alt+I'],
    aliases: ['масштабирование', 'интерполяция'],
    enabled: hasDoc,
    run: openDialog('resize'),
  },
  {
    id: 'filter.convolve',
    title: 'Свёртка 3×3…',
    group: 'filter',
    keys: ['mod+shift+F'],
    aliases: ['фильтр', 'размытие', 'резкость', 'гаусс', 'ядро'],
    enabled: hasDoc,
    run: openDialog('filter'),
  },
  {
    id: 'view.zoomIn',
    title: 'Крупнее',
    group: 'view',
    keys: ['mod+=', 'mod+shift+='],
    aliases: ['масштаб', 'приблизить'],
    enabled: hasDoc,
    run: () => stepZoom(1),
  },
  {
    id: 'view.zoomOut',
    title: 'Мельче',
    group: 'view',
    keys: ['mod+-'],
    aliases: ['масштаб', 'отдалить'],
    enabled: hasDoc,
    run: () => stepZoom(-1),
  },
  {
    id: 'view.fit',
    title: 'Вписать в окно',
    group: 'view',
    keys: ['mod+0'],
    aliases: ['масштаб'],
    enabled: hasDoc,
    run: fitToView,
  },
  {
    id: 'view.actual',
    title: 'Масштаб 100 %',
    group: 'view',
    keys: ['mod+1'],
    aliases: ['реальный размер'],
    enabled: hasDoc,
    run: () => setZoom(1),
  },
  {
    id: 'tool.pointer',
    title: 'Указатель',
    group: 'tool',
    keys: ['V'],
    enabled: always,
    run: setTool('pointer'),
  },
  {
    id: 'tool.eyedropper',
    title: 'Пипетка',
    group: 'tool',
    keys: ['I'],
    aliases: ['цвет', 'lab', 'rgb'],
    enabled: always,
    run: setTool('eyedropper'),
  },
  {
    id: 'app.palette',
    title: 'Палитра команд',
    group: 'app',
    keys: ['mod+K'],
    aliases: ['поиск', 'команды'],
    enabled: always,
    run: openDialog('palette'),
  },
] as const satisfies readonly Command[]

export type CommandId = (typeof DEFINITIONS)[number]['id']
export type RegisteredCommand = Command & { id: CommandId }

/** All commands in menu order. */
export const COMMANDS: readonly RegisteredCommand[] = DEFINITIONS

const byId = new Map<string, RegisteredCommand>(COMMANDS.map((c) => [c.id, c]))

export function getCommand(id: CommandId): RegisteredCommand {
  const cmd = byId.get(id)
  if (!cmd) throw new Error(`Нет команды ${id}`)
  return cmd
}

/** Runs the command if it is available in the current state. Returns whether it ran. */
export function runCommand(id: CommandId, ctx: CommandContext): boolean {
  const cmd = getCommand(id)
  if (!cmd.enabled(editorStore.getState())) return false
  cmd.run(ctx)
  return true
}
