<script setup lang="ts">
import type { StudioRecord, StudioState } from '#shared/studio'

definePageMeta({ key: route => route.path })

const route = useRoute()
const collectionName = computed(() => String(route.params.collection))
const rkey = computed(() => String(route.params.rkey))
const { data: studio } = await useFetch<StudioState>('/api/studio')

if (!studio.value?.account)
  await navigateTo('/')

const collection = computed(() => studio.value?.collections.find(item => item.name === collectionName.value))
if (!collection.value)
  throw createError({ statusCode: 404, statusMessage: `Unknown collection: ${collectionName.value}` })

const requestFetch = useRequestFetch()
const record = ref<StudioRecord | null>(null)
if (rkey.value !== 'new') {
  try {
    record.value = await requestFetch<StudioRecord>(`/api/studio/${collectionName.value}/records/${rkey.value}`)
  }
  catch (error) {
    const response = error as { status?: number, statusCode?: number, response?: { status?: number } }
    if ((response.statusCode ?? response.status ?? response.response?.status) === 404)
      throw createError({ statusCode: 404, statusMessage: `Record not found: ${collectionName.value}/${rkey.value}` })
    throw error
  }
}
if (rkey.value === 'new' && collection.value.singleton) {
  const page = await requestFetch<{ records: StudioRecord[] }>(`/api/studio/${collectionName.value}/records?page=true&limit=1`)
  if (page.records[0])
    await navigateTo(`/${collectionName.value}/${page.records[0].rkey}`)
}

useSeoMeta({ title: () => `${rkey.value === 'new' ? 'New' : rkey.value} · ${collectionName.value} · airspace studio` })
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
        <StudioRecordList :collection="collection" :selected-rkey="rkey" />
        <StudioRecordEditor :key="rkey" :collection="collection" :record="record" />
      </div>
    </section>
  </StudioFrame>
</template>
