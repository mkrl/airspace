import type { AnyCollection, DidString, Plugin, Relation } from 'airspace'
import type { RequestEvent } from 'nuxt/server'
import type { StudioCollection, StudioField } from '#shared/studio'
import type { StudioConfig } from '../../config.ts'
import { ConflictError, createAirspace, defineCollection, passwordSession } from 'airspace'
import { toLexiconJson } from 'airspace/lexicon'
import { useSession } from 'nitro/h3'
import { useRuntimeConfig } from 'nitro/runtime-config'
import { createError, toNuxtRequestEvent } from 'nuxt/server'
import importedConfig from '#studio-config'
import lexicons from '#studio-lexicons'

interface Credentials {
  did: string
  handle: string
  identifier: string
  password: string
  service: string
}

function cookie() {
  return {
    name: 'airspace-studio',
    password: useRuntimeConfig().studioSessionPassword,
    maxAge: 60 * 60 * 24 * 7,
  }
}

export const studioSession = (event: RequestEvent) => useSession<Partial<Credentials>>(toNuxtRequestEvent(event), cookie())

const config = importedConfig as StudioConfig | null
const model = (config?.lexicons ?? lexicons) as Record<string, unknown> | null

export const studioConfigured = () => model !== null

function recordEntries(model: Record<string, unknown>) {
  const entries: Array<[string, any]> = []
  for (const [name, value] of Object.entries(model)) {
    if (value && typeof value === 'object' && typeof (value as any).$type === 'string' && typeof (value as any).validate === 'function' && 'key' in value) {
      entries.push([name, value])
    }
    else if (value && typeof value === 'object') {
      for (const [def, nested] of Object.entries(value as Record<string, unknown>)) {
        if (nested && typeof nested === 'object' && typeof (nested as any).$type === 'string' && typeof (nested as any).validate === 'function' && 'key' in nested)
          entries.push([def === 'main' ? name : `${name}-${def}`, nested])
      }
    }
  }
  return entries
}

const collectionEntries = model ? recordEntries(model) : []
const inferredCollections = Object.fromEntries(collectionEntries.map(([name, schema]) => [name, defineCollection(schema)])) as Record<string, AnyCollection>
const collections = config?.collections ?? inferredCollections
const plugins = config?.plugins ?? []
const collectionNames = new Map(Object.entries(collections).map(([name, collection]) => [collection, name]))

function resolveField(field: StudioField, docs: Map<string, Record<string, unknown>>): StudioField {
  if (field.type !== 'ref' || !field.ref)
    return field
  const [nsid, def = 'main'] = field.ref.split('#')
  const target = docs.get(nsid!)?.[def]
  return target && typeof target === 'object' ? { ...target as StudioField, description: field.description ?? (target as StudioField).description } : field
}

export function collectionDescriptions(): StudioCollection[] {
  if (!model)
    return []
  const docs = toLexiconJson(model)
  const byNsid = new Map(docs.map(doc => [doc.id, doc.defs]))
  return Object.entries(collections).map(([name, collection]) => {
    const schema = collection.schema
    const main = byNsid.get(schema.$type)?.main as { description?: string, record?: StudioField } | undefined
    const record = main?.record
    return {
      name,
      nsid: schema.$type,
      description: main?.description,
      singleton: String(schema.key).startsWith('literal:'),
      fields: Object.fromEntries(Object.entries(record?.properties ?? {}).map(([key, field]) => {
        const resolved = resolveField(field, byNsid)
        const configuredRelation = Object.values(collection.relations as Record<string, Relation>).find(relation => relation.field === key)
        const relation = configuredRelation && collectionNames.get(configuredRelation.target())
        if (relation && configuredRelation.kind === 'hasMany' && resolved.type === 'array' && resolved.items)
          return [key, { ...resolved, items: { ...resolved.items, relation, relationValue: resolved.items.type === 'string' ? 'uri' : 'strongRef' } }]
        if (relation)
          return [key, { ...resolved, relation, relationValue: resolved.type === 'string' && resolved.format === 'at-uri' ? 'uri' : 'strongRef' }]
        if (config)
          return [key, resolved]
        const inferredRelation = field.type === 'ref' && field.ref === 'com.atproto.repo.strongRef'
          ? [key, `${key}s`, key.replace(/s$/, '')].find(candidate => collections[candidate])
          : undefined
        return [key, inferredRelation ? { ...resolved, relation: inferredRelation } : resolved]
      })),
      required: record?.required ?? [],
      nullable: record?.nullable ?? [],
    }
  })
}

export function requireCollection(name: string) {
  const collection = collections[name]
  if (!collection)
    throw createError({ statusCode: 404, message: `unknown collection: ${name}` })
  return collection
}

export function rethrowWriteConflict(error: unknown): never {
  if (error instanceof ConflictError) {
    throw createError({
      statusCode: 409,
      message: 'record changed since it was loaded',
      data: { code: 'record_conflict', collection: error.collection, rkey: error.rkey, cid: error.cid },
    })
  }
  throw error
}

export function isMissingRepository(error: unknown): boolean {
  if (!error || typeof error !== 'object')
    return false
  const response = error as { error?: string, message?: string }
  return response.error === 'RepoNotFound'
    || response.error === 'UpstreamFailure'
    || (response.error === 'InvalidRequest' && /could not find repo/i.test(response.message ?? ''))
}

function normalizeFields(value: Record<string, unknown>, fields: Record<string, StudioField>, prefix = ''): { value: Record<string, unknown>, removed: string[] } {
  const output: Record<string, unknown> = {}
  const removed: string[] = []
  for (const [name, fieldValue] of Object.entries(value)) {
    if (name === '$type') {
      output[name] = fieldValue
      continue
    }
    const field = fields[name]
    if (!field) {
      removed.push(`${prefix}${name}`)
      continue
    }
    if (field.properties && fieldValue && typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
      const nested = normalizeFields(fieldValue as Record<string, unknown>, field.properties, `${prefix}${name}.`)
      output[name] = nested.value
      removed.push(...nested.removed)
    }
    else {
      output[name] = fieldValue
    }
  }
  return { value: output, removed }
}

export function prepareMigrationValue(name: string, value: Record<string, unknown>) {
  const description = collectionDescriptions().find(collection => collection.name === name)
  if (!description)
    throw createError({ statusCode: 404, message: `unknown collection: ${name}` })
  return normalizeFields(value, description.fields)
}

async function requireCredentials(event: RequestEvent): Promise<Credentials> {
  const { data } = await studioSession(event)
  if (!data.did || !data.handle || !data.identifier || !data.password || !data.service)
    throw createError({ statusCode: 401, message: 'sign in to edit records' })
  return data as Credentials
}

export async function login(event: RequestEvent, input: { service: string, identifier: string, password: string }) {
  const service = input.service.replace(/\/$/, '')
  const session = await passwordSession({ service, identifier: input.identifier, password: input.password })
  const credentials: Credentials = { ...input, service, did: session.did, handle: session.handle }
  await (await studioSession(event)).update(credentials)
  return { did: session.did, handle: session.handle, service }
}

export async function useStudio(event: RequestEvent) {
  if (!studioConfigured())
    throw createError({ statusCode: 503, message: 'studio/lexicons.ts is not configured' })
  const credentials = await requireCredentials(event)
  const session = await passwordSession(credentials)
  return createAirspace({
    identity: { did: credentials.did as DidString, service: credentials.service },
    collections,
    plugins: plugins as readonly Plugin<any>[],
    session,
    allowPrivateNetwork: config?.allowPrivateNetwork,
  } as any) as any
}
