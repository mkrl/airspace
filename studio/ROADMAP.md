# airspace studio roadmap

Studio already supports schema-driven CRUD, validation, singletons, manual migrations, blob uploads, basic relations, and password sessions. This roadmap covers the remaining work needed to expose the practical Airspace APIs through a web UI.

## configuration foundation

Studio currently consumes `lexicons.ts`. Lexicons describe record shapes, but not collection configuration such as sorting, `belongsTo` and `hasMany` relations, or plugins.

Studio now accepts an optional `studio.config.ts` entry point that exports configured collections and plugins. `lexicons.ts` remains the zero-configuration path. Explicit relation definitions replace naming heuristics when a configuration is present.

## P0: core CMS

### concurrency protection

- [x] Send the loaded record CID as `ifMatch` on update and delete.
- [x] Handle `ConflictError` without discarding local edits and offer an explicit action to load the latest record.
- [x] Enable `ifChanged` by default on writes rather than exposing it as a form setting.
- [x] Prevent one editor from silently overwriting another.

### scalable record navigation

- [x] Replace the fixed 100-record listing with cursor-based `page({ limit, cursor, reverse })` calls.
- [x] Add previous and next controls and preserve cursor state in the URL.
- [x] Add search, field filters, configurable sorting, and reverse order as separate collection tools.
- [x] Treat `list()` filtering and sorting as in-memory operations; do not imply that arbitrary filters map to PDS cursor pagination.

### complete schema controls

- [x] Add structured list editors with add, remove, and reorder controls.
- [x] Add `hasMany` multi-select controls.
- [x] Add a union member selector and recursive editor.
- [x] Preserve raw JSON for open unions, external references, unknown types, and unsupported shapes.
- Add suitable editors for AT URIs, language codes, CIDs, and other known string formats.

### OAuth

- Keep password login available for private and local administration.
- Add OAuth authorization, callback, metadata, and persistent session storage for shared deployments.
- Derive scopes from the configured model.
- Handle `ScopeError` by prompting the user to authorize again.
- Support local PDS resolver configuration during development.

OAuth is high value but deployment-heavy: it requires a public base URL, client metadata, callback routing, and durable session storage.

## P1: editorial workflows

### bulk operations

- Add record selection for bulk delete and update.
- Add JSON and CSV import/export.
- Use `airspace.batch()` when multiple related operations must land atomically.
- Report all operation results and failures clearly.

Migrations already write in batches internally. Batch UI is primarily useful for imports, deletes, and coordinated cross-collection changes.

### live change notifications

- Subscribe to public collection changes through Jetstream.
- Show a refresh notice when records change elsewhere.
- Avoid replacing a form with unsaved local edits.
- Combine live notifications with CID-based conflict protection.

### richer relations

- Read explicit `belongsTo` and `hasMany` definitions from configured collections instead of relying only on field-name inference.
- Add searchable selects for large target collections.
- Resolve external AT URI references for read-only previews.
- Show related records in list and detail views where useful.
- Retain JSON fallback when no target model is configured.

## P2: content experience

### markdown

- Add an editor and sanitized preview for Markdown fields.
- Surface useful read-only metadata produced by Markdown plugins.

### images and blobs

- Preview existing and newly uploaded images.
- Add alt text and aspect-ratio controls for image objects.
- Support multiple-image list fields.
- Show upload progress, replacement controls, and clear MIME or size errors.
- Resolve blob URLs on the server before sending them to the browser.

### collection presentation

- Allow configurable list columns instead of always guessing fields such as `title` or `name`.
- Add a metadata panel for record key, AT URI, CID, author, and copy actions.
- Preserve filters, sort, pagination, and selection state in the URL where practical.

### lexicon management

- Inspect local, installed, and generated lexicons.
- Show pinned versions of schemas published by other authors.
- Check whether owned lexicons and permission sets are published.
- Provide dry-run output and DNS TXT guidance for publishing.
- Keep credentialed publication an explicit administrative action.

### public repository browsing

- Open another handle or DID in a read-only mode.
- Resolve its PDS and browse known configured collections.
- Resolve a supplied AT URI when its schema is known.
- Clearly separate local editable records from remote public records.

## developer-only concerns

The following Airspace features should remain in code, configuration, or the CLI rather than becoming first-class CMS controls:

- cache drivers, TTLs, and invalidation internals
- type-only models
- worker and edge runtime configuration
- bundle-size optimization
- arbitrary plugin authoring
- lower-level schema compilation
- application permission-set design

Studio may display useful diagnostics from these systems, but should not attempt to configure them generically.

## out of scope

Permissioned spaces and draft publishing are intentionally not included in Studio while the protocol is experimental and unavailable on most PDSes.

## implementation order

1. [x] Add the optional Studio configuration entry point.
2. [x] Add conflict-safe updates and deletes.
3. [x] Add cursor pagination and collection navigation tools.
4. [x] Add structured list, union, and relation editors.
5. [ ] Add OAuth and scope recovery.
6. [ ] Add bulk operations and live refresh notifications.
7. [ ] Add richer media, Markdown, lexicon, and public browsing tools.