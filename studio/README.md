# airspace studio

A schema-driven editor for records stored in an Atproto PDS.

```sh
cp .env.example .env
pnpm install
pnpm dev
```

Studio loads `lexicons.ts` from this directory for a "zero-config" setup. Export an Airspace lexicon map:

```ts
import { defineLexicons, field } from 'airspace/lexicon'

export default defineLexicons('dev.example', {
	note: {
		title: field.text({ max: 120 }),
		body: field.markdown(),
	},
})
```

Restart the development server after adding or changing the file.

For configured collections, relations, or plugins, add `studio.config.ts`. The configured Airspace objects are used directly by Studio rather than being rebuilt from their schemas:

```ts
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
	// plugins: [timestamps()],
})
```

`studio.config.ts` takes precedence over automatic collection creation. Its collection sorting, relations, collection plugins, global plugins, and `allowPrivateNetwork` setting are preserved.

Spaces are not yet supported.