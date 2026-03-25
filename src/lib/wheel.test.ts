import { describe, expect, it } from 'vitest'

import { createSpinSequence, getTargetWheelRotation, normalizeRotation } from './wheel'

describe('wheel helpers', () => {
  it('会把转盘角度归一化到 0 到 360 之间', () => {
    expect(normalizeRotation(810)).toBe(90)
    expect(normalizeRotation(-90)).toBe(270)
  })

  it('会让选中的扇区停在指针位置', () => {
    const nextRotation = getTargetWheelRotation(4, 1, 0, 4)

    expect(normalizeRotation(nextRotation)).toBe(270)
  })

  it('会生成以目标球员结束的高亮序列', () => {
    const sequence = createSpinSequence(['乔丹', '科比', '杜兰特', '詹姆斯'], 2, 2)

    expect(sequence.at(-1)).toBe('杜兰特')
    expect(sequence.length).toBeGreaterThan(4)
  })
})
