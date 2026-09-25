<script setup lang="ts">
import type { StudioFieldProps } from './types'
import FieldLayout from './FieldLayout.vue'
import JsonField from './JsonField.vue'

const props = defineProps<StudioFieldProps>()
const emit = defineEmits<{ 'update:modelValue': [value: unknown] }>()

const selectedType = computed(() => {
  if (!props.modelValue || typeof props.modelValue !== 'object' || Array.isArray(props.modelValue))
    return ''
  const type = (props.modelValue as Record<string, unknown>).$type
  return typeof type === 'string' ? type : ''
})

const variantSchema = computed(() => selectedType.value ? props.schema.variants?.[selectedType.value] : undefined)
const usesJsonFallback = computed(() => !!selectedType.value && !variantSchema.value)
const variantValue = computed(() => {
  if (!props.modelValue || typeof props.modelValue !== 'object' || Array.isArray(props.modelValue))
    return undefined
  const { $type: _, ...value } = props.modelValue as Record<string, unknown>
  return value
})

function variantLabel(ref: string) {
  const [nsid, def = 'main'] = ref.split('#')
  const tail = nsid?.split('.').at(-1)
  return def === 'main' ? tail ?? ref : `${tail ?? nsid} · ${def}`
}

function updateType(event: Event) {
  const type = (event.target as HTMLSelectElement).value
  emit('update:modelValue', type ? { $type: type } : undefined)
}

function updateVariant(value: unknown) {
  if (!selectedType.value)
    return emit('update:modelValue', undefined)
  emit('update:modelValue', value && typeof value === 'object' && !Array.isArray(value)
    ? { $type: selectedType.value, ...value as Record<string, unknown> }
    : { $type: selectedType.value })
}
</script>

<template>
  <FieldLayout :name="name" :description="schema.description" :required="required" :error="issue">
    <select :name="inputName" :value="selectedType" :required="required" @change="updateType">
      <option value="">{{ required ? 'Select a type' : 'Not set' }}</option>
      <option v-for="ref in schema.refs ?? []" :key="ref" :value="ref">{{ variantLabel(ref) }}</option>
    </select>
    <StudioField
      v-if="selectedType && variantSchema"
      class="union-editor"
      :name="variantLabel(selectedType)"
      :input-name="`${inputName}.$value`"
      :schema="variantSchema"
      :model-value="variantValue"
      required
      @update:model-value="updateVariant"
    />
    <JsonField
      v-else-if="selectedType && usesJsonFallback"
      class="union-editor"
      :name="variantLabel(selectedType)"
      :input-name="`${inputName}.$value`"
      :schema="{ type: 'unknown', description: 'This union member is not configured locally, so its raw JSON is preserved.' }"
      :model-value="modelValue"
      required
      @update:model-value="emit('update:modelValue', $event)"
    />
  </FieldLayout>
</template>
