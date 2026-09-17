import { getQuery, getRouterParam } from 'nitro/h3'
import { createError, defineEventHandler, toNuxtRequestEvent } from 'nuxt/server'
import { collectionDescriptions, requireCollection, useStudio } from '../../../utils/studio.ts'

function text(value: unknown): string {
  if (value === null || value === undefined)
    return ''
  if (typeof value === 'object')
    return Object.values(value).map(text).join(' ')
  return String(value)
}

export default defineEventHandler(async (event) => {
  const name = getRouterParam(toNuxtRequestEvent(event), 'collection')!
  const collection = requireCollection(name)
  const client = (await useStudio(event)).collections[name]
  const query = getQuery(event)
  const serialize = (record: any) => ({ rkey: record.rkey, cid: record.cid, uri: record.uri, value: record.value })

  if (query.all === 'true') {
    const records = collection.singleton ? [await client.get()].filter(Boolean) : await client.list({ limit: 100 })
    return records.map(serialize)
  }

  const requestedLimit = Number(query.limit ?? 25)
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 100)
    throw createError({ statusCode: 400, message: 'limit must be an integer between 1 and 100' })

  if (collection.singleton) {
    const record = await client.get()
    return { records: record ? [serialize(record)] : [], mode: 'browse' }
  }

  const description = collectionDescriptions().find(item => item.name === name)!
  const field = typeof query.field === 'string' && query.field ? query.field : undefined
  const search = typeof query.search === 'string' ? query.search.trim().toLocaleLowerCase() : ''
  const sort = typeof query.sort === 'string' && query.sort ? query.sort : undefined
  if (field && !description.fields[field])
    throw createError({ statusCode: 400, message: `unknown search field: ${field}` })
  if (sort && !description.fields[sort])
    throw createError({ statusCode: 400, message: `unknown sort field: ${sort}` })

  const queryMode = !!search || !!sort
  if (queryMode) {
    const requestedOffset = Number(query.offset ?? 0)
    if (!Number.isInteger(requestedOffset) || requestedOffset < 0)
      throw createError({ statusCode: 400, message: 'offset must be a non-negative integer' })
    const records = await client.list({
      where: (value: Record<string, unknown>) => {
        const searchable = field ? value[field] : value
        return !search || text(searchable).toLocaleLowerCase().includes(search)
      },
      sort: sort ? [[sort, query.direction === 'desc' ? 'desc' : 'asc']] : undefined,
      offset: requestedOffset,
      limit: requestedLimit + 1,
    })
    return {
      records: records.slice(0, requestedLimit).map(serialize),
      mode: 'query',
      offset: requestedOffset,
      hasMore: records.length > requestedLimit,
    }
  }

  const result = await client.page({
    limit: requestedLimit,
    cursor: typeof query.cursor === 'string' && query.cursor ? query.cursor : undefined,
    reverse: query.reverse === 'true',
  })
  const hasMore = result.cursor
    ? (await client.page({ limit: 1, cursor: result.cursor, reverse: query.reverse === 'true' })).records.length > 0
    : false
  return {
    records: result.records.map(serialize),
    cursor: hasMore ? result.cursor : undefined,
    mode: 'browse',
    hasMore,
  }
})
