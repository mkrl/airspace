<script setup lang="ts">
defineProps<{
  name: string
  description?: string
  required?: boolean
  error?: string
}>()
</script>

<template>
  <label class="field">
    <span class="field-name">{{ name }}<b v-if="required" aria-label="required"> *</b></span>
    <small v-if="description" class="field-help">{{ description }}</small>
    <slot />
    <small v-if="error" class="field-error">{{ error }}</small>
  </label>
</template>