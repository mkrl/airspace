<script setup lang="ts">
import type { Component } from 'vue'
import type { StudioField } from '#shared/studio'
import BlobField from './fields/BlobField.vue'
import BooleanField from './fields/BooleanField.vue'
import ChoiceField from './fields/ChoiceField.vue'
import IntegerField from './fields/IntegerField.vue'
import JsonField from './fields/JsonField.vue'
import ListField from './fields/ListField.vue'
import MultilineField from './fields/MultilineField.vue'
import ObjectField from './fields/ObjectField.vue'
import RelationField from './fields/RelationField.vue'
import StringField from './fields/StringField.vue'
import UnionField from './fields/UnionField.vue'

defineOptions({ name: 'StudioField' })

const props = defineProps<{
  name: string
  inputName: string
  schema: StudioField
  modelValue: unknown
  required?: boolean
  issue?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: unknown] }>()

const fieldComponent = computed<Component>(() => {
  if (props.schema.type === 'array' && props.schema.items?.relation)
    return RelationField
  if (props.schema.type === 'array' && props.schema.items)
    return ListField
  if (props.schema.type === 'union' && props.schema.refs)
    return UnionField
  if (props.schema.type === 'object' && props.schema.properties)
    return ObjectField
  if (props.schema.type === 'boolean')
    return BooleanField
  if (props.schema.enum || props.schema.knownValues)
    return ChoiceField
  if (props.schema.relation)
    return RelationField
  if (props.schema.type === 'string' && (props.schema.description === 'Markdown.' || (props.schema.maxGraphemes ?? 0) > 1000))
    return MultilineField
  if (props.schema.type === 'string')
    return StringField
  if (props.schema.type === 'integer')
    return IntegerField
  if (props.schema.type === 'blob')
    return BlobField
  return JsonField
})
</script>

<template>
  <component
    :is="fieldComponent"
    v-bind="props"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>