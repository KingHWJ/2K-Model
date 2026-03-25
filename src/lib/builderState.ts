import type {
  AttributeCategory,
  CategoryAssignment,
  DrawLogEntry,
  GenerationSession,
  PlayerProfile,
  Preset,
  SavedTemplate,
  TemplateCategorySource,
} from '../types'

export function clampCandidateCount(requested: number, available: number): number {
  if (available <= 0) {
    return 1
  }

  return Math.min(Math.max(requested, 1), available)
}

export function createSession(
  preset: Preset,
  _categories: AttributeCategory[],
  now: () => string = () => new Date().toISOString(),
): GenerationSession {
  const createdAt = now()

  return {
    presetId: preset.id,
    templateName: '未命名模板',
    candidateCount: preset.defaultCandidateCount,
    candidatePlayerIds: [],
    assignments: {},
    drawLog: [],
    createdAt,
    updatedAt: createdAt,
  }
}

export function drawCandidatePlayerIds(
  playerIds: string[],
  requestedCount: number,
  rng: () => number,
): string[] {
  const targetCount = clampCandidateCount(requestedCount, playerIds.length)
  const result: string[] = []
  const pickedIds = new Set<string>()
  let safety = playerIds.length * 10

  while (result.length < targetCount && safety > 0) {
    const index = Math.floor(rng() * playerIds.length)
    const pickedPlayerId = playerIds[index]

    if (pickedPlayerId && !pickedIds.has(pickedPlayerId)) {
      pickedIds.add(pickedPlayerId)
      result.push(pickedPlayerId)
    }

    safety -= 1
  }

  if (result.length < targetCount) {
    for (const playerId of playerIds) {
      if (!pickedIds.has(playerId)) {
        pickedIds.add(playerId)
        result.push(playerId)
      }

      if (result.length === targetCount) {
        break
      }
    }
  }

  return result
}

export function drawCategoryAssignment(
  session: GenerationSession,
  categoryId: string,
  rng: () => number,
  now: () => string = () => new Date().toISOString(),
): GenerationSession {
  if (session.candidatePlayerIds.length === 0) {
    return session
  }

  const playerId =
    session.candidatePlayerIds[
      Math.floor(rng() * session.candidatePlayerIds.length)
    ]
  const createdAt = now()
  const assignment: CategoryAssignment = {
    playerId,
    createdAt,
  }
  const logEntry: DrawLogEntry = {
    type: 'category',
    targetId: categoryId,
    playerId,
    createdAt,
  }

  return {
    ...session,
    assignments: {
      ...session.assignments,
      [categoryId]: assignment,
    },
    drawLog: [...session.drawLog, logEntry],
    updatedAt: createdAt,
  }
}

export function drawAllCategories(
  session: GenerationSession,
  categoryIds: string[],
  rng: () => number,
  now: () => string = () => new Date().toISOString(),
): GenerationSession {
  return categoryIds.reduce(
    (currentSession, categoryId) =>
      drawCategoryAssignment(currentSession, categoryId, rng, now),
    session,
  )
}

export function saveTemplateFromSession(
  session: GenerationSession,
  players: PlayerProfile[],
  categories: AttributeCategory[],
  name: string,
  createId: () => string,
  now: () => string = () => new Date().toISOString(),
): SavedTemplate {
  const categoryById = new Map(categories.map((category) => [category.id, category]))
  const playerById = new Map(players.map((player) => [player.id, player]))
  const assignedPlayers = Object.values(session.assignments)
    .map((assignment) => playerById.get(assignment.playerId))
    .filter((player): player is PlayerProfile => Boolean(player))

  const overall = assignedPlayers.length
    ? Math.round(
        assignedPlayers.reduce((sum, player) => sum + player.overall, 0) /
          assignedPlayers.length,
      )
    : 0

  const categorySources: TemplateCategorySource[] = Object.entries(session.assignments)
    .map(([categoryId, assignment]) => {
      const category = categoryById.get(categoryId)
      const player = playerById.get(assignment.playerId)

      if (!category || !player) {
        return null
      }

      return {
        categoryId,
        categoryName: category.name,
        playerName: player.name,
      }
    })
    .filter((item): item is TemplateCategorySource => Boolean(item))

  const uniqueTags = [...new Set(assignedPlayers.flatMap((player) => player.tags))]
  const createdAt = session.createdAt
  const updatedAt = now()

  return {
    id: createId(),
    name,
    presetId: session.presetId,
    candidateCount: session.candidateCount,
    candidatePlayerIds: [...session.candidatePlayerIds],
    assignments: { ...session.assignments },
    summary: {
      overall,
      position: assignedPlayers[0]?.position ?? '未定义',
      tags: uniqueTags,
      categorySources,
    },
    createdAt,
    updatedAt,
  }
}

export function openTemplateSession(template: SavedTemplate): GenerationSession {
  return {
    presetId: template.presetId,
    templateName: template.name,
    candidateCount: template.candidateCount,
    candidatePlayerIds: [...template.candidatePlayerIds],
    assignments: { ...template.assignments },
    drawLog: [],
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  }
}
