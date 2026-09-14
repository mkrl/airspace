import { defineEventHandler } from 'nuxt/server'
import { collectionDescriptions, studioConfigured, studioSession } from '../utils/studio.ts'

export default defineEventHandler(async (event) => {
  const { data } = await studioSession(event)
  return {
    configured: studioConfigured(),
    account: data.did && data.handle && data.service ? { did: data.did, handle: data.handle, service: data.service } : null,
    collections: collectionDescriptions(),
  }
})
