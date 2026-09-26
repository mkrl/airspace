import { belongsTo, defineCollection, hasMany } from 'airspace'
import { defineStudio } from './config.ts'
import lexicons from './lexicons.ts'

const author = defineCollection(lexicons['dev.example.studio.author'])
const tag = defineCollection(lexicons['dev.example.studio.tag'])

const collections = {
  author,
  tag,
  article: defineCollection(lexicons['dev.example.studio.article'], {
    relations: {
      author: belongsTo(author, 'author'),
      tags: hasMany(tag, 'tags'),
    },
  }),
  settings: defineCollection(lexicons['dev.example.studio.settings']),
}

export default defineStudio({
  lexicons,
  collections,
})
