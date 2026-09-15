<script setup lang="ts">
import type { StudioFieldProps } from './types'
import FieldLayout from './FieldLayout.vue'

defineProps<StudioFieldProps>()
defineEmits<{ 'update:modelValue': [value: unknown] }>()
</script>

<template>
  <FieldLayout :name="name" :description="schema.description" :required="required" :error="issue">
    <input type="number" :name="inputName" step="1" :value="modelValue as number" :required="required" :min="schema.minimum" :max="schema.maximum" @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value === '' ? undefined : Number(($event.target as HTMLInputElement).value))">
  </FieldLayout>
</template>