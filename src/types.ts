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

export interface BuilderFieldDefinition {
  id: string
  categoryId: string
  fieldKey: string
  label: string
}

export interface PlayerProfile {
  id: string
  name: string
  position: string
  overall: number
  era: string
  tags: string[]
  aliases: string[]
  categories: Record<string, Record<string, AttributeValue>>
}

export interface RecommendedTemplate {
  id: string
  name: string
  subtitle: string
  description: string
  featuredPlayers: string[]
  candidatePlayerIds: string[]
  tags: string[]
  defaultCover: string
  customCover: string | null
  featuredFieldIds: string[]
}

export interface TagDefinition {
  id: string
  label: string
  description: string
  featuredPlayers: string[]
  focusFields: string[]
}

export interface NumberDrawField {
  id: string
  label: string
  kind: 'range' | 'options'
  min?: number
  max?: number
  options?: string[]
  defaultValue: AttributeValue
  unit?: string
  note: string
}

export interface NumberDrawResult {
  fieldId: string
  value: AttributeValue
  createdAt: string
}

export interface NumberDrawSession {
  activeFieldId: string
  results: Record<string, NumberDrawResult>
  createdAt: string
  updatedAt: string
}

export interface FieldAssignment {
  fieldId: string
  playerId: string
  value: AttributeValue
  createdAt: string
}

export interface DrawLogEntry {
  type: 'field'
  targetId: string
  playerId: string
  value: AttributeValue
  createdAt: string
}

export interface BuilderSession {
  recommendedTemplateId: string | null
  templateName: string
  candidatePlayerIds: string[]
  fieldOrder: string[]
  currentFieldIndex: number
  fieldAssignments: Record<string, FieldAssignment>
  drawLog: DrawLogEntry[]
  createdAt: string
  updatedAt: string
}

export interface TemplateFieldResult {
  fieldId: string
  fieldLabel: string
  value: AttributeValue
  playerName: string
  note: string
}

export interface TemplateSummary {
  overall: number
  tags: string[]
  recommendedTemplateName: string
  completedFields: number
  fieldResults: TemplateFieldResult[]
}

export interface SavedTemplate {
  id: string
  name: string
  recommendedTemplateId: string | null
  candidatePlayerIds: string[]
  fieldOrder: string[]
  currentFieldIndex: number
  fieldAssignments: Record<string, FieldAssignment>
  coverImage: string
  summary: TemplateSummary
  createdAt: string
  updatedAt: string
}

export interface AppState {
  version: 2
  categories: AttributeCategory[]
  players: PlayerProfile[]
  recommendedTemplates: RecommendedTemplate[]
  tagDefinitions: TagDefinition[]
  numberFields: NumberDrawField[]
  numberSession: NumberDrawSession
  templates: SavedTemplate[]
  session: BuilderSession
}
