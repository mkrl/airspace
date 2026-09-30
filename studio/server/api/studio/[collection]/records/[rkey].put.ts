import { createError, defineEventHandler, getRequestHeader, getRouterParam, readBody } from 'nuxt/server'
import { requireCollection, rethrowWriteConflict, useStudio } from '../../../../utils/studio.ts'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'collection')!
  const rkey = getRouterParam(event, 'rkey')!
  const ifMatch = getRequestHeader(event, 'if-match')
  if (!ifMatch)
    throw createError({ statusCode: 428, message: 'record CID is required to update' })
  const collection = requireCollection(name)
  const client = (await useStudio(event)).collections[name]
  const value = await readBody<Record<string, unknown>>(event)
  const validation = await client.validate(value)
  if (!validation.ok)
    throw createError({ statusCode: 422, message: 'record is invalid', data: { issues: validation.issues } })
  try {
    return collection.singleton
      ? await client.put(value, { ifMatch, ifChanged: true })
      : await client.put(rkey, value, { ifMatch, ifChanged: true })
  }
  catch (error) {
    rethrowWriteConflict(error)
  }
})
