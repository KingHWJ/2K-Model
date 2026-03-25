import type {
  AttributeCategory,
  AttributeValue,
  BuilderFieldDefinition,
  BuilderSession,
  DrawLogEntry,
  FieldAssignment,
  PlayerProfile,
  RecommendedTemplate,
  SavedTemplate,
  TemplateFieldResult,
} from '../types'

export function createSession(
  recommendedTemplate: RecommendedTemplate | null,
  fieldOrder: string[],
  now: () => string = () => new Date().toISOString(),
): BuilderSession {
  const createdAt = now()

  return {
    recommendedTemplateId: recommendedTemplate?.id ?? null,
    templateName: recommendedTemplate ? `${recommendedTemplate.name} 方案` : '未命名模板',
    candidatePlayerIds: recommendedTemplate?.candidatePlayerIds ?? [],
    fieldOrder,
    currentFieldIndex: 0,
    fieldAssignments: {},
    drawLog: [],
    createdAt,
    updatedAt: createdAt,
  }
}

export function createBuilderFields(
  categories: AttributeCategory[],
  fieldOrder: string[],
): BuilderFieldDefinition[] {
  const fieldMap = new Map<string, BuilderFieldDefinition>()

  for (const category of categories) {
    for (const field of category.fields) {
      const id = `${category.id}.${field.key}`
      fieldMap.set(id, {
        id,
        categoryId: category.id,
        fieldKey: field.key,
        label: field.label,
      })
    }
  }

  return fieldOrder
    .map((fieldId) => fieldMap.get(fieldId))
    .filter((field): field is BuilderFieldDefinition => Boolean(field))
}

export function drawFieldAssignment(
  session: BuilderSession,
  fieldId: string,
  players: PlayerProfile[],
  rng: () => number,
  now: () => string = () => new Date().toISOString(),
): BuilderSession {
  if (session.candidatePlayerIds.length === 0) {
    return session
  }

  const candidatePlayerId =
    session.candidatePlayerIds[Math.floor(rng() * session.candidatePlayerIds.length)]
  const player = players.find((item) => item.id === candidatePlayerId)
  const value = player ? getPlayerValueForField(player, fieldId) : undefined

  if (!player || value === undefined) {
    return session
  }

  const createdAt = now()
  const assignment: FieldAssignment = {
    fieldId,
    playerId: player.id,
    value,
    createdAt,
  }
  const logEntry: DrawLogEntry = {
    type: 'field',
    targetId: fieldId,
    playerId: player.id,
    value,
    createdAt,
  }
  const nextAssignments = {
    ...session.fieldAssignments,
    [fieldId]: assignment,
  }

  return {
    ...session,
    fieldAssignments: nextAssignments,
    currentFieldIndex: findNextFieldIndex(
      session.fieldOrder,
      nextAssignments,
      session.fieldOrder.indexOf(fieldId) + 1,
    ),
    drawLog: [...session.drawLog, logEntry],
    updatedAt: createdAt,
  }
}

export function saveTemplateFromSession(
  session: BuilderSession,
  recommendedTemplates: RecommendedTemplate[],
  players: PlayerProfile[],
  categories: AttributeCategory[],
  name: string,
  createId: () => string,
  now: () => string = () => new Date().toISOString(),
): SavedTemplate {
  const template = recommendedTemplates.find(
    (item) => item.id === session.recommendedTemplateId,
  )
  const fieldDefinitions = createBuilderFields(categories, session.fieldOrder)
  const fieldResults = fieldDefinitions
    .map((field) => buildFieldResult(field, session.fieldAssignments[field.id], players))
    .filter((result): result is TemplateFieldResult => Boolean(result))
  const assignedPlayers = fieldResults
    .map((result) =>
      players.find((player) => player.name === result.playerName),
    )
    .filter((player): player is PlayerProfile => Boolean(player))
  const overall = assignedPlayers.length
    ? Math.round(
        assignedPlayers.reduce((sum, player) => sum + player.overall, 0) /
          assignedPlayers.length,
      )
    : 0
  const tags = [
    ...new Set([
      ...(template?.tags ?? []),
      ...assignedPlayers.flatMap((player) => player.tags),
    ]),
  ]
  const updatedAt = now()

  return {
    id: createId(),
    name,
    recommendedTemplateId: session.recommendedTemplateId,
    candidatePlayerIds: [...session.candidatePlayerIds],
    fieldOrder: [...session.fieldOrder],
    currentFieldIndex: session.currentFieldIndex,
    fieldAssignments: { ...session.fieldAssignments },
    coverImage: template?.customCover ?? template?.defaultCover ?? '',
    summary: {
      overall,
      tags,
      recommendedTemplateName: template?.name ?? '自定义模板',
      completedFields: fieldResults.length,
      fieldResults,
    },
    createdAt: session.createdAt,
    updatedAt,
  }
}

export function openTemplateSession(template: SavedTemplate): BuilderSession {
  return {
    recommendedTemplateId: template.recommendedTemplateId,
    templateName: template.name,
    candidatePlayerIds: [...template.candidatePlayerIds],
    fieldOrder: [...template.fieldOrder],
    currentFieldIndex: template.currentFieldIndex,
    fieldAssignments: { ...template.fieldAssignments },
    drawLog: [],
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  }
}

export function getPlayerValueForField(
  player: PlayerProfile,
  fieldId: string,
): AttributeValue | undefined {
  const [categoryId, fieldKey] = fieldId.split('.')

  return player.categories[categoryId]?.[fieldKey]
}

export function findFieldDefinition(
  categories: AttributeCategory[],
  fieldId: string,
): BuilderFieldDefinition | null {
  const [categoryId, fieldKey] = fieldId.split('.')
  const category = categories.find((item) => item.id === categoryId)
  const field = category?.fields.find((item) => item.key === fieldKey)

  if (!category || !field) {
    return null
  }

  return {
    id: fieldId,
    categoryId,
    fieldKey,
    label: field.label,
  }
}

function buildFieldResult(
  field: BuilderFieldDefinition,
  assignment: FieldAssignment | undefined,
  players: PlayerProfile[],
): TemplateFieldResult | null {
  if (!assignment) {
    return null
  }

  const player = players.find((item) => item.id === assignment.playerId)

  if (!player) {
    return null
  }

  return {
    fieldId: field.id,
    fieldLabel: field.label,
    value: assignment.value,
    playerName: player.name,
    note: String(
      player.categories.meta?.note ??
        player.categories.meta?.templateArchetype ??
        `来自 ${player.name}`,
    ),
  }
}

function findNextFieldIndex(
  fieldOrder: string[],
  assignments: Record<string, FieldAssignment>,
  startIndex: number,
) {
  for (let index = startIndex; index < fieldOrder.length; index += 1) {
    if (!assignments[fieldOrder[index]]) {
      return index
    }
  }

  return Math.max(fieldOrder.length - 1, 0)
}
