<script setup lang="ts">
import type { StudioFieldProps } from './types'
import FieldLayout from './FieldLayout.vue'

const props = defineProps<StudioFieldProps>()
const emit = defineEmits<{ 'update:modelValue': [value: unknown] }>()

const jsonValue = computed({
  get: () => props.modelValue === undefined ? '' : JSON.stringify(props.modelValue, null, 2),
  set: (value: string) => {
    try {
      emit('update:modelValue', value.trim() ? JSON.parse(value) : undefined)
    }
    catch {}
  },
})
</script>

<template>
  <FieldLayout :name="name" :description="schema.description" :required="required" :error="issue">
    <textarea v-model="jsonValue" :name="inputName" rows="6" spellcheck="false" placeholder="JSON value" />
  </FieldLayout>
</template>