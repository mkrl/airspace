<script setup lang="ts">
import type { StudioFieldProps } from './types'

const props = defineProps<StudioFieldProps>()
const emit = defineEmits<{ 'update:modelValue': [value: unknown] }>()

const hasValue = computed(() => !!props.modelValue && typeof props.modelValue === 'object' && Object.keys(props.modelValue as Record<string, unknown>).length > 0)
const childRequired = computed(() => props.required || hasValue.value)

function updateProperty(key: string, value: unknown) {
  const currentValue = props.modelValue && typeof props.modelValue === 'object' ? props.modelValue : {}
  const nextValue = { ...currentValue } as Record<string, unknown>

  if (value === undefined || value === '')
    delete nextValue[key]
  else
    nextValue[key] = value
  emit('update:modelValue', Object.keys(nextValue).length || props.required ? nextValue : undefined)
}
</script>

<template>
  <fieldset class="field object-field">
    <legend>{{ name }}<span v-if="required" aria-label="required"> *</span></legend>
    <p v-if="schema.description" class="field-help">{{ schema.description }}</p>
    <StudioField
      v-for="(child, key) in schema.properties"
      :key="key"
      :name="key"
      :input-name="`${inputName}.${key}`"
      :schema="child"
      :required="childRequired && schema.required?.includes(key)"
      :model-value="(modelValue as Record<string, unknown> | undefined)?.[key]"
      @update:model-value="updateProperty(key, $event)"
    />
  </fieldset>
</template>