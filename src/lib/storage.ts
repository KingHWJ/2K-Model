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
  void fields
  // 数值直抽字段当前以内置默认集为准，避免旧版字段结构残留到新界面里。
  return fallback
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
