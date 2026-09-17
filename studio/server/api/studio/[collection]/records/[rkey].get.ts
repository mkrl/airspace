import { getRouterParam } from 'nitro/h3'
import { createError, defineEventHandler, toNuxtRequestEvent } from 'nuxt/server'
import { isMissingRepository, requireCollection, useStudio } from '../../../../utils/studio.ts'

export default defineEventHandler(async (event) => {
  const request = toNuxtRequestEvent(event)
  const name = getRouterParam(request, 'collection')!
  const rkey = getRouterParam(request, 'rkey')!
  const collection = requireCollection(name)
  const client = (await useStudio(event)).collections[name]
  let record
  try {
    record = collection.singleton ? await client.get() : await client.get(rkey)
  }
  catch (error) {
    if (!isMissingRepository(error))
      throw error
  }
  if (!record || record.rkey !== rkey)
    throw createError({ statusCode: 404, message: `record not found: ${name}/${rkey}` })
  return { rkey: record.rkey, cid: record.cid, uri: record.uri, value: record.value }
})
