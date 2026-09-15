import { getRouterParam } from 'nitro/h3'
import { defineEventHandler, toNuxtRequestEvent } from 'nuxt/server'
import { prepareMigrationValue, requireCollection, useStudio } from '../../../utils/studio.ts'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(toNuxtRequestEvent(event), 'collection')!
  requireCollection(name)
  const client = (await useStudio(event)).collections[name]
  const records = new Map<string, any>()
  const removed = new Map<string, string[]>()
  const report = await client.migrate((value: Record<string, unknown>, record: any) => {
    records.set(record.rkey, record)
    const prepared = prepareMigrationValue(name, value)
    removed.set(record.rkey, prepared.removed)
    return prepared.value
  }, { dryRun: true })
  const failed = new Set(Object.keys(report.failed))
  return {
    needed: report.changed > 0 || failed.size > 0,
    report,
    records: [...records.values()].filter(record => failed.has(record.rkey) || removed.get(record.rkey)?.length).map(record => ({
      rkey: record.rkey,
      cid: record.cid,
      uri: record.uri,
      value: record.value,
      removedFields: removed.get(record.rkey),
    })),
  }
})
