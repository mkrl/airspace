<script setup lang="ts">
import type { StudioFieldProps } from './types'
import FieldLayout from './FieldLayout.vue'

const props = defineProps<StudioFieldProps>()
const emit = defineEmits<{ 'update:modelValue': [value: unknown] }>()

const inputValue = computed(() => {
  if (props.schema.format !== 'datetime' || typeof props.modelValue !== 'string' || !props.modelValue)
    return props.modelValue as string | undefined

  const date = new Date(props.modelValue)
  if (Number.isNaN(date.getTime()))
    return ''

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
})

function updateValue(event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (!value) {
    emit('update:modelValue', undefined)
    return
  }
  emit('update:modelValue', props.schema.format === 'datetime' ? new Date(value).toISOString() : value)
}
</script>

<template>
  <FieldLayout :name="name" :description="schema.description" :required="required" :error="issue">
    <input :name="inputName" :type="schema.format === 'datetime' ? 'datetime-local' : schema.format === 'uri' ? 'url' : 'text'" :value="inputValue" :required="required" :maxlength="schema.maxGraphemes" @input="updateValue">
  </FieldLayout>
</template>