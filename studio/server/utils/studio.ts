import type { AnyCollection, DidString } from 'airspace'
import type { RequestEvent } from 'nuxt/server'
import type { StudioCollection, StudioField } from '#shared/studio'
import { createAirspace, defineCollection, passwordSession } from 'airspace'
import { toLexiconJson } from 'airspace/lexicon'
import { useSession } from 'nitro/h3'
import { useRuntimeConfig } from 'nitro/runtime-config'
import { createError, toNuxtRequestEvent } from 'nuxt/server'
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
export const studioConfigured = () => lexicons !== null

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

const model = lexicons as Record<string, unknown> | null
const collectionEntries = model ? recordEntries(model) : []
const collections = Object.fromEntries(collectionEntries.map(([name, schema]) => [name, defineCollection(schema)])) as Record<string, AnyCollection>

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
  return collectionEntries.map(([name, schema]) => {
    const main = byNsid.get(schema.$type)?.main as { description?: string, record?: StudioField } | undefined
    const record = main?.record
    return {
      name,
      nsid: schema.$type,
      description: main?.description,
      singleton: String(schema.key).startsWith('literal:'),
      fields: Object.fromEntries(Object.entries(record?.properties ?? {}).map(([key, field]) => [key, resolveField(field, byNsid)])),
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
    session,
  }) as any
}
