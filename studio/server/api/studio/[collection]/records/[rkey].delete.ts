import { createError, defineEventHandler, getRequestHeader, getRouterParam } from 'nuxt/server'
import { requireCollection, rethrowWriteConflict, useStudio } from '../../../../utils/studio.ts'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'collection')!
  const rkey = getRouterParam(event, 'rkey')!
  const ifMatch = getRequestHeader(event, 'if-match')
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
