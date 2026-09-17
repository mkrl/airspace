<script setup lang="ts">
import type { StudioState } from '#shared/studio'

definePageMeta({ key: route => route.path })

const route = useRoute()
const collectionName = computed(() => String(route.params.collection))
const { data: studio } = await useFetch<StudioState>('/api/studio')

if (!studio.value?.account)
  await navigateTo('/')

const collection = computed(() => studio.value?.collections.find(item => item.name === collectionName.value))
if (!collection.value)
  throw createError({ statusCode: 404, statusMessage: `Unknown collection: ${collectionName.value}` })

useSeoMeta({ title: () => `${collectionName.value} · airspace studio` })
</script>

<template>
  <StudioFrame v-if="studio?.account && collection" :studio="studio" :selected-name="collectionName">
    <section class="workspace">
      <header class="workspace-header">
        <div><p class="eyebrow">{{ collection.nsid }}</p><h1>{{ collection.name }}</h1><p v-if="collection.description">{{ collection.description }}</p></div>
        <StudioCreateRecordButton :collection-name="collectionName" />
      </header>
      <StudioMigrationNotice :collection-name="collectionName" />
      <div class="content-grid">
        <StudioRecordList :collection="collection" />
        <StudioRecordEditor :collection="collection" :record="null" />
      </div>
    </section>
  </StudioFrame>
</template>
