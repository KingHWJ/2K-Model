import { describe, expect, it } from 'vitest'

import type {
  AttributeCategory,
  BuilderSession,
  PlayerProfile,
  RecommendedTemplate,
  SavedTemplate,
} from '../types'
import {
  createBuilderFields,
  createSession,
  drawFieldAssignment,
  getPlayerValueForField,
  openTemplateSession,
  saveTemplateFromSession,
} from './builderState'

const categories: AttributeCategory[] = [
  {
    id: 'body',
    name: '身体尺寸',
    fields: [
      { key: 'height', label: '身高', defaultValue: '198cm' },
      { key: 'weight', label: '体重', defaultValue: '98kg' },
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
    id: 'meta',
    name: '元数据',
    fields: [
      { key: 'templateArchetype', label: '模板定位', defaultValue: '双向分卫' },
      { key: 'note', label: '备注', defaultValue: '默认备注' },
    ],
  },
]

const fieldOrder = ['body.height', 'body.weight', 'shooting.midRange']

const template: RecommendedTemplate = {
  id: 'two-way-guard',
  name: '双向分卫模板',
  subtitle: '中投、爆发和外防兼具',
  description: '用经典分卫思路来构建首发模板。',
  featuredPlayers: ['迈克尔·乔丹', '科比·布莱恩特'],
  candidatePlayerIds: ['jordan', 'kobe'],
  tags: ['双向分卫'],
  defaultCover: 'cover://default',
  customCover: null,
  featuredFieldIds: fieldOrder,
}

const players: PlayerProfile[] = [
  createPlayer('jordan', '迈克尔·乔丹', '198cm', '98kg', 97),
  createPlayer('kobe', '科比·布莱恩特', '198cm', '96kg', 98),
]

describe('builderState', () => {
  it('会按字段顺序生成转盘字段定义', () => {
    const fields = createBuilderFields(categories, fieldOrder)

    expect(fields.map((field) => field.id)).toEqual(fieldOrder)
    expect(fields[0].label).toBe('身高')
  })

  it('会按当前字段抽取来源球员并记录最终值', () => {
    const session = createReadySession()

    const nextSession = drawFieldAssignment(
      session,
      'body.height',
      players,
      () => 0.99,
      () => '2026-03-25T10:00:00.000Z',
    )

    expect(nextSession.fieldAssignments['body.height'].playerId).toBe('kobe')
    expect(nextSession.fieldAssignments['body.height'].value).toBe('198cm')
    expect(nextSession.currentFieldIndex).toBe(1)
  })

  it('可以直接读取球员某个字段的真实值', () => {
    expect(getPlayerValueForField(players[0], 'shooting.midRange')).toBe(97)
    expect(getPlayerValueForField(players[1], 'body.weight')).toBe('96kg')
  })

  it('会把当前会话保存成可继续编辑的模板', () => {
    const session = drawFieldAssignment(
      createReadySession(),
      'body.height',
      players,
      () => 0.01,
      () => '2026-03-25T10:00:00.000Z',
    )

    const savedTemplate = saveTemplateFromSession(
      session,
      [template],
      players,
      categories,
      '模板1',
      () => 'template-1',
      () => '2026-03-25T10:10:00.000Z',
    )

    expect(savedTemplate.coverImage).toBe('cover://default')
    expect(savedTemplate.summary.recommendedTemplateName).toBe('双向分卫模板')
    expect(savedTemplate.summary.fieldResults[0].fieldLabel).toBe('身高')
  })

  it('会把模板重新恢复到创建页会话', () => {
    const templateRecord: SavedTemplate = {
      id: 'template-1',
      name: '模板1',
      recommendedTemplateId: template.id,
      candidatePlayerIds: ['jordan', 'kobe'],
      fieldOrder,
      currentFieldIndex: 1,
      fieldAssignments: {
        'body.height': {
          fieldId: 'body.height',
          playerId: 'jordan',
          value: '198cm',
          createdAt: '2026-03-25T10:00:00.000Z',
        },
      },
      coverImage: 'cover://default',
      summary: {
        overall: 99,
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
      createdAt: '2026-03-25T10:00:00.000Z',
      updatedAt: '2026-03-25T10:10:00.000Z',
    }

    const session = openTemplateSession(templateRecord)

    expect(session.templateName).toBe('模板1')
    expect(session.currentFieldIndex).toBe(1)
    expect(session.fieldAssignments['body.height'].playerId).toBe('jordan')
  })
})

function createPlayer(
  id: string,
  name: string,
  height: string,
  weight: string,
  midRange: number,
): PlayerProfile {
  return {
    id,
    name,
    position: 'SG/SF',
    overall: 98,
    era: '巅峰赛季',
    tags: ['双向分卫'],
    aliases: [id],
    categories: {
      meta: {
        templateArchetype: '双向分卫',
        note: '关键时刻终结能力顶级',
      },
      body: {
        height,
        weight,
      },
      shooting: {
        midRange,
        threePoint: midRange - 5,
      },
    },
  }
}

function createReadySession(): BuilderSession {
  return createSession(template, fieldOrder, () => '2026-03-25T09:55:00.000Z')
}
