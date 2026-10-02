import { belongsTo, defineCollections } from 'airspace'
import lexicons from './lexicons.example.ts'
import { defineStudio } from './src/index.ts'

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
