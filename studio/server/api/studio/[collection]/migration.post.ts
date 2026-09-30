import { createError, defineEventHandler, getRouterParam, readBody } from 'nuxt/server'
import { prepareMigrationValue, requireCollection, useStudio } from '../../../utils/studio.ts'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'collection')!
  requireCollection(name)
  const client = (await useStudio(event)).collections[name]
  const body = await readBody<{ values?: Record<string, Record<string, unknown>> }>(event)
  const values = body.values ?? {}
  const transform = (value: Record<string, unknown>, record: { rkey: string }) => prepareMigrationValue(name, values[record.rkey] ?? value).value
  const preview = await client.migrate(transform, { dryRun: true })
  if (Object.keys(preview.failed).length)
    throw createError({ statusCode: 422, message: 'migration still has invalid records', data: preview })
  return await client.migrate(transform)
})
