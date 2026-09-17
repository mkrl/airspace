<script setup lang="ts">
import type { StudioCollection, StudioRecord } from '#shared/studio'
import { clearNewRecordDraft, restoreNewRecordDraft, saveNewRecordDraft } from '~/utils/new-record-draft'

const props = defineProps<{
  collection: StudioCollection
  record: StudioRecord | null
}>()

const value = ref<Record<string, unknown>>(initialValue())
const cid = ref(props.record?.cid ?? '')
const busy = ref(false)
const message = ref('')
const issues = ref<Record<string, string>>({})
const conflicted = ref(false)

onMounted(() => {
  if (props.record)
    return
  const draft = restoreNewRecordDraft(window.localStorage, props.collection)
  if (draft)
    value.value = draft
})

function initialValue() {
  if (props.record) {
    const { $type: _, ...editable } = props.record.value
    return JSON.parse(JSON.stringify(editable)) as Record<string, unknown>
  }
  return Object.fromEntries(Object.entries(props.collection.fields).flatMap(([name, field]) => field.default === undefined ? [] : [[name, field.default]]))
}

function updateField(name: string, next: unknown) {
  if (next === undefined || next === '')
    delete value.value[name]
  else
    value.value[name] = next
  if (!props.record)
    saveNewRecordDraft(window.localStorage, props.collection, value.value)
}

async function save() {
  busy.value = true
  issues.value = {}
  message.value = ''
  conflicted.value = false
  try {
    const base = `/api/studio/${props.collection.name}/records`
    const result = await $fetch<{ rkey: string, cid: string }>(props.record ? `${base}/${props.record.rkey}` : base, {
      method: props.record ? 'PUT' : 'POST',
      body: value.value,
      headers: props.record ? { 'If-Match': cid.value } : undefined,
    })
    if (!props.record) {
      clearNewRecordDraft(window.localStorage, props.collection)
      return await navigateTo(`/${props.collection.name}/${result.rkey}`)
    }
    cid.value = result.cid
    message.value = 'Record saved.'
  }
  catch (error) {
    const detail = error as { statusCode?: number, data?: { statusCode?: number, message?: string, data?: { issues?: Array<{ path: string, message: string }> } } }
    for (const issue of detail.data?.data?.issues ?? [])
      issues.value[issue.path.replace(/^\.?/, '').split('.')[0]!] = issue.message
    conflicted.value = (detail.statusCode ?? detail.data?.statusCode) === 409
    message.value = conflicted.value ? 'This record changed after you loaded it. Your edits have not been saved.' : detail.data?.message ?? 'Could not save the record.'
  }
  finally {
    busy.value = false
  }
}

async function remove() {
  if (!props.record || !confirm(`Delete ${props.record.rkey}? This cannot be undone.`))
    return
  busy.value = true
  message.value = ''
  conflicted.value = false
  try {
    await $fetch(`/api/studio/${props.collection.name}/records/${props.record.rkey}`, {
      method: 'DELETE',
      headers: { 'If-Match': cid.value },
    })
    await navigateTo(`/${props.collection.name}`)
  }
  catch (error) {
    const detail = error as { statusCode?: number, data?: { statusCode?: number, message?: string } }
    conflicted.value = (detail.statusCode ?? detail.data?.statusCode) === 409
    message.value = conflicted.value ? 'This record changed after you loaded it and was not deleted.' : detail.data?.message ?? 'Could not delete the record.'
  }
  finally {
    busy.value = false
  }
}

async function loadLatest() {
  if (!props.record)
    return
  busy.value = true
  try {
    const latest = await $fetch<StudioRecord>(`/api/studio/${props.collection.name}/records/${props.record.rkey}`)
    const { $type: _, ...editable } = latest.value
    value.value = JSON.parse(JSON.stringify(editable)) as Record<string, unknown>
    cid.value = latest.cid
    conflicted.value = false
    issues.value = {}
    message.value = 'Loaded the latest record. Your previous edits were discarded.'
  }
  catch (error) {
    const detail = error as { data?: { message?: string } }
    message.value = detail.data?.message ?? 'Could not load the latest record.'
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <form class="record-editor routed-editor" @submit.prevent="save">
    <header>
      <div>
        <h2>{{ record ? 'Edit record' : 'New record' }}</h2>
        <code v-if="record">{{ record.rkey }}</code>
      </div>
      <button v-if="record" type="button" class="danger-action" :disabled="busy" @click="remove">Delete</button>
    </header>
    <StudioField
      v-for="(field, name) in collection.fields"
      :key="name"
      :name="name"
      :input-name="`${collection.name}.${name}`"
      :schema="field"
      :required="collection.required.includes(name)"
      :model-value="value[name]"
      :issue="issues[name]"
      @update:model-value="updateField(name, $event)"
    />
    <footer>
      <button class="primary-action" :disabled="busy">{{ busy ? 'Saving…' : 'Save record' }}</button>
      <button v-if="conflicted" type="button" class="inline-action" :disabled="busy" @click="loadLatest">Load latest</button>
      <p v-if="message" class="form-message" :class="{ error: conflicted || Object.keys(issues).length }" role="status">{{ message }}</p>
    </footer>
  </form>
</template>