<script setup lang="ts">
import type { StudioFieldProps } from './types'

const props = defineProps<StudioFieldProps>()
const emit = defineEmits<{ 'update:modelValue': [value: unknown] }>()

const values = computed(() => Array.isArray(props.modelValue) ? props.modelValue : [])
const minimum = computed(() => props.schema.minLength ?? 0)
const maximum = computed(() => props.schema.maxLength ?? Number.POSITIVE_INFINITY)

function initialValue() {
  const schema = props.schema.items
  if (!schema)
    return undefined
  if (schema.default !== undefined)
    return schema.default
  if (schema.const !== undefined)
    return schema.const
  if (schema.type === 'boolean')
    return false
  if (schema.type === 'object')
    return {}
  if (schema.type === 'array')
    return []
  return undefined
}

function addItem() {
  if (values.value.length >= maximum.value)
    return
  emit('update:modelValue', [...values.value, initialValue()])
}

function updateItem(index: number, value: unknown) {
  const nextValues = [...values.value]
  nextValues[index] = value
  emit('update:modelValue', nextValues)
}

function removeItem(index: number) {
  if (values.value.length <= minimum.value)
    return
  emit('update:modelValue', values.value.filter((_, itemIndex) => itemIndex !== index))
}
</script>

<template>
  <fieldset class="field object-field list-field">
    <legend>{{ name }}<span v-if="required" aria-label="required"> *</span></legend>
    <p v-if="schema.description" class="field-help">{{ schema.description }}</p>
    <div v-for="(value, index) in values" :key="index" class="list-item">
      <StudioField
        v-if="schema.items"
        :name="`Item ${index + 1}`"
        :input-name="`${inputName}.${index}`"
        :schema="schema.items"
        :model-value="value"
        required
        @update:model-value="updateItem(index, $event)"
      />
      <button
        type="button"
        class="inline-action danger-action list-item-remove"
        :disabled="values.length <= minimum"
        :aria-label="`Remove ${name} item ${index + 1}`"
        @click="removeItem(index)"
      >
        Remove
      </button>
    </div>
    <button
      type="button"
      class="inline-action"
      :disabled="values.length >= maximum"
      @click="addItem"
    >
      Add item
    </button>
    <small v-if="issue" class="field-error">{{ issue }}</small>
  </fieldset>
</template>
