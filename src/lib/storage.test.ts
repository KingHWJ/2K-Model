import { describe, expect, it } from 'vitest'

import type { AppState } from '../types'
import { createDefaultAppState } from '../data/defaults'
import { STORAGE_KEY, loadAppState, saveAppState } from './storage'

describe('storage', () => {
  it('在本地没有数据时会回退到新版默认状态', () => {
    const storage = createMemoryStorage()

    const state = loadAppState(storage, createDefaultAppState())

    expect(state.version).toBe(2)
    expect(state.recommendedTemplates.length).toBeGreaterThan(0)
    expect(state.numberFields.length).toBeGreaterThan(5)
    expect(state.players.length).toBeGreaterThan(5)
    expect(state.session.templateName).toBe('未命名模板')
    expect(state.numberSession.activeFieldId).toBe('body.height')
  })

  it('会保存并恢复最新状态与自定义封面', () => {
    const storage = createMemoryStorage()
    const baseState = createDefaultAppState()
    const nextState: AppState = {
      ...baseState,
      recommendedTemplates: baseState.recommendedTemplates.map((template, index) =>
        index === 0
          ? {
              ...template,
              customCover: 'data:image/png;base64,custom-cover',
            }
          : template,
      ),
      templates: [
        {
          id: 'template-1',
          name: '模板1',
          recommendedTemplateId: baseState.recommendedTemplates[0].id,
          candidatePlayerIds: ['jordan', 'kobe', 'shai', 'tatum'],
          fieldOrder: [...baseState.session.fieldOrder],
          currentFieldIndex: 1,
          fieldAssignments: {
            'body.height': {
              fieldId: 'body.height',
              playerId: 'jordan',
              value: '198cm',
              createdAt: '2026-03-25T11:00:00.000Z',
            },
          },
          coverImage: 'data:image/png;base64,custom-cover',
          summary: {
            overall: 98,
            tags: ['双向分卫'],
            recommendedTemplateName: '双向分卫模板',
            completedFields: 1,
            fieldResults: [
              {
                fieldId: 'body.height',
                fieldLabel: '身高',
                value: '198cm',
                playerName: '迈克尔·乔丹',
                note: '关键时刻终结能力顶级',
              },
            ],
          },
          createdAt: '2026-03-25T11:00:00.000Z',
          updatedAt: '2026-03-25T11:00:00.000Z',
        },
      ],
      numberSession: {
        ...baseState.numberSession,
        activeFieldId: 'body.height',
        results: {
          'body.height': {
            fieldId: 'body.height',
            value: 198,
            createdAt: '2026-03-25T11:00:00.000Z',
          },
        },
      },
    }

    saveAppState(storage, nextState)
    const restored = loadAppState(storage, createDefaultAppState())

    expect(storage.getItem(STORAGE_KEY)).toContain('"version":2')
    expect(restored.templates[0].name).toBe('模板1')
    expect(restored.recommendedTemplates[0].customCover).toBe(
      'data:image/png;base64,custom-cover',
    )
    expect(restored.numberSession.results['body.height']?.value).toBe(198)
  })

  it('遇到旧字段缺失时会补齐别名并合并默认封面', () => {
    const storage = createMemoryStorage()
    const fallback = createDefaultAppState()
    const legacyLikeState = {
      ...fallback,
      players: fallback.players.map((player, index) =>
        index === 0
          ? {
              ...player,
              aliases: undefined,
            }
          : player,
      ),
      recommendedTemplates: [
        {
          id: fallback.recommendedTemplates[0].id,
          customCover: 'data:image/png;base64,legacy-cover',
        },
      ],
      numberFields: undefined,
      numberSession: undefined,
    }

    storage.setItem(STORAGE_KEY, JSON.stringify(legacyLikeState))

    const restored = loadAppState(storage, fallback)

    expect(restored.players[0].aliases).toEqual([])
    expect(restored.recommendedTemplates[0].defaultCover).toBe(
      fallback.recommendedTemplates[0].defaultCover,
    )
    expect(restored.recommendedTemplates[0].customCover).toBe(
      'data:image/png;base64,legacy-cover',
    )
    expect(restored.numberFields[0].id).toBe('body.height')
    expect(restored.numberSession.activeFieldId).toBe('body.height')
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
