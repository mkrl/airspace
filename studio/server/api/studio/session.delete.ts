import { defineEventHandler } from 'nuxt/server'
import { studioSession } from '../../utils/studio.ts'

export default defineEventHandler(async (event) => {
  await (await studioSession(event)).clear()
  return { ok: true }
})
