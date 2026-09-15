import { defineLexicons, field, record } from 'airspace/lexicon'

export default defineLexicons('dev.example.studio', {
  article: {
    title: field.text({ max: 120 }).describe('The headline shown in article lists.'),
    body: field.markdown(),
    status: field.enum(['draft', 'review', 'published']),
    featured: field.boolean().optional(),
    priority: field.number({ min: 0, max: 10 }).optional(),
    publishedAt: field.datetime().optional(),
    canonicalUrl: field.url().optional(),
    topics: field.list(field.text({ max: 40 }), { max: 8 }).optional(),
    author: field.ref('author').optional(),
    cover: field.image({ max: 2_000_000 }).optional(),
    seo: field.object({
      title: field.text({ max: 70 }),
      description: field.text({ max: 160 }).optional(),
    }).optional(),
  },

  author: {
    name: field.text({ max: 80 }),
    bio: field.markdown({ max: 2_000 }).optional(),
    website: field.url().optional(),
    avatar: field.image({ max: 1_000_000 }).optional(),
  },

  settings: record({
    siteName: field.text({ max: 80 }),
    description: field.text({ max: 240 }).optional(),
    postsPerPage: field.number({ min: 1, max: 100 }),
    showDrafts: field.boolean().optional(),
  }, { key: 'self', description: 'Site-wide publishing settings.' }),
})
