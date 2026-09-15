<script setup lang="ts">
import type { StudioFieldProps } from './types'

defineProps<StudioFieldProps>()
defineEmits<{ 'update:modelValue': [value: unknown] }>()
</script>

<template>
  <label class="field check-field">
    <input type="checkbox" :name="inputName" :checked="Boolean(modelValue)" @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)">
    <span>{{ name }}</span>
    <small v-if="schema.description">{{ schema.description }}</small>
  </label>
</template>