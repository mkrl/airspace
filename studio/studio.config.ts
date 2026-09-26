import { belongsTo, defineCollections } from 'airspace'
import { defineStudio } from './config.ts'
import lexicons from './lexicons.ts'

const collections = defineCollections(lexicons, collection => ({
  article: {
    relations: {
      author: belongsTo(collection.author, 'author'),
    },
  },
}))

export default defineStudio({
  lexicons,
  collections,
})
