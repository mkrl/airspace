import { defineLexicons, l } from 'airspace/lexicon'

const strongRef = l.typedObject('com.atproto.repo.strongRef', 'main', l.object({
  uri: l.string({ format: 'at-uri' }),
  cid: l.string({ format: 'cid' }),
}))

const markdownBlock = l.typedObject('dev.example.studio.block', 'markdown', l.object({
  markdown: l.string({ maxGraphemes: 5_000, maxLength: 50_000 }),
}))

const imageBlock = l.typedObject('dev.example.studio.block', 'image', l.object({
  image: l.blob({ accept: ['image/*'], maxSize: 2_000_000 }),
  alt: l.string({ maxGraphemes: 160, maxLength: 1_600 }),
}))

export default defineLexicons({
  'dev.example.studio.block': {
    markdown: markdownBlock,
    image: imageBlock,
  },
  'dev.example.studio.author': l.record({
    key: 'tid',
    record: l.object({
      displayName: l.string({ maxGraphemes: 80, maxLength: 800 }),
      website: l.optional(l.string({ format: 'uri' })),
    }),
  }),
  'dev.example.studio.tag': l.record({
    key: 'tid',
    record: l.object({
      label: l.string({ maxGraphemes: 32, maxLength: 320 }),
    }),
  }),
  'dev.example.studio.article': l.record({
    key: 'tid',
    record: l.object({
      title: l.string({ maxGraphemes: 120, maxLength: 1_200 }),
      content: l.array(l.openUnion([() => markdownBlock, () => imageBlock]), { maxLength: 12 }),
      status: l.string({ knownValues: ['draft', 'review', 'published'] }),
      author: l.optional(l.ref(() => strongRef)),
      tags: l.optional(l.array(l.ref(() => strongRef), { maxLength: 4 })),
      featured: l.optional(l.boolean()),
      priority: l.optional(l.integer({ minimum: 0, maximum: 10 })),
      publishedAt: l.optional(l.string({ format: 'datetime' })),
      canonicalUrl: l.optional(l.string({ format: 'uri' })),
      seo: l.optional(l.object({
        summary: l.string({ maxGraphemes: 160, maxLength: 1_600 }),
      })),
      cover: l.optional(l.blob({ accept: ['image/*'], maxSize: 2_000_000 })),
    }),
  }),
  'dev.example.studio.settings': l.record({
    key: 'literal:self',
    record: l.object({
      locale: l.string({ format: 'language' }),
      pinnedCid: l.optional(l.cid()),
    }),
  }),
})
