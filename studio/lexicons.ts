import { defineLexicons, field, l, record } from 'airspace/lexicon'

const markdownBlock = l.typedObject('dev.example.studio.block', 'markdown', l.object({
  markdown: l.string({ maxGraphemes: 5_000, maxLength: 50_000 }),
}))

const imageBlock = l.typedObject('dev.example.studio.block', 'image', l.object({
  image: l.blob({ accept: ['image/*'], maxSize: 2_000_000 }),
  alt: l.string({ maxGraphemes: 160, maxLength: 1_600 }),
}))

const defs = defineLexicons({
  'dev.example.studio.block': {
    markdown: markdownBlock,
    image: imageBlock,
  },
})

const model = defineLexicons('dev.example.studio', {
  author: record({
    displayName: field.text({ max: 80 }),
    website: field.url().optional(),
  }),
  tag: record({
    label: field.text({ max: 32 }),
  }),
  article: record({
    title: field.text({ max: 120 }),
    content: field.list(field.raw(l.union([() => markdownBlock, () => imageBlock], { closed: true })), { max: 12 }),
    status: field.enum(['draft', 'review', 'published']),
    topics: field.list(field.text({ max: 40 }), { max: 8 }).optional(),
    author: field.ref('author').optional(),
    tags: field.list(field.ref('tag'), { max: 4 }).optional(),
    featured: field.boolean().optional(),
    priority: field.raw(l.integer({ minimum: 0, maximum: 10 })).optional(),
    publishedAt: field.datetime().optional(),
    canonicalUrl: field.url().optional(),
    seo: field.object({
      title: field.text({ max: 70 }),
      description: field.text({ max: 160 }).optional(),
      summary: field.text({ max: 160 }).optional(),
    }).optional(),
    cover: field.raw(l.blob({ accept: ['image/*'], maxSize: 2_000_000 })).optional(),
  }),
  settings: record({
    siteName: field.text({ max: 80 }),
    description: field.text({ max: 240 }).optional(),
    postsPerPage: field.raw(l.integer({ minimum: 1, maximum: 100 })),
    showDrafts: field.boolean().optional(),
    locale: field.raw(l.string({ format: 'language' })),
    pinnedCid: field.raw(l.cid()).optional(),
  }, { key: 'self' }),
})

export default {
  ...defs,
  ...model,
}
