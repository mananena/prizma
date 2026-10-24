import { describe, expect, it } from 'vitest'
import { COMMANDS } from './commands'
import { searchCommands } from './search'

const ids = (q: string, recent?: string[]) => searchCommands(COMMANDS, q, recent).map((c) => c.id)

describe('command search', () => {
  it('empty query lists everything in registry order', () => {
    expect(ids('')).toEqual(COMMANDS.map((c) => c.id))
  })

  it('recent commands go first on an empty query', () => {
    expect(ids('', ['image.levels', 'file.save']).slice(0, 2)).toEqual([
      'image.levels',
      'file.save',
    ])
  })

  it('finds by alias, case and ё insensitive', () => {
    expect(ids('РАЗМЫТИЕ')).toEqual(['filter.convolve'])
    expect(ids('свертка')).toEqual(['filter.convolve'])
    expect(ids('гамма')).toEqual(['image.levels'])
  })

  it('all words must match; title prefix ranks first', () => {
    expect(ids('масштаб 100')).toEqual(['view.actual'])
    expect(ids('масштаб')[0]).toBe('view.actual')
    expect(ids('нет такой команды')).toEqual([])
  })
})
