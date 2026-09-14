<script setup lang="ts">
import type { StudioField } from '#shared/studio'

defineOptions({ name: 'StudioField' })

const props = defineProps<{
  name: string
  schema: StudioField
  modelValue: unknown
  required?: boolean
  issue?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: unknown] }>()
const uploadBusy = ref(false)
const uploadError = ref('')

const choices = computed(() => props.schema.enum ?? props.schema.knownValues)
const multiline = computed(() => props.schema.description === 'Markdown.' || (props.schema.maxGraphemes ?? 0) > 1000)
const jsonValue = computed({
  get: () => props.modelValue === undefined ? '' : JSON.stringify(props.modelValue, null, 2),
  set: (value: string) => {
    try {
      emit('update:modelValue', value.trim() ? JSON.parse(value) : undefined)
    }
    catch {}
  },
})

function updateObject(key: string, value: unknown) {
  const next = { ...((props.modelValue && typeof props.modelValue === 'object') ? props.modelValue : {}) } as Record<string, unknown>
  if (value === undefined || value === '')
    delete next[key]
  else
    next[key] = value
  emit('update:modelValue', next)
}

async function upload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file)
    return
  uploadBusy.value = true
  uploadError.value = ''
  try {
    const body = new FormData()
    body.set('file', file)
    const result = await $fetch<{ blob: unknown }>('/api/studio/blob', { method: 'POST', body })
    emit('update:modelValue', result.blob)
  }
  catch (error) {
    uploadError.value = (error as { data?: { message?: string } }).data?.message ?? 'upload failed'
  }
  finally {
    uploadBusy.value = false
  }
}
</script>

<template>
  <fieldset v-if="schema.type === 'object' && schema.properties" class="field object-field">
    <legend>{{ name }}<span v-if="required" aria-label="required"> *</span></legend>
    <p v-if="schema.description" class="field-help">{{ schema.description }}</p>
    <StudioField
      v-for="(child, key) in schema.properties"
      :key="key"
      :name="key"
      :schema="child"
      :required="schema.required?.includes(key)"
      :model-value="(modelValue as Record<string, unknown> | undefined)?.[key]"
      @update:model-value="updateObject(key, $event)"
    />
  </fieldset>

  <label v-else-if="schema.type === 'boolean'" class="field check-field">
    <input type="checkbox" :checked="Boolean(modelValue)" @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)">
    <span>{{ name }}</span>
    <small v-if="schema.description">{{ schema.description }}</small>
  </label>

  <label v-else class="field">
    <span class="field-name">{{ name }}<b v-if="required" aria-label="required"> *</b></span>
    <small v-if="schema.description" class="field-help">{{ schema.description }}</small>
    <select v-if="choices" :value="modelValue" :required="required" @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value || undefined)">
      <option v-if="!required" value="">Not set</option>
      <option v-for="choice in choices" :key="choice" :value="choice">{{ choice }}</option>
    </select>
    <textarea v-else-if="multiline && schema.type === 'string'" :value="modelValue as string" :required="required" :maxlength="schema.maxGraphemes" rows="9" @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value || undefined)" />
    <input v-else-if="schema.type === 'string'" :type="schema.format === 'datetime' ? 'datetime-local' : schema.format === 'uri' ? 'url' : 'text'" :value="modelValue as string" :required="required" :maxlength="schema.maxGraphemes" @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value || undefined)">
    <input v-else-if="schema.type === 'integer'" type="number" step="1" :value="modelValue as number" :required="required" :min="schema.minimum" :max="schema.maximum" @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value === '' ? undefined : Number(($event.target as HTMLInputElement).value))">
    <template v-else-if="schema.type === 'blob'">
      <input type="file" :accept="schema.accept?.join(',')" :disabled="uploadBusy" @change="upload">
      <small>{{ uploadBusy ? 'Uploading…' : modelValue ? 'Blob uploaded' : `Maximum ${Math.round((schema.maxSize ?? 5000000) / 1000000)} MB` }}</small>
      <button v-if="modelValue" class="inline-action" type="button" @click="$emit('update:modelValue', undefined)">Remove file</button>
    </template>
    <textarea v-else v-model="jsonValue" rows="6" spellcheck="false" placeholder="JSON value" />
    <small v-if="issue || uploadError" class="field-error">{{ issue || uploadError }}</small>
  </label>
</template>