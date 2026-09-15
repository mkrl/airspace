<script setup lang="ts">
import type { StudioFieldProps } from './types'
import FieldLayout from './FieldLayout.vue'

const props = defineProps<StudioFieldProps>()
defineEmits<{ 'update:modelValue': [value: unknown] }>()

const choices = computed(() => props.schema.enum ?? props.schema.knownValues ?? [])
</script>

<template>
  <FieldLayout :name="name" :description="schema.description" :required="required" :error="issue">
    <select :name="inputName" :value="modelValue" :required="required" @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value || undefined)">
      <option v-if="!required" value="">Not set</option>
      <option v-for="choice in choices" :key="choice" :value="choice">{{ choice }}</option>
    </select>
  </FieldLayout>
</template>