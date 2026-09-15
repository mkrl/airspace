<script setup lang="ts">
import type { StudioRecord, StudioState } from '#shared/studio'

definePageMeta({ key: route => route.fullPath })

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
const records = await requestFetch<StudioRecord[]>(`/api/studio/${collectionName.value}/records`)
const record = ref<StudioRecord | null>(null)
if (rkey.value !== 'new')
  record.value = await requestFetch<StudioRecord>(`/api/studio/${collectionName.value}/records/${rkey.value}`)
else if (collection.value.singleton) {
  if (records[0])
    await navigateTo(`/${collectionName.value}/${records[0].rkey}`)
}

const titleField = (item: StudioRecord) => ['title', 'name', 'displayName', 'label'].map(key => item.value[key]).find(item => typeof item === 'string') as string | undefined

useSeoMeta({ title: () => `${rkey.value === 'new' ? 'New' : rkey.value} · ${collectionName.value} · airspace studio` })
</script>

<template>
  <StudioFrame v-if="studio?.account && collection" :studio="studio" :selected-name="collectionName">
    <section class="workspace">
      <header class="workspace-header">
        <div><p class="eyebrow">{{ collection.nsid }}</p><h1>{{ collection.name }}</h1><p v-if="collection.description">{{ collection.description }}</p></div>
      </header>
      <div class="content-grid">
        <div class="record-list">
          <NuxtLink v-for="item in records" :key="item.rkey" :to="`/${collectionName}/${item.rkey}`">
            <strong>{{ titleField(item) ?? item.rkey }}</strong><small>{{ item.rkey }}</small>
          </NuxtLink>
          <p v-if="!records.length" class="empty">No records yet.</p>
        </div>
        <StudioRecordEditor :key="rkey" :collection="collection" :record="record" />
      </div>
    </section>
  </StudioFrame>
</template>