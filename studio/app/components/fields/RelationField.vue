<script setup lang="ts">
import type { StudioRecord } from '#shared/studio'
import type { StudioFieldProps } from './types'
import FieldLayout from './FieldLayout.vue'

const props = defineProps<StudioFieldProps>()
const emit = defineEmits<{ 'update:modelValue': [value: unknown] }>()
const records = ref<StudioRecord[]>([])
const busy = ref(false)
const error = ref('')

const multiple = computed(() => props.schema.type === 'array')
const relationSchema = computed(() => props.schema.type === 'array' ? props.schema.items : props.schema)

const selectedUris = computed(() => {
  if (multiple.value) {
    if (!Array.isArray(props.modelValue))
      return []
    return props.modelValue.flatMap((item) => {
      if (typeof item === 'string')
        return [item]
      if (item && typeof item === 'object') {
        const uri = (item as Record<string, unknown>).uri
        return typeof uri === 'string' ? [uri] : []
      }
      return []
    })
  }
  if (typeof props.modelValue === 'string')
    return [props.modelValue]
  if (props.modelValue && typeof props.modelValue === 'object') {
    const uri = (props.modelValue as Record<string, unknown>).uri
    return typeof uri === 'string' ? [uri] : []
  }
  return []
})

function recordLabel(record: StudioRecord) {
  const label = ['name', 'title', 'displayName', 'label']
    .map(key => record.value[key])
    .find(value => typeof value === 'string') as string | undefined
  return label ? `${label} (${record.rkey})` : record.rkey
}

function relationValue(record: StudioRecord) {
  return relationSchema.value?.relationValue === 'uri' ? record.uri : { uri: record.uri, cid: record.cid }
}

function updateValue(event: Event) {
  const input = event.target as HTMLSelectElement
  const uris = multiple.value
    ? [...input.selectedOptions].map(option => option.value).filter(Boolean)
    : input.value ? [input.value] : []
  const selected = uris.map(uri => records.value.find(item => item.uri === uri)).filter(Boolean) as StudioRecord[]
  emit('update:modelValue', multiple.value ? selected.map(relationValue) : selected[0] ? relationValue(selected[0]) : undefined)
}

watch(() => relationSchema.value?.relation, async (relation) => {
  records.value = []
  error.value = ''
  if (!relation)
    return

  busy.value = true
  try {
    records.value = await $fetch<StudioRecord[]>(`/api/studio/${relation}/records?all=true`)
  }
  catch (fetchError) {
    error.value = (fetchError as { data?: { message?: string } }).data?.message ?? 'could not load related records'
  }
  finally {
    busy.value = false
  }
}, { immediate: true })
</script>

<template>
  <FieldLayout :name="name" :description="schema.description" :required="required" :error="issue || error">
    <select
      :name="inputName"
      :value="multiple ? selectedUris : selectedUris[0]"
      :required="required && !multiple"
      :disabled="busy"
      :multiple="multiple"
      :size="multiple ? Math.min(Math.max(records.length, 4), 10) : undefined"
      class="relation-select"
      @change="updateValue"
    >
      <option v-if="!multiple" value="">{{ busy ? 'Loading…' : required ? 'Select a record' : 'Not set' }}</option>
      <option v-for="record in records" :key="record.uri" :value="record.uri">{{ recordLabel(record) }}</option>
    </select>
    <small v-if="multiple && selectedUris.length">{{ selectedUris.length }} selected</small>
  </FieldLayout>
</template>
