import { getRouterParam } from 'nitro/h3'
import { defineEventHandler, toNuxtRequestEvent } from 'nuxt/server'
import { requireCollection, useStudio } from '../../../utils/studio.ts'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(toNuxtRequestEvent(event), 'collection')!
  const collection = requireCollection(name)
  const client = (await useStudio(event)).collections[name]
  const records = collection.singleton ? [await client.get()].filter(Boolean) : await client.list({ limit: 100 })
  return records.map((record: any) => ({ rkey: record.rkey, cid: record.cid, uri: record.uri, value: record.value }))
})
