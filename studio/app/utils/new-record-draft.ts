import type { StudioCollection } from '#shared/studio'

/**
 * I hate it when you accidentally close the tab,
 * so this is saving the form on every keystroke (only for new records)
 */

interface NewRecordDraft {
  schema: string
  value: Record<string, unknown>
}

const KEY_PREFIX = 'airspace-studio:new-record:'

function canonicalJson(value: unknown): string {
  if (Array.isArray(value))
    return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value)
}

function schemaFingerprint(collection: StudioCollection): string {
  return canonicalJson({
    nsid: collection.nsid,
    fields: collection.fields,
    required: collection.required,
    nullable: collection.nullable,
  })
}

function storageKey(collection: StudioCollection): string {
  return `${KEY_PREFIX}${collection.name}`
}

function removeDraft(storage: Storage, key: string) {
  try {
    storage.removeItem(key)
  }
  catch {}
}

export function restoreNewRecordDraft(storage: Storage, collection: StudioCollection): Record<string, unknown> | null {
  const key = storageKey(collection)
  try {
    const stored = storage.getItem(key)
    if (!stored)
      return null
    const draft = JSON.parse(stored) as Partial<NewRecordDraft>
    if (draft.schema !== schemaFingerprint(collection) || !draft.value || typeof draft.value !== 'object' || Array.isArray(draft.value)) {
      removeDraft(storage, key)
      return null
    }
    return draft.value
  }
  catch {
    removeDraft(storage, key)
    return null
  }
}

export function saveNewRecordDraft(storage: Storage, collection: StudioCollection, value: Record<string, unknown>) {
  try {
    storage.setItem(storageKey(collection), JSON.stringify({
      schema: schemaFingerprint(collection),
      value,
    } satisfies NewRecordDraft))
  }
  catch {}
}

export function clearNewRecordDraft(storage: Storage, collection: StudioCollection) {
  removeDraft(storage, storageKey(collection))
}
