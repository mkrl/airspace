import { defineCollection } from 'airspace'
import { defineStudio } from './config.ts'
import lexicons from './lexicons.ts'

const collections = {
  post: defineCollection(lexicons['app.bsky.feed.post'].main, {
    sort: [['createdAt', 'desc']],
  }),
}

export default defineStudio({
  lexicons,
  collections,
})
