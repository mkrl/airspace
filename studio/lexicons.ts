import { defineLexicons } from 'airspace/lexicon'
import { aspectRatio } from './generated-lexicons/app/bsky/embed/defs.ts'
import external, { external as externalCard } from './generated-lexicons/app/bsky/embed/external.ts'
import gallery, { image as galleryImage } from './generated-lexicons/app/bsky/embed/gallery.ts'
import images, { image as embedImage } from './generated-lexicons/app/bsky/embed/images.ts'
import record from './generated-lexicons/app/bsky/embed/record.ts'
import recordWithMedia from './generated-lexicons/app/bsky/embed/recordWithMedia.ts'
import video, { caption } from './generated-lexicons/app/bsky/embed/video.ts'
import post, { entity, replyRef, textSlice } from './generated-lexicons/app/bsky/feed/post.ts'
import facet, { byteSlice, link, mention, tag } from './generated-lexicons/app/bsky/richtext/facet.ts'
import { selfLabel, selfLabels } from './generated-lexicons/com/atproto/label/defs.ts'
import strongRef from './generated-lexicons/com/atproto/repo/strongRef.ts'

export default defineLexicons({
  'app.bsky.embed.defs': {
    aspectRatio,
  },
  'app.bsky.embed.external': {
    main: external,
    external: externalCard,
  },
  'app.bsky.embed.gallery': {
    main: gallery,
    image: galleryImage,
  },
  'app.bsky.embed.images': {
    main: images,
    image: embedImage,
  },
  'app.bsky.embed.record': record,
  'app.bsky.embed.recordWithMedia': recordWithMedia,
  'app.bsky.embed.video': {
    main: video,
    caption,
  },
  'app.bsky.feed.post': {
    main: post,
    replyRef,
    entity,
    textSlice,
  },
  'app.bsky.richtext.facet': {
    main: facet,
    mention,
    link,
    tag,
    byteSlice,
  },
  'com.atproto.label.defs': {
    selfLabels,
    selfLabel,
  },
  'com.atproto.repo.strongRef': strongRef,
})
