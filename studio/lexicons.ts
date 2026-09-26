import { defineLexicons, field, record } from 'airspace/lexicon'

export default defineLexicons('dev.example.studio', {
  author: record({
    displayName: field.text({ max: 80 }),
    website: field.url().optional(),
  }),
  tag: record({
    label: field.text({ max: 32 }),
  }),
  article: record({
    title: field.text({ max: 120 }),
    body: field.markdown(),
    status: field.enum(['draft', 'review', 'published']),
    topics: field.list(field.text({ max: 40 }), { max: 8 }).optional(),
    author: field.ref('author').optional(),
    tags: field.list(field.ref('tag'), { max: 4 }).optional(),
    featured: field.boolean().optional(),
    priority: field.number({ min: 0, max: 10 }).optional(),
    publishedAt: field.datetime().optional(),
    canonicalUrl: field.url().optional(),
    seo: field.object({
      title: field.text({ max: 70 }),
      description: field.text({ max: 160 }).optional(),
    }).optional(),
    cover: field.image({ max: 2_000_000 }).optional(),
  }),
  settings: record({
    siteName: field.text({ max: 80 }),
    description: field.text({ max: 240 }).optional(),
    postsPerPage: field.number({ min: 1, max: 100 }),
    showDrafts: field.boolean().optional(),
  }, { key: 'self' }),
})
