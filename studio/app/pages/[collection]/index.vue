<script setup lang="ts">
import type { StudioRecord, StudioState } from '#shared/studio'

definePageMeta({ key: route => route.fullPath })

const route = useRoute()
const collectionName = computed(() => String(route.params.collection))
const { data: studio } = await useFetch<StudioState>('/api/studio')

if (!studio.value?.account)
  await navigateTo('/')

const collection = computed(() => studio.value?.collections.find(item => item.name === collectionName.value))
if (!collection.value)
  throw createError({ statusCode: 404, statusMessage: `Unknown collection: ${collectionName.value}` })

const { data: records } = await useFetch<StudioRecord[]>(() => `/api/studio/${collectionName.value}/records`, { default: () => [] })
const titleField = (record: StudioRecord) => ['title', 'name', 'displayName', 'label'].map(key => record.value[key]).find(item => typeof item === 'string') as string | undefined

useSeoMeta({ title: () => `${collectionName.value} · airspace studio` })
</script>

<template>
  <StudioFrame v-if="studio?.account && collection" :studio="studio" :selected-name="collectionName">
    <section class="workspace">
      <header class="workspace-header">
        <div><p class="eyebrow">{{ collection.nsid }}</p><h1>{{ collection.name }}</h1><p v-if="collection.description">{{ collection.description }}</p></div>
      </header>
      <div class="content-grid">
        <div class="record-list">
          <NuxtLink v-for="record in records" :key="record.rkey" :to="`/${collectionName}/${record.rkey}`">
            <strong>{{ titleField(record) ?? record.rkey }}</strong><small>{{ record.rkey }}</small>
          </NuxtLink>
          <p v-if="!records.length" class="empty">No records yet.</p>
        </div>
        <StudioRecordEditor :collection="collection" :record="null" />
      </div>
    </section>
  </StudioFrame>
</template>