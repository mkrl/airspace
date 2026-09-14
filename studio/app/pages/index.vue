<script setup lang="ts">
import type { StudioCollection, StudioRecord } from '#shared/studio'

const { data: studio, refresh: refreshStudio } = await useFetch('/api/studio')
const selectedName = ref('')
const records = ref<StudioRecord[]>([])
const selected = ref<StudioRecord | null>(null)
const value = ref<Record<string, unknown>>({})
const busy = ref(false)
const message = ref('')
const issues = ref<Record<string, string>>({})

const selectedCollection = computed(() => studio.value?.collections.find(item => item.name === selectedName.value) as StudioCollection | undefined)
const titleField = (record: StudioRecord) => ['title', 'name', 'displayName', 'label'].map(key => record.value[key]).find(item => typeof item === 'string') as string | undefined

watch(() => studio.value?.account, (account) => {
  if (account && !selectedName.value && studio.value?.collections[0])
    void selectCollection(studio.value.collections[0].name)
}, { immediate: true })

function errorMessage(error: unknown) {
  return (error as { data?: { message?: string } }).data?.message ?? (error as Error).message ?? 'something went wrong'
}

async function signIn(event: Event) {
  busy.value = true
  message.value = ''
  const form = new FormData(event.target as HTMLFormElement)
  try {
    await $fetch('/api/studio/session', {
      method: 'POST',
      body: { service: form.get('service'), identifier: form.get('identifier'), password: form.get('password') },
    })
    await refreshStudio()
  }
  catch (error) {
    message.value = errorMessage(error)
  }
  finally {
    busy.value = false
  }
}

async function signOut() {
  await $fetch('/api/studio/session', { method: 'DELETE' })
  records.value = []
  selected.value = null
  await refreshStudio()
}

async function selectCollection(name: string) {
  selectedName.value = name
  selected.value = null
  value.value = {}
  message.value = ''
  records.value = await $fetch<StudioRecord[]>(`/api/studio/${name}/records`)
}

function edit(record: StudioRecord) {
  selected.value = record
  const { $type: _, ...editable } = record.value
  value.value = JSON.parse(JSON.stringify(editable)) as Record<string, unknown>
  issues.value = {}
  message.value = ''
}

function createRecord() {
  selected.value = null
  value.value = Object.fromEntries(Object.entries(selectedCollection.value?.fields ?? {}).flatMap(([name, field]) => field.default === undefined ? [] : [[name, field.default]]))
  issues.value = {}
  message.value = ''
}

function updateField(name: string, next: unknown) {
  if (next === undefined || next === '')
    delete value.value[name]
  else
    value.value[name] = next
}

async function save() {
  busy.value = true
  issues.value = {}
  message.value = ''
  try {
    const base = `/api/studio/${selectedName.value}/records`
    await $fetch(selected.value ? `${base}/${selected.value.rkey}` : base, { method: selected.value ? 'PUT' : 'POST', body: value.value })
    await selectCollection(selectedName.value)
    message.value = 'Record saved.'
  }
  catch (error) {
    const detail = error as { data?: { message?: string, data?: { issues?: Array<{ path: string, message: string }> } } }
    for (const issue of detail.data?.data?.issues ?? [])
      issues.value[issue.path.replace(/^\.?/, '').split('.')[0]!] = issue.message
    message.value = detail.data?.message ?? 'Could not save the record.'
  }
  finally {
    busy.value = false
  }
}

async function remove() {
  if (!selected.value || !confirm(`Delete ${selected.value.rkey}? This cannot be undone.`))
    return
  busy.value = true
  try {
    await $fetch(`/api/studio/${selectedName.value}/records/${selected.value.rkey}`, { method: 'DELETE' })
    await selectCollection(selectedName.value)
  }
  finally {
    busy.value = false
  }
}

useSeoMeta({ title: 'airspace studio', description: 'Edit typed content in your Atproto PDS.' })
</script>

<template>
  <section v-if="studio && !studio.configured" class="setup">
    <span class="setup-mark" aria-hidden="true">{ }</span>
    <h1>Add your content model</h1>
    <p>Studio looks for <code>studio/lexicons.ts</code>. Export the same airspace lexicons your application uses, then restart the development server.</p>
    <pre><code>import { defineLexicons, field } from 'airspace/lexicon'

export default defineLexicons('dev.example', {
  note: {
    title: field.text({ max: 120 }),
    body: field.markdown(),
    published: field.boolean().optional(),
  },
})</code></pre>
    <p class="setup-note">Already have a model elsewhere? Re-export it: <code>export { default } from '../src/lexicons.ts'</code></p>
  </section>

  <section v-else-if="studio && !studio.account" class="signin">
    <div>
      <h1>Your lexicon, with an editing desk.</h1>
      <p>Sign in with an app password to manage records in your PDS.</p>
    </div>
    <form @submit.prevent="signIn">
      <label>Service <input name="service" type="url" value="https://bsky.social" required></label>
      <label>Handle or email <input name="identifier" autocomplete="username" required></label>
      <label>App password <input name="password" type="password" autocomplete="current-password" required></label>
      <button class="primary-action" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
      <p v-if="message" class="form-message error" role="alert">{{ message }}</p>
    </form>
  </section>

  <div v-else-if="studio?.account" class="studio-layout">
    <aside class="studio-sidebar">
      <div class="account">
        <span class="account-mark">{{ studio.account.handle.slice(0, 1) }}</span>
        <span><strong>{{ studio.account.handle }}</strong><small>{{ studio.account.service }}</small></span>
      </div>
      <nav aria-label="Collections">
        <button v-for="collection in studio.collections" :key="collection.name" :class="{ active: selectedName === collection.name }" @click="selectCollection(collection.name)">
          <span>{{ collection.name }}</span><small>{{ collection.nsid }}</small>
        </button>
      </nav>
      <button class="signout" @click="signOut">Sign out</button>
    </aside>

    <section v-if="selectedCollection" class="workspace">
      <header class="workspace-header">
        <div><p class="eyebrow">{{ selectedCollection.nsid }}</p><h1>{{ selectedCollection.name }}</h1><p v-if="selectedCollection.description">{{ selectedCollection.description }}</p></div>
        <button v-if="!selectedCollection.singleton || !records.length" class="primary-action" @click="createRecord">New record</button>
      </header>

      <div class="content-grid">
        <div class="record-list">
          <button v-for="record in records" :key="record.rkey" :class="{ active: selected?.rkey === record.rkey }" @click="edit(record)">
            <strong>{{ titleField(record) ?? record.rkey }}</strong><small>{{ record.rkey }}</small>
          </button>
          <p v-if="!records.length" class="empty">No records yet.</p>
        </div>

        <form class="record-editor" @submit.prevent="save">
          <header><div><h2>{{ selected ? 'Edit record' : 'New record' }}</h2><code v-if="selected">{{ selected.rkey }}</code></div><button v-if="selected" type="button" class="danger-action" :disabled="busy" @click="remove">Delete</button></header>
          <StudioField
            v-for="(field, name) in selectedCollection.fields"
            :key="name"
            :name="name"
            :schema="field"
            :required="selectedCollection.required.includes(name)"
            :model-value="value[name]"
            :issue="issues[name]"
            @update:model-value="updateField(name, $event)"
          />
          <footer><button class="primary-action" :disabled="busy">{{ busy ? 'Saving…' : 'Save record' }}</button><p v-if="message" class="form-message" :class="{ error: Object.keys(issues).length }" role="status">{{ message }}</p></footer>
        </form>
      </div>
    </section>
  </div>
</template>
