/**
 * Key user flows at the state level, independent of UI layout.
 * Safety net for refactoring: only imports go through the public APIs of slices.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PRESETS,
  ZOOM_MAX,
  ZOOM_MIN,
  buildLevelsLuts,
  convolve3x3,
  identitySettings,
  type RasterImage,
} from '@/lib/image'
import { downloadBlob } from '@/lib/io'
import { makeGb7 } from './test'
import { MAX_VERSIONS, currentVersion } from '@/store/document'
import { editorStore, resetEditorStore, setDialog, toggleChannel } from '@/store/editor'
import { applyLevelsToDocument } from '@/store/actions/levels'
import { applyFilterResult } from '@/store/actions/filter'
import { openFile } from '@/store/actions/open'
import { pickAt } from '@/store/actions/pick'
import { resizeDocument } from '@/store/actions/resize'
import { saveAs } from '@/store/actions/save'
import { revertToOriginal, undoVersion } from '@/store/actions/undo'
import { fitToView, setZoom, zoomBy } from '@/store/actions/zoom'

vi.mock('@/lib/io/download', () => ({ downloadBlob: vi.fn() }))
const download = vi.mocked(downloadBlob)

const VIEWPORT = { cssWidth: 800, cssHeight: 600, dpr: 1 }

/** 4×2 grayscale GB7: gradient 0, 20, 40, … (7-bit levels). */
function gradientFile(name = 'grad.gb7'): File {
  return new File([makeGb7(4, 2, [0, 20, 40, 60, 80, 100, 120, 127])], name)
}

const state = () => editorStore.getState()
const current = () => currentVersion(state().doc!)
const pixels = (img: RasterImage) => Array.from(img.data)
const labels = () => state().doc!.versions.map((v) => v.label)

async function openGradient() {
  const result = await openFile(gradientFile())
  expect(result).toEqual({ status: 'opened' })
}

beforeEach(() => {
  resetEditorStore()
  editorStore.setState((s) => ({ ...s, viewport: VIEWPORT }))
})
afterEach(() => vi.clearAllMocks())

describe('open', () => {
  it('GB7 file becomes a document with one version «Открыто»', async () => {
    await openGradient()
    const doc = state().doc!
    expect(doc.source.fileName).toBe('grad.gb7')
    expect(doc.source.format).toBe('gb7')
    expect(labels()).toEqual(['Открыто'])
    expect(current().image).toMatchObject({ width: 4, height: 2 })
    expect(current().layout).toBe('gray')
    expect(current().levelMax).toBe(127)
    expect(state().busy).toBe(false)
  })

  it('opened image is fitted into the viewport', async () => {
    await openGradient()
    expect(state().view).toEqual({ zoom: ZOOM_MAX, scrollX: 0, scrollY: 0 })
  })

  it('broken file reports an error and keeps the open document', async () => {
    await openGradient()
    const before = state().doc
    const result = await openFile(new File([new Uint8Array([1, 2, 3])], 'bad.txt'))
    expect(result.status).toBe('error')
    expect(state().doc).toBe(before)
    expect(state().busy).toBe(false)
  })
})

describe('edit operations push undoable versions', () => {
  it('levels: brightens the image, cancel (null) adds nothing', async () => {
    await openGradient()
    const original = pixels(current().image)

    applyLevelsToDocument(null)
    expect(labels()).toEqual(['Открыто'])

    const settings = identitySettings(127)
    settings.master = { black: 0, gamma: 1, white: 64 }
    applyLevelsToDocument(buildLevelsLuts(settings, 127))

    expect(labels()).toEqual(['Открыто', 'Уровни'])
    const after = pixels(current().image)
    for (let i = 0; i < after.length; i += 4) {
      expect(after[i]).toBeGreaterThanOrEqual(original[i]!)
    }
    expect(after).not.toEqual(original)
    expect(state().dialog).toBeNull()
  })

  it('filter: box blur result becomes «Фильтр»', async () => {
    await openGradient()
    const v = current()
    const blurred = convolve3x3(
      v.image,
      PRESETS.box.kernel,
      { r: true, g: true, b: true, a: false },
      'replicate',
      v.levelMax,
    )
    applyFilterResult(blurred)
    expect(labels()).toEqual(['Открыто', 'Фильтр'])
    expect(current().image).toBe(blurred)
    expect(pixels(blurred)).not.toEqual(pixels(v.image))
  })

  it('resize: new size, nearest keeps pixel values', async () => {
    await openGradient()
    const values = new Set(pixels(current().image))
    await expect(resizeDocument(8, 4, 'nearest')).resolves.toBe(true)
    expect(labels()).toEqual(['Открыто', 'Размер'])
    expect(current().image).toMatchObject({ width: 8, height: 4 })
    for (const p of pixels(current().image)) expect(values.has(p)).toBe(true)
  })

  it('resize: stale when the document changed while it ran', async () => {
    await openGradient()
    const pending = resizeDocument(2, 1, 'bilinear')
    applyFilterResult(current().image)
    await expect(pending).resolves.toBe(false)
    expect(labels()).toEqual(['Открыто', 'Фильтр'])
  })
})

describe('undo and revert', () => {
  it('undo walks back; nothing to undo on the first version', async () => {
    await openGradient()
    const original = current().image
    undoVersion()
    expect(state().doc!.currentIndex).toBe(0)

    await resizeDocument(2, 1, 'nearest')
    undoVersion()
    expect(current().image).toBe(original)
  })

  it('revert to original is itself undoable', async () => {
    await openGradient()
    const original = current().image
    await resizeDocument(2, 1, 'nearest')
    const edited = current().image

    revertToOriginal()
    expect(current().label).toBe('Исходное')
    expect(current().image).toBe(original)

    undoVersion()
    expect(current().image).toBe(edited)
  })

  it('history is capped, the opened version always stays', async () => {
    await openGradient()
    const original = state().doc!.versions[0]
    for (let i = 0; i < MAX_VERSIONS + 3; i++) {
      applyFilterResult(current().image)
    }
    expect(state().doc!.versions).toHaveLength(MAX_VERSIONS)
    expect(state().doc!.versions[0]).toBe(original)
  })
})

describe('view and inspection', () => {
  it('zoom: set, clamp, fit, zoom by factor', async () => {
    await openGradient()
    setZoom(1)
    expect(state().view.zoom).toBe(1)
    setZoom(100)
    expect(state().view.zoom).toBe(ZOOM_MAX)
    setZoom(0.0001)
    expect(state().view.zoom).toBe(ZOOM_MIN)
    zoomBy(2, { x: 400, y: 300 })
    expect(state().view.zoom).toBeCloseTo(ZOOM_MIN * 2)
    fitToView()
    expect(state().view).toEqual({ zoom: ZOOM_MAX, scrollX: 0, scrollY: 0 })
  })

  it('eyedropper reads the pixel under the cursor, ignores clicks outside', async () => {
    await openGradient()
    setZoom(1)
    // image 4×2 centred in 800×600 at 100 %: top-left at (398, 299)
    pickAt(398 + 3, 299 + 1, VIEWPORT)
    const picked = state().picked!
    expect(picked).toMatchObject({ x: 3, y: 1 })
    expect(picked.r).toBe(current().image.data[(1 * 4 + 3) * 4])

    pickAt(5, 5, VIEWPORT)
    expect(state().picked).toBe(picked)
  })

  it('channels: the last visible channel cannot be switched off', async () => {
    await openGradient()
    const after = toggleChannel(state(), 'gray')
    expect(after).toBe(state())
    expect(toggleChannel(state(), 'a').channels.a).toBe(false)
  })
})

describe('save', () => {
  it('GB7 round trip: saved file reopens with identical pixels', async () => {
    await openGradient()
    await resizeDocument(8, 4, 'nearest')
    const expected = pixels(current().image)
    editorStore.setState((s) => setDialog(s, 'save'))

    await saveAs({ format: 'gb7', name: 'out' })

    expect(download).toHaveBeenCalledTimes(1)
    const [blob, fileName] = download.mock.calls[0]!
    expect(fileName).toBe('out.gb7')
    expect(state().dialog).toBeNull()

    await openFile(new File([blob], fileName))
    expect(current().image).toMatchObject({ width: 8, height: 4 })
    expect(pixels(current().image)).toEqual(expected)
  })
})

describe('full session', () => {
  it('open → levels → filter → resize → undo → revert → close', async () => {
    await openGradient()
    const settings = identitySettings(127)
    settings.master = { black: 10, gamma: 1, white: 120 }
    applyLevelsToDocument(buildLevelsLuts(settings, 127))
    const v = current()
    applyFilterResult(
      convolve3x3(
        v.image,
        PRESETS.sharpen.kernel,
        { r: true, g: true, b: true, a: false },
        'replicate',
        v.levelMax,
      ),
    )
    await resizeDocument(2, 1, 'bilinear')
    expect(labels()).toEqual(['Открыто', 'Уровни', 'Фильтр', 'Размер'])

    undoVersion()
    expect(current().label).toBe('Фильтр')

    revertToOriginal()
    expect(labels()).toEqual(['Открыто', 'Уровни', 'Фильтр', 'Исходное'])
    expect(current().image).toMatchObject({ width: 4, height: 2 })
  })
})
