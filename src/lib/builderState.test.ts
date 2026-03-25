import { describe, expect, it } from 'vitest'

import type {
  AttributeCategory,
  GenerationSession,
  PlayerProfile,
  Preset,
  SavedTemplate,
} from '../types'
import {
  clampCandidateCount,
  createSession,
  drawAllCategories,
  drawCandidatePlayerIds,
  drawCategoryAssignment,
  openTemplateSession,
  saveTemplateFromSession,
} from './builderState'

const categories: AttributeCategory[] = [
  {
    id: 'body',
    name: '身体尺寸',
    fields: [
      { key: 'height', label: '身高', defaultValue: '198cm' },
      { key: 'wingspan', label: '臂展', defaultValue: '210cm' },
    ],
  },
  {
    id: 'shooting',
    name: '投篮',
    fields: [
      { key: 'midRange', label: '中投', defaultValue: 80 },
      { key: 'threePoint', label: '三分', defaultValue: 78 },
    ],
  },
  {
    id: 'defense',
    name: '防守',
    fields: [
      { key: 'perimeterDefense', label: '外防', defaultValue: 85 },
      { key: 'steal', label: '抢断', defaultValue: 82 },
    ],
  },
]

const players: PlayerProfile[] = [
  createPlayer('jordan', '迈克尔·乔丹', 99),
  createPlayer('kobe', '科比·布莱恩特', 98),
  createPlayer('lebron', '勒布朗·詹姆斯', 99),
  createPlayer('durant', '凯文·杜兰特', 97),
]

const preset: Preset = {
  id: 'legend-mix',
  name: '传奇融合池',
  description: '用于测试的传奇球员池。',
  defaultCandidateCount: 3,
  availablePlayerIds: players.map((player) => player.id),
  availableCategoryIds: categories.map((category) => category.id),
  tagLibrary: ['半神半人', '持球投射核心'],
}

describe('builderState', () => {
  it('会按球员池上限修正候选人数', () => {
    expect(clampCandidateCount(0, 4)).toBe(1)
    expect(clampCandidateCount(2, 4)).toBe(2)
    expect(clampCandidateCount(8, 4)).toBe(4)
  })

  it('会去重抽取候选球员', () => {
    const draws = [0.01, 0.01, 0.62, 0.62, 0.92]
    const result = drawCandidatePlayerIds(
      players.map((player) => player.id),
      3,
      () => draws.shift() ?? 0.25,
    )

    expect(result).toEqual(['jordan', 'lebron', 'durant'])
  })

  it('会为单个属性大类记录来源球员和抽取日志', () => {
    const session = createReadySession()

    const nextSession = drawCategoryAssignment(
      session,
      'shooting',
      () => 0.99,
      () => '2026-03-25T10:00:00.000Z',
    )

    expect(nextSession.assignments.shooting.playerId).toBe('durant')
    expect(nextSession.drawLog.at(-1)).toEqual({
      type: 'category',
      targetId: 'shooting',
      playerId: 'durant',
      createdAt: '2026-03-25T10:00:00.000Z',
    })
  })

  it('会按固定顺序一键抽完全部属性大类', () => {
    const session = createReadySession()
    const draws = [0.1, 0.5, 0.9]

    const nextSession = drawAllCategories(
      session,
      categories.map((category) => category.id),
      () => draws.shift() ?? 0.2,
      () => '2026-03-25T10:00:00.000Z',
    )

    expect(Object.keys(nextSession.assignments)).toEqual([
      'body',
      'shooting',
      'defense',
    ])
    expect(nextSession.assignments.body.playerId).toBe('jordan')
    expect(nextSession.assignments.shooting.playerId).toBe('kobe')
    expect(nextSession.assignments.defense.playerId).toBe('durant')
  })

  it('会从当前会话生成可继续编辑的模板', () => {
    const session = drawAllCategories(
      createReadySession(),
      categories.map((category) => category.id),
      () => 0.01,
      () => '2026-03-25T10:00:00.000Z',
    )

    const template = saveTemplateFromSession(
      session,
      players,
      categories,
      '模板1',
      () => 'template-1',
      () => '2026-03-25T10:05:00.000Z',
    )

    expect(template.name).toBe('模板1')
    expect(template.summary.overall).toBe(99)
    expect(template.summary.tags).toContain('半神半人')
    expect(template.summary.categorySources).toHaveLength(3)
  })

  it('会把模板重新恢复成编辑中的会话', () => {
    const template: SavedTemplate = {
      id: 'template-1',
      name: '模板1',
      presetId: preset.id,
      candidateCount: 3,
      candidatePlayerIds: ['jordan', 'kobe', 'durant'],
      assignments: {
        body: { playerId: 'jordan', createdAt: '2026-03-25T10:00:00.000Z' },
        shooting: { playerId: 'kobe', createdAt: '2026-03-25T10:00:00.000Z' },
      },
      summary: {
        overall: 98,
        position: 'SG/SF',
        tags: ['半神半人', '持球投射核心'],
        categorySources: [
          { categoryId: 'body', categoryName: '身体尺寸', playerName: '迈克尔·乔丹' },
          { categoryId: 'shooting', categoryName: '投篮', playerName: '科比·布莱恩特' },
        ],
      },
      createdAt: '2026-03-25T10:00:00.000Z',
      updatedAt: '2026-03-25T10:10:00.000Z',
    }

    const session = openTemplateSession(template)

    expect(session.templateName).toBe('模板1')
    expect(session.assignments.shooting.playerId).toBe('kobe')
    expect(session.candidatePlayerIds).toEqual(['jordan', 'kobe', 'durant'])
  })
})

function createPlayer(id: string, name: string, overall: number): PlayerProfile {
  return {
    id,
    name,
    position: 'SG/SF',
    overall,
    era: '巅峰赛季',
    tags: ['半神半人', '持球投射核心'],
    aliases: [id],
    categories: {
      body: {
        height: '198cm',
        wingspan: '210cm',
      },
      shooting: {
        midRange: overall - 5,
        threePoint: overall - 6,
      },
      defense: {
        perimeterDefense: overall - 4,
        steal: overall - 7,
      },
    },
  }
}

function createReadySession(): GenerationSession {
  const session = createSession(preset, categories, () => '2026-03-25T09:55:00.000Z')

  return {
    ...session,
    candidatePlayerIds: ['jordan', 'kobe', 'durant'],
    candidateCount: 3,
  }
}
