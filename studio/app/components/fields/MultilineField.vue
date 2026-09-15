<script setup lang="ts">
import type { StudioFieldProps } from './types'
import FieldLayout from './FieldLayout.vue'

defineProps<StudioFieldProps>()
defineEmits<{ 'update:modelValue': [value: unknown] }>()
</script>

<template>
  <FieldLayout :name="name" :description="schema.description" :required="required" :error="issue">
    <textarea :name="inputName" :value="modelValue as string" :required="required" :maxlength="schema.maxGraphemes" rows="9" @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value || undefined)" />
  </FieldLayout>
</template>