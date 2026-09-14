import { getRouterParam } from 'nitro/h3'
import { defineEventHandler, toNuxtRequestEvent } from 'nuxt/server'
import { requireCollection, useStudio } from '../../../../utils/studio.ts'

export default defineEventHandler(async (event) => {
  const request = toNuxtRequestEvent(event)
  const name = getRouterParam(request, 'collection')!
  const rkey = getRouterParam(request, 'rkey')!
  const collection = requireCollection(name)
  const client = (await useStudio(event)).collections[name]
  await (collection.singleton ? client.delete() : client.delete(rkey))
  return { ok: true }
})
