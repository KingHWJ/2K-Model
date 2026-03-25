import { describe, expect, it } from 'vitest'

import { parse2KRatingsPlayerText } from './import2kRatings'

describe('import2kRatings', () => {
  it('可以把 2KRatings 球员页文本解析成站内球员资料', () => {
    const player = parse2KRatingsPlayerText(`Kevin Durant
Position PF / SF
Archetype 3-Level-Scoring Point Forward
Height 6'11"
Weight 240 lbs
Wingspan 7'5"
Overall Rating 96
Close Shot 95
Driving Layup 92
Driving Dunk 90
Mid-Range Shot 94
Three-Point Shot 92
Free Throw 89
Pass Accuracy 80
Ball Handle 88
Speed 84
Agility 82
Strength 74
Vertical 82
Interior Defense 78
Perimeter Defense 85
Steal 74
Block 86
Offensive Rebound 65
Defensive Rebound 79`)

    expect(player.name).toBe('凯文·杜兰特')
    expect(player.position).toBe('PF / SF')
    expect(player.overall).toBe(96)
    expect(player.categories.body.height).toBe('211cm')
    expect(player.categories.body.weight).toBe('109kg')
    expect(player.categories.body.wingspan).toBe('226cm')
    expect(player.categories.shooting.threePoint).toBe(92)
    expect(player.categories.playmaking.ballHandle).toBe(88)
    expect(player.categories.defense.block).toBe(86)
    expect(player.tags.length).toBeGreaterThan(0)
  })
})
