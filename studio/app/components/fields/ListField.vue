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

function moveItem(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= values.value.length)
    return
  const nextValues = [...values.value]
  const [item] = nextValues.splice(index, 1)
  nextValues.splice(target, 0, item)
  emit('update:modelValue', nextValues)
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
      <div class="list-item-controls">
        <button
          type="button"
          class="inline-action"
          :disabled="index === 0"
          :aria-label="`Move ${name} item ${index + 1} up`"
          @click="moveItem(index, -1)"
        >
          Up
        </button>
        <button
          type="button"
          class="inline-action"
          :disabled="index === values.length - 1"
          :aria-label="`Move ${name} item ${index + 1} down`"
          @click="moveItem(index, 1)"
        >
          Down
        </button>
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
