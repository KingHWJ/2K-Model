import { describe, expect, it } from 'vitest'

import type { AppState } from '../types'
import { createDefaultAppState } from '../data/defaults'
import { STORAGE_KEY, loadAppState, saveAppState } from './storage'

describe('storage', () => {
  it('在本地没有数据时会回退到默认状态', () => {
    const storage = createMemoryStorage()

    const state = loadAppState(storage, createDefaultAppState())

    expect(state.presets).toHaveLength(1)
    expect(state.players.length).toBeGreaterThan(5)
    expect(state.session.templateName).toBe('未命名模板')
  })

  it('会保存并恢复最新状态', () => {
    const storage = createMemoryStorage()
    const baseState = createDefaultAppState()
    const nextState: AppState = {
      ...baseState,
      templates: [
        {
          id: 'template-1',
          name: '模板1',
          presetId: baseState.presets[0].id,
          candidateCount: 4,
          candidatePlayerIds: ['jordan', 'kobe', 'lebron', 'durant'],
          assignments: {},
          summary: {
            overall: 98,
            position: 'SG/SF',
            tags: ['半神半人'],
            categorySources: [],
          },
          createdAt: '2026-03-25T11:00:00.000Z',
          updatedAt: '2026-03-25T11:00:00.000Z',
        },
      ],
    }

    saveAppState(storage, nextState)
    const restored = loadAppState(storage, createDefaultAppState())

    expect(storage.getItem(STORAGE_KEY)).toContain('"version":1')
    expect(restored.templates[0].name).toBe('模板1')
  })

  it('遇到损坏数据时会安全回退到默认状态', () => {
    const storage = createMemoryStorage()
    storage.setItem(STORAGE_KEY, '{broken-json')

    const restored = loadAppState(storage, createDefaultAppState())

    expect(restored.players[0].name).toBe('迈克尔·乔丹')
  })
})

function createMemoryStorage(): Storage {
  const bucket = new Map<string, string>()

  return {
    get length() {
      return bucket.size
    },
    clear() {
      bucket.clear()
    },
    getItem(key) {
      return bucket.get(key) ?? null
    },
    key(index) {
      return [...bucket.keys()][index] ?? null
    },
    removeItem(key) {
      bucket.delete(key)
    },
    setItem(key, value) {
      bucket.set(key, value)
    },
  }
}
