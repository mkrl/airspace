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
}

export interface StudioSession {
  configured: boolean
  account: { did: string, handle: string, service: string } | null
}
