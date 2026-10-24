import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRaster } from '@/lib/image'
import { createDocument, pushVersion } from '@/store/document'
import { editorStore, resetEditorStore, setDocument } from '@/store/editor'
import { COMMANDS, getCommand, runCommand } from './commands'

const ctx = { requestOpen: vi.fn() }

function openDoc(edits = 0) {
  let doc = createDocument(
    {
      format: 'png',
      fileName: 'a.png',
      bitDepth: 24,
      depthLabel: '',
      sourceWidth: 2,
      sourceHeight: 2,
      gb7HasMask: false,
    },
    { image: createRaster(2, 2), layout: 'rgb', levelMax: 255 },
  )
  for (let i = 0; i < edits; i++)
    doc = pushVersion(doc, 'Фильтр', { image: createRaster(2, 2), layout: 'rgb', levelMax: 255 })
  editorStore.setState((s) => setDocument(s, doc))
}

beforeEach(() => {
  resetEditorStore()
  ctx.requestOpen.mockClear()
})

describe('command registry', () => {
  it('ids and shortcuts are unique', () => {
    const ids = COMMANDS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    const keys = COMMANDS.flatMap((c) => c.keys ?? []).map((k) => k.toLowerCase())
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('without a document only open, tools and palette are available', () => {
    const available = COMMANDS.filter((c) => c.enabled(editorStore.getState())).map((c) => c.id)
    expect(available.sort()).toEqual(
      ['app.palette', 'file.open', 'tool.eyedropper', 'tool.pointer'].sort(),
    )
  })

  it('undo and revert need a version to go back to', () => {
    openDoc()
    expect(getCommand('edit.undo').enabled(editorStore.getState())).toBe(false)
    expect(getCommand('file.revert').enabled(editorStore.getState())).toBe(false)
    openDoc(1)
    expect(getCommand('edit.undo').enabled(editorStore.getState())).toBe(true)
    expect(getCommand('file.revert').enabled(editorStore.getState())).toBe(true)
  })

  it('runCommand skips unavailable commands', () => {
    expect(runCommand('image.levels', ctx)).toBe(false)
    expect(editorStore.getState().dialog).toBeNull()
    openDoc()
    expect(runCommand('image.levels', ctx)).toBe(true)
    expect(editorStore.getState().dialog).toBe('levels')
  })

  it('open asks React for the file picker', () => {
    runCommand('file.open', ctx)
    expect(ctx.requestOpen).toHaveBeenCalledTimes(1)
  })

  it('dialogs, tools, undo, zoom and close change the state', () => {
    openDoc(1)
    editorStore.setState((s) => ({ ...s, viewport: { cssWidth: 800, cssHeight: 600, dpr: 1 } }))
    for (const [id, dialog] of [
      ['file.save', 'save'],
      ['image.resize', 'resize'],
      ['filter.convolve', 'filter'],
      ['app.palette', 'palette'],
    ] as const) {
      editorStore.setState((s) => ({ ...s, dialog: null }))
      runCommand(id, ctx)
      expect(editorStore.getState().dialog).toBe(dialog)
    }
    runCommand('tool.eyedropper', ctx)
    expect(editorStore.getState().activeTool).toBe('eyedropper')
    runCommand('view.actual', ctx)
    expect(editorStore.getState().view.zoom).toBe(1)
    runCommand('view.zoomIn', ctx)
    expect(editorStore.getState().view.zoom).toBe(1.5)
    runCommand('view.zoomOut', ctx)
    expect(editorStore.getState().view.zoom).toBe(1)
    runCommand('edit.undo', ctx)
    expect(editorStore.getState().doc?.currentIndex).toBe(0)
    runCommand('file.close', ctx)
    expect(editorStore.getState().doc).toBeNull()
  })
})
