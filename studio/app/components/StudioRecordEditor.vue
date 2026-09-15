<script setup lang="ts">
import type { StudioCollection, StudioRecord } from '#shared/studio'

const props = defineProps<{
  collection: StudioCollection
  record: StudioRecord | null
}>()

const value = ref<Record<string, unknown>>(initialValue())
const busy = ref(false)
const message = ref('')
const issues = ref<Record<string, string>>({})

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
}

async function save() {
  busy.value = true
  issues.value = {}
  message.value = ''
  try {
    const base = `/api/studio/${props.collection.name}/records`
    const result = await $fetch<{ rkey: string }>(props.record ? `${base}/${props.record.rkey}` : base, {
      method: props.record ? 'PUT' : 'POST',
      body: value.value,
    })
    if (!props.record)
      return await navigateTo(`/${props.collection.name}/${result.rkey}`)
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
  if (!props.record || !confirm(`Delete ${props.record.rkey}? This cannot be undone.`))
    return
  busy.value = true
  try {
    await $fetch(`/api/studio/${props.collection.name}/records/${props.record.rkey}`, { method: 'DELETE' })
    await navigateTo(`/${props.collection.name}`)
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
      <p v-if="message" class="form-message" :class="{ error: Object.keys(issues).length }" role="status">{{ message }}</p>
    </footer>
  </form>
</template>