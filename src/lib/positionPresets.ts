import type { NumberDrawField, PositionPreset } from '../types'

export const defaultPositionPresets: PositionPreset[] = [
  {
    id: 'all',
    label: '通用',
    description: '不按具体位置细分，使用一套通用的 2K 风格尺寸范围。',
    height: { min: 170, max: 224, defaultValue: 198 },
    weight: { min: 70, max: 159, defaultValue: 98 },
    wingspan: { min: 175, max: 250, defaultValue: 211 },
  },
  {
    id: 'PG',
    label: '控卫 PG',
    description: '更强调灵活和持球节奏，整体尺寸偏小偏轻。',
    height: { min: 175, max: 200, defaultValue: 188 },
    weight: { min: 70, max: 95, defaultValue: 84 },
    wingspan: { min: 180, max: 210, defaultValue: 196 },
  },
  {
    id: 'SG',
    label: '分卫 SG',
    description: '兼顾持球和终结，尺寸略高于控卫。',
    height: { min: 185, max: 205, defaultValue: 196 },
    weight: { min: 75, max: 106, defaultValue: 90 },
    wingspan: { min: 190, max: 218, defaultValue: 205 },
  },
  {
    id: 'SF',
    label: '小前 SF',
    description: '适合全能锋线和侧翼持投打法。',
    height: { min: 193, max: 210, defaultValue: 201 },
    weight: { min: 84, max: 120, defaultValue: 101 },
    wingspan: { min: 200, max: 228, defaultValue: 214 },
  },
  {
    id: 'PF',
    label: '大前 PF',
    description: '更强调尺寸、护框和内线对抗。',
    height: { min: 200, max: 216, defaultValue: 208 },
    weight: { min: 92, max: 136, defaultValue: 112 },
    wingspan: { min: 208, max: 236, defaultValue: 222 },
  },
  {
    id: 'C',
    label: '中锋 C',
    description: '更高、更重、更长臂展，适合护框和篮板型内线。',
    height: { min: 208, max: 224, defaultValue: 213 },
    weight: { min: 104, max: 159, defaultValue: 122 },
    wingspan: { min: 218, max: 244, defaultValue: 231 },
  },
]

export function getPositionPreset(presetId: string) {
  return (
    defaultPositionPresets.find((preset) => preset.id === presetId) ??
    defaultPositionPresets[0]
  )
}

export function applyPositionPresetToFields(
  fields: NumberDrawField[],
  presetId: string,
) {
  const preset = getPositionPreset(presetId)

  return fields.map((field) => {
    if (field.id === 'body.height' && field.kind === 'range') {
      return {
        ...field,
        min: preset.height.min,
        max: preset.height.max,
        defaultValue: preset.height.defaultValue,
      }
    }

    if (field.id === 'body.weight' && field.kind === 'range') {
      return {
        ...field,
        min: preset.weight.min,
        max: preset.weight.max,
        defaultValue: preset.weight.defaultValue,
      }
    }

    if (field.id === 'body.wingspan' && field.kind === 'range') {
      return {
        ...field,
        min: preset.wingspan.min,
        max: preset.wingspan.max,
        defaultValue: preset.wingspan.defaultValue,
      }
    }

    return field
  })
}
