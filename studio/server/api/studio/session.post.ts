import { createError, defineEventHandler, readBody } from 'nuxt/server'
import { login } from '../../utils/studio.ts'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ service?: string, identifier?: string, password?: string }>(event)
  if (!body.service || !body.identifier || !body.password)
    throw createError({ statusCode: 400, message: 'service, identifier and app password are required' })
  try {
    return await login(event, body as { service: string, identifier: string, password: string })
  }
  catch (error) {
    throw createError({ statusCode: 401, message: error instanceof Error ? error.message : 'sign in failed' })
  }
})
