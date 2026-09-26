import { defineLexicons, l } from 'airspace/lexicon'

const markdownBlock = l.typedObject('dev.example.studio.block', 'markdown', l.object({
  markdown: l.string({ maxGraphemes: 5_000, maxLength: 50_000 }),
}))

const imageBlock = l.typedObject('dev.example.studio.block', 'image', l.object({
  image: l.blob({ accept: ['image/*'], maxSize: 2_000_000 }),
  alt: l.string({ maxGraphemes: 160, maxLength: 1_600 }),
}))

const author = l.record({
  key: 'tid',
  record: l.object({
    displayName: l.string({ maxGraphemes: 80, maxLength: 800 }),
    website: l.optional(l.string({ format: 'uri' })),
  }),
})

const tag = l.record({
  key: 'tid',
  record: l.object({
    label: l.string({ maxGraphemes: 32, maxLength: 320 }),
  }),
})

const article = l.record({
  key: 'tid',
  record: l.object({
    title: l.string({ maxGraphemes: 120, maxLength: 1_200 }),
    content: l.array(l.union([() => markdownBlock, () => imageBlock], { closed: true }), { maxLength: 12 }),
    status: l.string({ knownValues: ['draft', 'review', 'published'] }),
    topics: l.optional(l.array(l.string({ maxGraphemes: 40, maxLength: 400 }), { maxLength: 8 })),
    author: l.optional(l.ref(() => author.main)),
    tags: l.optional(l.array(l.ref(() => tag.main), { maxLength: 4 })),
    featured: l.optional(l.boolean()),
    priority: l.optional(l.integer({ minimum: 0, maximum: 10 })),
    publishedAt: l.optional(l.string({ format: 'datetime' })),
    canonicalUrl: l.optional(l.string({ format: 'uri' })),
    seo: l.optional(l.object({
      title: l.string({ maxGraphemes: 70, maxLength: 700 }),
      description: l.optional(l.string({ maxGraphemes: 160, maxLength: 1_600 })),
      summary: l.optional(l.string({ maxGraphemes: 160, maxLength: 1_600 })),
    })),
    cover: l.optional(l.blob({ accept: ['image/*'], maxSize: 2_000_000 })),
  }),
})

const settings = l.record({
  key: 'self',
  record: l.object({
    siteName: l.string({ maxGraphemes: 80, maxLength: 800 }),
    description: l.optional(l.string({ maxGraphemes: 240, maxLength: 2_400 })),
    postsPerPage: l.integer({ minimum: 1, maximum: 100 }),
    showDrafts: l.optional(l.boolean()),
    locale: l.string({ format: 'language' }),
    pinnedCid: l.optional(l.cid()),
  }),
})

export default defineLexicons({
  'dev.example.studio.block': {
    markdown: markdownBlock,
    image: imageBlock,
  },
  'dev.example.studio.author': author,
  'dev.example.studio.tag': tag,
  'dev.example.studio.article': article,
  'dev.example.studio.settings': settings,
})
