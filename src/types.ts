export type AttributeValue = number | string

export interface AttributeField {
  key: string
  label: string
  defaultValue: AttributeValue
}

export interface AttributeCategory {
  id: string
  name: string
  fields: AttributeField[]
}

export interface PlayerProfile {
  id: string
  name: string
  position: string
  overall: number
  era: string
  tags: string[]
  categories: Record<string, Record<string, AttributeValue>>
}

export interface Preset {
  id: string
  name: string
  description: string
  defaultCandidateCount: number
  availablePlayerIds: string[]
  availableCategoryIds: string[]
  tagLibrary: string[]
}

export interface CategoryAssignment {
  playerId: string
  createdAt: string
}

export interface DrawLogEntry {
  type: 'candidate' | 'category'
  targetId: string
  playerId: string
  createdAt: string
}

export interface GenerationSession {
  presetId: string
  templateName: string
  candidateCount: number
  candidatePlayerIds: string[]
  assignments: Record<string, CategoryAssignment>
  drawLog: DrawLogEntry[]
  createdAt: string
  updatedAt: string
}

export interface TemplateCategorySource {
  categoryId: string
  categoryName: string
  playerName: string
}

export interface TemplateSummary {
  overall: number
  position: string
  tags: string[]
  categorySources: TemplateCategorySource[]
}

export interface SavedTemplate {
  id: string
  name: string
  presetId: string
  candidateCount: number
  candidatePlayerIds: string[]
  assignments: Record<string, CategoryAssignment>
  summary: TemplateSummary
  createdAt: string
  updatedAt: string
}

export interface AppState {
  version: number
  presets: Preset[]
  categories: AttributeCategory[]
  players: PlayerProfile[]
  templates: SavedTemplate[]
  session: GenerationSession
}
