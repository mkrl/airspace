<script setup lang="ts">
const props = defineProps<{
  collectionName: string
}>()

const route = useRoute()

async function createRecord() {
  const collectionPath = `/${props.collectionName}`
  if (route.path !== collectionPath) {
    await navigateTo(collectionPath)
    return
  }

  await nextTick()
  const field = document.querySelector<HTMLElement>('.record-editor input:not([type="hidden"]):not(:disabled), .record-editor textarea:not(:disabled), .record-editor select:not(:disabled)')
  field?.focus()
}
</script>

<template>
  <button class="create-record-action" type="button" aria-label="Create a new record" title="Create a new record" @click="createRecord">
    <span aria-hidden="true">+</span>
  </button>
</template>
