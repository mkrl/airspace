export interface StudioField {
  type: string
  description?: string
  format?: string
  enum?: Array<string | number>
  knownValues?: Array<string | number>
  const?: string | number | boolean
  default?: unknown
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  minGraphemes?: number
  maxGraphemes?: number
  accept?: string[]
  maxSize?: number
  ref?: string
  relation?: string
  refs?: string[]
  items?: StudioField
  properties?: Record<string, StudioField>
  required?: string[]
  nullable?: string[]
}

export interface StudioCollection {
  name: string
  nsid: string
  description?: string
  singleton: boolean
  fields: Record<string, StudioField>
  required: string[]
  nullable: string[]
}

export interface StudioRecord {
  rkey: string
  cid: string
  uri: string
  value: Record<string, unknown>
  removedFields?: string[]
}

export interface StudioMigrationIssue {
  path: string
  message: string
}

export interface StudioMigrationReport {
  scanned: number
  changed: number
  unchanged: number
  failed: Record<string, StudioMigrationIssue[]>
}

export interface StudioMigrationStatus {
  needed: boolean
  report: StudioMigrationReport
  records: StudioRecord[]
}

export interface StudioSession {
  configured: boolean
  account: { did: string, handle: string, service: string } | null
}

export interface StudioState extends StudioSession {
  collections: StudioCollection[]
}
