<script setup lang="ts">
import type { StudioField, StudioRecord } from '#shared/studio'

defineOptions({ name: 'StudioField' })

const props = defineProps<{
  name: string
  schema: StudioField
  modelValue: unknown
  required?: boolean
  issue?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: unknown] }>()
const uploadBusy = ref(false)
const uploadError = ref('')
const relationRecords = ref<StudioRecord[]>([])
const relationBusy = ref(false)
const relationError = ref('')

const choices = computed(() => props.schema.enum ?? props.schema.knownValues)
const multiline = computed(() => props.schema.description === 'Markdown.' || (props.schema.maxGraphemes ?? 0) > 1000)
const relationValue = computed(() => {
  if (typeof props.modelValue === 'string')
    return props.modelValue
  if (props.modelValue && typeof props.modelValue === 'object') {
    const uri = (props.modelValue as Record<string, unknown>).uri
    return typeof uri === 'string' ? uri : ''
  }
  return ''
})
const jsonValue = computed({
  get: () => props.modelValue === undefined ? '' : JSON.stringify(props.modelValue, null, 2),
  set: (value: string) => {
    try {
      emit('update:modelValue', value.trim() ? JSON.parse(value) : undefined)
    }
    catch {}
  },
})

const datetimeValue = computed(() => {
  if (props.schema.format !== 'datetime' || typeof props.modelValue !== 'string' || !props.modelValue)
    return props.modelValue as string | undefined
  const date = new Date(props.modelValue)
  if (Number.isNaN(date.getTime()))
    return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
})

function updateString(event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (!value) {
    emit('update:modelValue', undefined)
    return
  }
  emit('update:modelValue', props.schema.format === 'datetime' ? new Date(value).toISOString() : value)
}

function updateObject(key: string, value: unknown) {
  const next = { ...((props.modelValue && typeof props.modelValue === 'object') ? props.modelValue : {}) } as Record<string, unknown>
  if (value === undefined || value === '')
    delete next[key]
  else
    next[key] = value
  emit('update:modelValue', next)
}

function relationLabel(record: StudioRecord) {
  const label = ['name', 'title', 'displayName', 'label']
    .map(key => record.value[key])
    .find(value => typeof value === 'string') as string | undefined
  return label ? `${label} (${record.rkey})` : record.rkey
}

function updateRelation(event: Event) {
  const uri = (event.target as HTMLSelectElement).value
  const record = relationRecords.value.find(item => item.uri === uri)
  emit('update:modelValue', record ? { uri: record.uri, cid: record.cid } : undefined)
}

watch(() => props.schema.relation, async (relation) => {
  relationRecords.value = []
  relationError.value = ''
  if (!relation)
    return
  relationBusy.value = true
  try {
    relationRecords.value = await $fetch<StudioRecord[]>(`/api/studio/${relation}/records`)
  }
  catch (error) {
    relationError.value = (error as { data?: { message?: string } }).data?.message ?? 'could not load related records'
  }
  finally {
    relationBusy.value = false
  }
}, { immediate: true })

async function upload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file)
    return
  uploadBusy.value = true
  uploadError.value = ''
  try {
    const body = new FormData()
    body.set('file', file)
    const result = await $fetch<{ blob: unknown }>('/api/studio/blob', { method: 'POST', body })
    emit('update:modelValue', result.blob)
  }
  catch (error) {
    uploadError.value = (error as { data?: { message?: string } }).data?.message ?? 'upload failed'
  }
  finally {
    uploadBusy.value = false
  }
}
</script>

<template>
  <fieldset v-if="schema.type === 'object' && schema.properties" class="field object-field">
    <legend>{{ name }}<span v-if="required" aria-label="required"> *</span></legend>
    <p v-if="schema.description" class="field-help">{{ schema.description }}</p>
    <StudioField
      v-for="(child, key) in schema.properties"
      :key="key"
      :name="key"
      :schema="child"
      :required="schema.required?.includes(key)"
      :model-value="(modelValue as Record<string, unknown> | undefined)?.[key]"
      @update:model-value="updateObject(key, $event)"
    />
  </fieldset>

  <label v-else-if="schema.type === 'boolean'" class="field check-field">
    <input type="checkbox" :checked="Boolean(modelValue)" @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)">
    <span>{{ name }}</span>
    <small v-if="schema.description">{{ schema.description }}</small>
  </label>

  <label v-else class="field">
    <span class="field-name">{{ name }}<b v-if="required" aria-label="required"> *</b></span>
    <small v-if="schema.description" class="field-help">{{ schema.description }}</small>
    <select v-if="choices" :value="modelValue" :required="required" @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value || undefined)">
      <option v-if="!required" value="">Not set</option>
      <option v-for="choice in choices" :key="choice" :value="choice">{{ choice }}</option>
    </select>
    <select v-else-if="schema.relation" :value="relationValue" :required="required" :disabled="relationBusy" @change="updateRelation">
      <option value="">{{ relationBusy ? 'Loading…' : required ? 'Select a record' : 'Not set' }}</option>
      <option v-for="record in relationRecords" :key="record.uri" :value="record.uri">{{ relationLabel(record) }}</option>
    </select>
    <textarea v-else-if="multiline && schema.type === 'string'" :value="modelValue as string" :required="required" :maxlength="schema.maxGraphemes" rows="9" @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value || undefined)" />
    <input v-else-if="schema.type === 'string'" :type="schema.format === 'datetime' ? 'datetime-local' : schema.format === 'uri' ? 'url' : 'text'" :value="datetimeValue" :required="required" :maxlength="schema.maxGraphemes" @input="updateString">
    <input v-else-if="schema.type === 'integer'" type="number" step="1" :value="modelValue as number" :required="required" :min="schema.minimum" :max="schema.maximum" @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value === '' ? undefined : Number(($event.target as HTMLInputElement).value))">
    <template v-else-if="schema.type === 'blob'">
      <input type="file" :accept="schema.accept?.join(',')" :disabled="uploadBusy" @change="upload">
      <small>{{ uploadBusy ? 'Uploading…' : modelValue ? 'Blob uploaded' : `Maximum ${Math.round((schema.maxSize ?? 5000000) / 1000000)} MB` }}</small>
      <button v-if="modelValue" class="inline-action" type="button" @click="$emit('update:modelValue', undefined)">Remove file</button>
    </template>
    <textarea v-else v-model="jsonValue" rows="6" spellcheck="false" placeholder="JSON value" />
    <small v-if="issue || uploadError || relationError" class="field-error">{{ issue || uploadError || relationError }}</small>
  </label>
</template>