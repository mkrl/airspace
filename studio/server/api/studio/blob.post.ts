import { createError, defineEventHandler } from 'nuxt/server'
import { useStudio } from '../../utils/studio.ts'

export default defineEventHandler(async (event) => {
  const form = await event.req.formData()
  const file = form.get('file')
  if (!(file instanceof File) || !file.size)
    throw createError({ statusCode: 400, message: 'choose a file to upload' })
  return await (await useStudio(event)).blobs.upload(file)
})
