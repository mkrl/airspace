<script setup lang="ts">
import type { StudioRecord } from '#shared/studio'
import type { StudioFieldProps } from './types'
import FieldLayout from './FieldLayout.vue'

const props = defineProps<StudioFieldProps>()
const emit = defineEmits<{ 'update:modelValue': [value: unknown] }>()
const records = ref<StudioRecord[]>([])
const busy = ref(false)
const error = ref('')

const selectedUri = computed(() => {
  if (typeof props.modelValue === 'string')
    return props.modelValue
  if (props.modelValue && typeof props.modelValue === 'object') {
    const uri = (props.modelValue as Record<string, unknown>).uri
    return typeof uri === 'string' ? uri : ''
  }
  return ''
})

function recordLabel(record: StudioRecord) {
  const label = ['name', 'title', 'displayName', 'label']
    .map(key => record.value[key])
    .find(value => typeof value === 'string') as string | undefined
  return label ? `${label} (${record.rkey})` : record.rkey
}

function updateValue(event: Event) {
  const uri = (event.target as HTMLSelectElement).value
  const record = records.value.find(item => item.uri === uri)
  emit('update:modelValue', record
    ? props.schema.relationValue === 'uri' ? record.uri : { uri: record.uri, cid: record.cid }
    : undefined)
}

watch(() => props.schema.relation, async (relation) => {
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
    <select :name="inputName" :value="selectedUri" :required="required" :disabled="busy" @change="updateValue">
      <option value="">{{ busy ? 'Loading…' : required ? 'Select a record' : 'Not set' }}</option>
      <option v-for="record in records" :key="record.uri" :value="record.uri">{{ recordLabel(record) }}</option>
    </select>
  </FieldLayout>
</template>
