import { getRouterParam } from 'nitro/h3'
import { createError, defineEventHandler, readBody, toNuxtRequestEvent } from 'nuxt/server'
import { requireCollection, useStudio } from '../../../utils/studio.ts'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(toNuxtRequestEvent(event), 'collection')!
  const collection = requireCollection(name)
  const client = (await useStudio(event)).collections[name]
  const value = await readBody<Record<string, unknown>>(event)
  const validation = await client.validate(value)
  if (!validation.ok)
    throw createError({ statusCode: 422, message: 'record is invalid', data: { issues: validation.issues } })
  return collection.singleton ? await client.put(value) : await client.create(value)
})
