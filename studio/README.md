# airspace studio

A schema-driven editor for records stored in an Atproto PDS.

```sh
cp .env.example .env
pnpm install
pnpm dev
```

Studio loads `lexicons.ts` from this directory. Export an Airspace lexicon map:

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

For production, set `NUXT_STUDIO_SESSION_PASSWORD` to at least 32 random characters.
