import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EditorPage } from '@/components/EditorPage/EditorPage'
import { editorStore, resetEditorStore } from '@/store/editor'
import { gb7File, renderWithProviders } from '@/test'

vi.mock('@/lib/io/decode-browser', () => ({ decodeWithBrowser: vi.fn() }))

beforeEach(() => {
  resetEditorStore()
  localStorage.clear()
})

const ctrlK = () =>
  fireEvent.keyDown(document.documentElement, { key: 'k', code: 'KeyK', ctrlKey: true })

async function openImage() {
  fireEvent.change(screen.getByTestId('open-file-input'), {
    target: { files: [gb7File(2, 2)] },
  })
  await waitFor(() => expect(editorStore.getState().doc).not.toBeNull())
}

describe('command palette', () => {
  it('Ctrl+K opens it; search + Enter runs the command', async () => {
    const user = userEvent.setup()
    renderWithProviders(<EditorPage />)
    await openImage()
    ctrlK()
    const input = await screen.findByRole('textbox', { name: 'Поиск команды' })
    await user.type(input, 'размытие{Enter}')
    expect(editorStore.getState().dialog).toBe('filter')
  })

  it('unavailable commands are shown but disabled', async () => {
    renderWithProviders(<EditorPage />)
    ctrlK()
    expect(await screen.findByRole('option', { name: /Уровни/ })).toBeDisabled()
    expect(screen.getByRole('option', { name: /Открыть/ })).toBeEnabled()
  })

  it('arrows move the selection; menu button opens it too; used command becomes recent', async () => {
    const user = userEvent.setup()
    renderWithProviders(<EditorPage />)
    await openImage()
    await user.click(screen.getByRole('button', { name: /Команды/ }))
    const input = await screen.findByRole('textbox', { name: 'Поиск команды' })
    await user.type(input, 'масштаб')
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowDown}')
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByRole('option', { name: /Масштаб 100/ }))
    expect(editorStore.getState().dialog).toBeNull()
    expect(editorStore.getState().view.zoom).toBe(1)

    ctrlK()
    const first = (await screen.findAllByRole('option'))[0]
    expect(first).toHaveTextContent('Масштаб 100 %')
    expect(first).toHaveTextContent('недавно')
  })
})
