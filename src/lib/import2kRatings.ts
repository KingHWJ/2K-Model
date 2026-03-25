import type { PlayerProfile } from '../types'

const translatedNameMap: Record<string, string> = {
  'Kevin Durant': '凯文·杜兰特',
  'Michael Jordan': '迈克尔·乔丹',
  'Kobe Bryant': '科比·布莱恩特',
  'LeBron James': '勒布朗·詹姆斯',
  'Stephen Curry': '斯蒂芬·库里',
  'Shaquille O\'Neal': '沙奎尔·奥尼尔',
  'Dennis Rodman': '丹尼斯·罗德曼',
  'Nikola Jokic': '尼古拉·约基奇',
  'Shai Gilgeous-Alexander': '谢伊·吉尔杰斯-亚历山大',
  'Giannis Antetokounmpo': '扬尼斯·阿德托昆博',
  'Luka Doncic': '卢卡·东契奇',
  'Jayson Tatum': '杰森·塔图姆',
  'Victor Wembanyama': '维克托·文班亚马',
  'Anthony Davis': '安东尼·戴维斯',
}

const ratingLabelMap = {
  closeShot: ['Close Shot'],
  layup: ['Driving Layup', 'Layup'],
  drivingDunk: ['Driving Dunk'],
  midRange: ['Mid-Range Shot', 'Mid Range Shot'],
  threePoint: ['Three-Point Shot', 'Three Point Shot'],
  freeThrow: ['Free Throw'],
  passAccuracy: ['Pass Accuracy'],
  ballHandle: ['Ball Handle'],
  speed: ['Speed'],
  acceleration: ['Agility', 'Acceleration'],
  vertical: ['Vertical'],
  strength: ['Strength'],
  interiorDefense: ['Interior Defense'],
  perimeterDefense: ['Perimeter Defense'],
  steal: ['Steal'],
  block: ['Block'],
  offensiveRebound: ['Offensive Rebound'],
  defensiveRebound: ['Defensive Rebound'],
} as const

export function parse2KRatingsPlayerText(source: string): PlayerProfile {
  const text = normalizeWhitespace(source)
  const englishName = extractEnglishName(text)
  const translatedName = translatedNameMap[englishName] ?? englishName
  const position = extractSingleValue(text, ['Position']) ?? '未标注位置'
  const archetype = extractSingleValue(text, ['Archetype']) ?? '2KRatings 导入'
  const overall = extractNumberValue(text, ['Overall Rating']) ?? 75
  const heightInches = extractFeetInches(text, ['Height'])
  const weightLbs = extractPounds(text, ['Weight'])
  const wingspanInches = extractFeetInches(text, ['Wingspan'])
  const closeShot = extractNumberValue(text, ratingLabelMap.closeShot) ?? 65
  const layup = extractNumberValue(text, ratingLabelMap.layup) ?? 65
  const drivingDunk = extractNumberValue(text, ratingLabelMap.drivingDunk) ?? 65
  const midRange = extractNumberValue(text, ratingLabelMap.midRange) ?? 65
  const threePoint = extractNumberValue(text, ratingLabelMap.threePoint) ?? 65
  const freeThrow = extractNumberValue(text, ratingLabelMap.freeThrow) ?? 65
  const passAccuracy = extractNumberValue(text, ratingLabelMap.passAccuracy) ?? 65
  const ballHandle = extractNumberValue(text, ratingLabelMap.ballHandle) ?? 65
  const speed = extractNumberValue(text, ratingLabelMap.speed) ?? 65
  const acceleration = extractNumberValue(text, ratingLabelMap.acceleration) ?? speed
  const vertical = extractNumberValue(text, ratingLabelMap.vertical) ?? 65
  const strength = extractNumberValue(text, ratingLabelMap.strength) ?? 65
  const interiorDefense = extractNumberValue(text, ratingLabelMap.interiorDefense) ?? 65
  const perimeterDefense = extractNumberValue(text, ratingLabelMap.perimeterDefense) ?? 65
  const steal = extractNumberValue(text, ratingLabelMap.steal) ?? 65
  const block = extractNumberValue(text, ratingLabelMap.block) ?? 65
  const offensiveRebound = extractNumberValue(text, ratingLabelMap.offensiveRebound) ?? 65
  const defensiveRebound = extractNumberValue(text, ratingLabelMap.defensiveRebound) ?? 65
  const heightCm = heightInches ? Math.round(heightInches * 2.54) : 198
  const weightKg = weightLbs ? Math.round(weightLbs * 0.45359237) : 98
  const wingspanCm = wingspanInches ? Math.round(wingspanInches * 2.54) : heightCm + 12
  const frame = deriveFrameLabel(heightCm, weightKg, wingspanCm)
  const tags = deriveTags(archetype, position, {
    threePoint,
    ballHandle,
    passAccuracy,
    perimeterDefense,
    interiorDefense,
    block,
    drivingDunk,
    defensiveRebound,
  })

  return {
    id: createImportedPlayerId(englishName),
    name: translatedName,
    position,
    overall,
    era: '2KRatings 导入',
    tags,
    aliases: buildAliases(englishName, translatedName),
    categories: {
      meta: {
        templateArchetype: archetype,
        note: `导入自 2KRatings · ${archetype}`,
      },
      body: {
        height: `${heightCm}cm`,
        weight: `${weightKg}kg`,
        wingspan: `${wingspanCm}cm`,
        frame,
      },
      athleticism: {
        speed,
        acceleration,
        vertical,
        strength,
      },
      finishing: {
        layup,
        drivingDunk,
        closeShot,
      },
      shooting: {
        midRange,
        threePoint,
        freeThrow,
      },
      playmaking: {
        ballHandle,
        passAccuracy,
      },
      defense: {
        perimeterDefense,
        interiorDefense,
        steal,
        block,
      },
      rebounding: {
        defensiveRebound,
        boxout: Math.round((offensiveRebound + defensiveRebound + strength) / 3),
      },
    },
  }
}

function normalizeWhitespace(input: string) {
  return input.replace(/\r/g, '').trim()
}

function extractEnglishName(text: string) {
  const [firstLine] = text.split('\n')

  return firstLine?.trim() || '2KRatings 导入球员'
}

function extractSingleValue(text: string, labels: string[]) {
  for (const label of labels) {
    const match = text.match(new RegExp(`${escapeRegExp(label)}\\s*:?\\s*([^\\n]+)`, 'i'))

    if (match?.[1]) {
      return match[1].trim()
    }
  }

  return null
}

function extractNumberValue(text: string, labels: readonly string[]) {
  for (const label of labels) {
    const labelFirst = text.match(new RegExp(`${escapeRegExp(label)}\\s*:?\\s*(\\d{1,3})`, 'i'))

    if (labelFirst?.[1]) {
      return Number(labelFirst[1])
    }

    const valueFirst = text.match(new RegExp(`(\\d{1,3})\\s+${escapeRegExp(label)}`, 'i'))

    if (valueFirst?.[1]) {
      return Number(valueFirst[1])
    }
  }

  return null
}

function extractFeetInches(text: string, labels: string[]) {
  for (const label of labels) {
    const match = text.match(new RegExp(`${escapeRegExp(label)}\\s*:?\\s*(\\d+)'(\\d+)`, 'i'))

    if (match?.[1] && match[2]) {
      return Number(match[1]) * 12 + Number(match[2])
    }
  }

  return null
}

function extractPounds(text: string, labels: string[]) {
  for (const label of labels) {
    const match = text.match(new RegExp(`${escapeRegExp(label)}\\s*:?\\s*(\\d+)\\s*lbs`, 'i'))

    if (match?.[1]) {
      return Number(match[1])
    }
  }

  return null
}

function deriveFrameLabel(heightCm: number, weightKg: number, wingspanCm: number) {
  const weightRatio = weightKg / Math.max(heightCm, 1)
  const reachBonus = wingspanCm - heightCm

  if (weightRatio >= 0.58) {
    return '强壮'
  }

  if (reachBonus >= 16) {
    return '宽肩'
  }

  if (weightRatio <= 0.45) {
    return '精瘦'
  }

  return '标准'
}

function deriveTags(
  archetype: string,
  position: string,
  ratings: {
    threePoint: number
    ballHandle: number
    passAccuracy: number
    perimeterDefense: number
    interiorDefense: number
    block: number
    drivingDunk: number
    defensiveRebound: number
  },
) {
  const tags = new Set<string>()
  const lowerArchetype = archetype.toLowerCase()
  const lowerPosition = position.toLowerCase()

  if (lowerArchetype.includes('3-level') || ratings.threePoint >= 88) {
    tags.add('高点投射核心')
  }

  if (lowerArchetype.includes('point') || ratings.ballHandle >= 86 || ratings.passAccuracy >= 86) {
    tags.add('持球投射核心')
  }

  if (lowerArchetype.includes('defen') || ratings.perimeterDefense >= 88) {
    tags.add('外线锁防核心')
  }

  if (ratings.interiorDefense >= 88 || ratings.block >= 88) {
    tags.add('护筐终结内线')
  }

  if (ratings.drivingDunk >= 90) {
    tags.add('禁区终结怪兽')
  }

  if (ratings.defensiveRebound >= 88) {
    tags.add('篮板清道夫')
  }

  if (lowerPosition.includes('pg')) {
    tags.add('节奏组织核心')
  }

  if (lowerPosition.includes('sf') || lowerPosition.includes('pf')) {
    tags.add('全能锋线引擎')
  }

  if (tags.size === 0) {
    tags.add('2KRatings 导入')
  }

  tags.add(archetype)

  return [...tags]
}

function buildAliases(englishName: string, translatedName: string) {
  const normalizedEnglish = englishName.toLowerCase()
  const slug = createImportedPlayerId(englishName)

  return [...new Set([normalizedEnglish, normalizedEnglish.replace(/[^a-z0-9]+/g, ' ').trim(), slug, translatedName])]
}

function createImportedPlayerId(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
