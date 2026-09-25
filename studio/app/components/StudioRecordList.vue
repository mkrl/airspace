<script setup lang="ts">
import type { StudioCollection, StudioRecordPage } from '#shared/studio'

const props = defineProps<{
  collection: StudioCollection
  selectedRkey?: string
}>()

const route = useRoute()
const router = useRouter()
const search = ref('')
const field = ref('')
const sort = ref('')
const direction = ref<'asc' | 'desc'>('asc')
const reverse = ref(false)
const limit = ref(25)
const toolsPanel = ref<HTMLDetailsElement | null>(null)

function queryValue(name: string): string {
  const value = route.query[name]
  return typeof value === 'string' ? value : ''
}

function queryValues(name: string): string[] {
  const value = route.query[name]
  return Array.isArray(value) ? value.filter(item => typeof item === 'string') : typeof value === 'string' ? [value] : []
}

function syncControls() {
  search.value = queryValue('search')
  field.value = queryValue('field')
  sort.value = queryValue('sort')
  direction.value = queryValue('direction') === 'desc' ? 'desc' : 'asc'
  reverse.value = queryValue('reverse') === 'true'
  const requestedLimit = Number(queryValue('limit') || 25)
  limit.value = [10, 25, 50, 100].includes(requestedLimit) ? requestedLimit : 25
}

syncControls()
watch(() => route.query, syncControls)

const queryMode = computed(() => !!queryValue('search') || !!queryValue('sort'))
const apiUrl = computed(() => {
  const query = new URLSearchParams({ page: 'true', limit: String(limit.value) })
  for (const name of ['cursor', 'reverse', 'search', 'field', 'sort', 'direction', 'offset']) {
    const value = queryValue(name)
    if (value)
      query.set(name, value)
  }
  return `/api/studio/${props.collection.name}/records?${query}`
})

const requestFetch = useRequestFetch()
const { data, status, refresh } = await useAsyncData<StudioRecordPage>(`records:${props.collection.name}:${route.path}`, () => requestFetch<StudioRecordPage>(apiUrl.value), {
  default: (): StudioRecordPage => ({ records: [], mode: 'browse' }),
})
watch(apiUrl, () => refresh())

const records = computed(() => data.value.records)
const sortableFields = computed(() => Object.entries(props.collection.fields)
  .filter(([, schema]) => ['string', 'integer', 'boolean'].includes(schema.type))
  .map(([name]) => name))
const history = computed(() => queryValues('before'))
const currentCursor = computed(() => queryValue('cursor'))
const currentOffset = computed(() => Number(queryValue('offset') || 0))

function titleField(record: StudioRecordPage['records'][number]) {
  return ['title', 'name', 'displayName', 'label', 'text']
    .map(key => record.value[key])
    .find(value => typeof value === 'string') as string | undefined
}

function cleanQuery(values: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== '' && (!Array.isArray(value) || value.length)))
}

function listQuery(patch: Record<string, string | string[] | undefined> = {}) {
  return cleanQuery({ ...route.query as Record<string, string | string[]>, ...patch })
}

function applyTools() {
  if (toolsPanel.value)
    toolsPanel.value.open = false
  void navigateTo({
    path: router.currentRoute.value.path,
    query: cleanQuery({
      search: search.value.trim() || undefined,
      field: search.value.trim() && field.value ? field.value : undefined,
      sort: sort.value || undefined,
      direction: sort.value ? direction.value : undefined,
      reverse: !search.value.trim() && !sort.value && reverse.value ? 'true' : undefined,
      limit: limit.value === 25 ? undefined : String(limit.value),
    }),
  })
}

function resetTools() {
  search.value = ''
  field.value = ''
  sort.value = ''
  direction.value = 'asc'
  reverse.value = false
  limit.value = 25
  applyTools()
}

const previousQuery = computed(() => {
  if (data.value.mode === 'query') {
    if (!currentOffset.value)
      return undefined
    return listQuery({ offset: String(Math.max(0, currentOffset.value - limit.value)) || undefined })
  }
  const previous = history.value.at(-1)
  if (previous === undefined)
    return undefined
  return listQuery({
    cursor: previous === '~' ? undefined : previous,
    before: history.value.slice(0, -1),
  })
})

const nextQuery = computed(() => {
  if (data.value.mode === 'query') {
    if (!data.value.hasMore)
      return undefined
    return listQuery({ offset: String(currentOffset.value + limit.value) })
  }
  if (!data.value.hasMore || !data.value.cursor)
    return undefined
  return listQuery({ cursor: data.value.cursor, before: [...history.value, currentCursor.value || '~'] })
})
</script>

<template>
  <div class="record-browser">
    <details ref="toolsPanel" class="record-tools-panel">
      <summary>
        <span>Search</span>
        <small v-if="queryMode">Filters active</small>
      </summary>
      <form class="record-tools" @submit.prevent="applyTools">
        <label>
          <span>Search term</span>
          <input v-model="search" type="search" placeholder="Search records">
        </label>
        <label>
          <span>Search field</span>
          <select v-model="field" :disabled="!search.trim()">
            <option value="">All fields</option>
            <option v-for="(_, name) in collection.fields" :key="name" :value="name">{{ name }}</option>
          </select>
        </label>
        <label>
          <span>Sort</span>
          <select v-model="sort">
            <option value="">Collection default</option>
            <option v-for="name in sortableFields" :key="name" :value="name">{{ name }}</option>
          </select>
        </label>
        <label>
          <span>Direction</span>
          <select v-model="direction" :disabled="!sort">
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>
        <label>
          <span>Page size</span>
          <select v-model="limit">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </label>
        <label class="record-direction">
          <input v-model="reverse" type="checkbox" :disabled="queryMode">
          <span>Oldest first</span>
        </label>
        <div class="record-tool-actions">
          <button type="submit">Apply</button>
          <button type="button" class="inline-action" @click="resetTools">Reset</button>
        </div>
        <small>{{ data.mode === 'query' ? 'Search and sorting scan the collection in memory.' : 'Browsing directly from the PDS.' }}</small>
      </form>
    </details>

    <div class="record-list" :aria-busy="status === 'pending'">
      <NuxtLink
        v-for="record in records"
        :key="record.rkey"
        :to="{ path: `/${collection.name}/${record.rkey}`, query: route.query }"
        :class="{ 'record-selected': record.rkey === selectedRkey }"
      >
        <strong>{{ titleField(record) ?? record.rkey }}</strong><small>{{ record.rkey }}</small>
      </NuxtLink>
      <p v-if="!records.length && status !== 'pending'" class="empty">No records found.</p>
    </div>

    <nav v-if="previousQuery || nextQuery" class="record-pagination" aria-label="Record pages">
      <NuxtLink v-if="previousQuery" class="button" :to="{ path: route.path, query: previousQuery }">Previous</NuxtLink>
      <span v-else />
      <NuxtLink v-if="nextQuery" class="button" :to="{ path: route.path, query: nextQuery }">Next</NuxtLink>
    </nav>
  </div>
</template>
