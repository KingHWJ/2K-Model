import type { AppState, PlayerProfile } from '../types'

export const STORAGE_KEY = '2k26-fusion-builder:v1'

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

    return normalizeAppState(parsed)
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
    candidate.version === 1 &&
    Array.isArray(candidate.presets) &&
    Array.isArray(candidate.categories) &&
    Array.isArray(candidate.players) &&
    Array.isArray(candidate.templates) &&
    typeof candidate.session === 'object' &&
    candidate.session !== null
  )
}

function normalizeAppState(state: AppState): AppState {
  return {
    ...state,
    players: state.players.map(normalizePlayerProfile),
  }
}

function normalizePlayerProfile(player: PlayerProfile): PlayerProfile {
  return {
    ...player,
    aliases: Array.isArray(player.aliases) ? player.aliases : [],
  }
}
