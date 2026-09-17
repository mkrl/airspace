import { getHeader, getRouterParam } from 'nitro/h3'
import { createError, defineEventHandler, toNuxtRequestEvent } from 'nuxt/server'
import { requireCollection, rethrowWriteConflict, useStudio } from '../../../../utils/studio.ts'

export default defineEventHandler(async (event) => {
  const request = toNuxtRequestEvent(event)
  const name = getRouterParam(request, 'collection')!
  const rkey = getRouterParam(request, 'rkey')!
  const ifMatch = getHeader(request, 'if-match')
  if (!ifMatch)
    throw createError({ statusCode: 428, message: 'record CID is required to delete' })
  const collection = requireCollection(name)
  const client = (await useStudio(event)).collections[name]
  try {
    await (collection.singleton ? client.delete({ ifMatch }) : client.delete(rkey, { ifMatch }))
  }
  catch (error) {
    rethrowWriteConflict(error)
  }
  return { ok: true }
})
