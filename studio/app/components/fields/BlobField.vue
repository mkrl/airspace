<script setup lang="ts">
import type { StudioFieldProps } from './types'
import FieldLayout from './FieldLayout.vue'

defineProps<StudioFieldProps>()
const emit = defineEmits<{ 'update:modelValue': [value: unknown] }>()
const busy = ref(false)
const error = ref('')

async function upload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file)
    return

  busy.value = true
  error.value = ''
  try {
    const body = new FormData()
    body.set('file', file)
    const result = await $fetch<{ blob: unknown }>('/api/studio/blob', { method: 'POST', body })
    emit('update:modelValue', result.blob)
  }
  catch (uploadError) {
    error.value = (uploadError as { data?: { message?: string } }).data?.message ?? 'upload failed'
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <FieldLayout :name="name" :description="schema.description" :required="required" :error="issue || error">
    <input type="file" :name="inputName" :accept="schema.accept?.join(',')" :disabled="busy" @change="upload">
    <small>{{ busy ? 'Uploading…' : modelValue ? 'Blob uploaded' : `Maximum ${Math.round((schema.maxSize ?? 5000000) / 1000000)} MB` }}</small>
    <button v-if="modelValue" class="inline-action" type="button" @click="emit('update:modelValue', undefined)">Remove file</button>
  </FieldLayout>
</template>