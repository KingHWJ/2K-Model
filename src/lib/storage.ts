import type {
  AppState,
  BuilderSession,
  NumberDrawField,
  NumberDrawSession,
  PlayerProfile,
  RecommendedTemplate,
} from '../types'

export const STORAGE_KEY = '2k26-fusion-builder:v2'

export function loadAppState(storage: Storage, fallback: AppState): AppState {
  try {
    const raw = storage.getItem(STORAGE_KEY)

    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw) as AppState

    if (!isValidAppState(parsed)) {
      return fallback
    }

    return normalizeAppState(parsed, fallback)
  } catch {
    return fallback
  }
}

export function saveAppState(storage: Storage, state: AppState): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function isValidAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<AppState>

  return (
    candidate.version === 2 &&
    Array.isArray(candidate.categories) &&
    Array.isArray(candidate.players) &&
    Array.isArray(candidate.recommendedTemplates) &&
    Array.isArray(candidate.tagDefinitions) &&
    (candidate.numberFields === undefined || Array.isArray(candidate.numberFields)) &&
    (candidate.numberSession === undefined ||
      (typeof candidate.numberSession === 'object' && candidate.numberSession !== null)) &&
    Array.isArray(candidate.templates) &&
    typeof candidate.session === 'object' &&
    candidate.session !== null
  )
}

function normalizeAppState(state: AppState, fallback: AppState): AppState {
  return {
    ...state,
    players: state.players.map(normalizePlayerProfile),
    recommendedTemplates: mergeRecommendedTemplates(
      fallback.recommendedTemplates,
      state.recommendedTemplates,
    ),
    numberFields: normalizeNumberFields(state.numberFields, fallback.numberFields),
    numberSession: normalizeNumberSession(
      state.numberSession,
      state.numberFields,
      fallback.numberFields,
      fallback.numberSession,
    ),
    session: normalizeSession(state.session, fallback.session),
  }
}

function normalizePlayerProfile(player: PlayerProfile): PlayerProfile {
  return {
    ...player,
    aliases: Array.isArray(player.aliases) ? player.aliases : [],
  }
}

function mergeRecommendedTemplates(
  fallback: RecommendedTemplate[],
  saved: RecommendedTemplate[],
) {
  return fallback.map((template) => {
    const savedTemplate = saved.find((item) => item.id === template.id)

    if (!savedTemplate) {
      return template
    }

    return {
      ...template,
      customCover:
        typeof savedTemplate.customCover === 'string'
          ? savedTemplate.customCover
          : null,
    }
  })
}

function normalizeSession(session: BuilderSession, fallback: BuilderSession): BuilderSession {
  return {
    ...session,
    fieldOrder: Array.isArray(session.fieldOrder)
      ? session.fieldOrder
      : fallback.fieldOrder,
    candidatePlayerIds: Array.isArray(session.candidatePlayerIds)
      ? session.candidatePlayerIds
      : fallback.candidatePlayerIds,
    fieldAssignments:
      session.fieldAssignments && typeof session.fieldAssignments === 'object'
        ? session.fieldAssignments
        : fallback.fieldAssignments,
  }
}

function normalizeNumberFields(
  fields: NumberDrawField[] | undefined,
  fallback: NumberDrawField[],
) {
  if (!fields || fields.length === 0) {
    return fallback
  }

  const savedFieldMap = new Map(fields.map((field) => [field.id, field]))

  // 保留内置字段骨架，同时吸收用户自定义的默认值和范围配置。
  return fallback.map((field) => {
    const savedField = savedFieldMap.get(field.id)

    if (!savedField || savedField.kind !== field.kind) {
      return field
    }

    if (field.kind === 'options') {
      const options =
        Array.isArray(savedField.options) && savedField.options.length > 0
          ? savedField.options.filter((item) => typeof item === 'string' && item.trim().length > 0)
          : field.options

      const defaultValue =
        typeof savedField.defaultValue === 'string' && options?.includes(savedField.defaultValue)
          ? savedField.defaultValue
          : field.defaultValue

      return {
        ...field,
        options,
        defaultValue,
      }
    }

    const min = typeof savedField.min === 'number' ? savedField.min : field.min
    const max = typeof savedField.max === 'number' ? savedField.max : field.max
    const normalizedMin = Math.min(min ?? 0, max ?? min ?? 0)
    const normalizedMax = Math.max(min ?? max ?? 0, max ?? 0)
    const defaultValue =
      typeof savedField.defaultValue === 'number'
        ? clamp(savedField.defaultValue, normalizedMin, normalizedMax)
        : field.defaultValue

    return {
      ...field,
      min: normalizedMin,
      max: normalizedMax,
      defaultValue,
    }
  })
}

function normalizeNumberSession(
  session: NumberDrawSession | undefined,
  fields: NumberDrawField[] | undefined,
  fallbackFields: NumberDrawField[],
  fallback: NumberDrawSession,
): NumberDrawSession {
  const normalizedFields = normalizeNumberFields(fields, fallbackFields)
  const validFieldIds = new Set(normalizedFields.map((field) => field.id))

  if (!session) {
    return {
      ...fallback,
      activeFieldId: normalizedFields[0]?.id ?? fallback.activeFieldId,
    }
  }

  return {
    ...session,
    activeFieldId:
      typeof session.activeFieldId === 'string' &&
      session.activeFieldId.length > 0 &&
      validFieldIds.has(session.activeFieldId)
        ? session.activeFieldId
        : normalizedFields[0]?.id ?? fallback.activeFieldId,
    results:
      session.results && typeof session.results === 'object'
        ? Object.fromEntries(
            Object.entries(session.results).filter(([fieldId]) => validFieldIds.has(fieldId)),
          )
        : fallback.results,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
