<script setup lang="ts">
import type { StudioMigrationReport, StudioMigrationStatus, StudioState } from '#shared/studio'

definePageMeta({ key: route => route.fullPath })

const route = useRoute()
const collectionName = computed(() => String((route.params as { collection: string }).collection))
const { data: studio } = await useFetch<StudioState>('/api/studio')

if (!studio.value?.account)
  await navigateTo('/')

const collection = computed(() => studio.value?.collections.find(item => item.name === collectionName.value))
if (!collection.value)
  throw createError({ statusCode: 404, statusMessage: `Unknown collection: ${collectionName.value}` })

const { data: migration } = await useFetch<StudioMigrationStatus>(() => `/api/studio/${collectionName.value}/migration`)
const values = ref<Record<string, Record<string, unknown>>>(Object.fromEntries(
  (migration.value?.records ?? []).map(record => [record.rkey, JSON.parse(JSON.stringify(record.value))]),
))
const report = ref<StudioMigrationReport | null>(migration.value?.report ?? null)
const busy = ref(false)
const message = ref('')

function updateField(rkey: string, name: string, next: unknown) {
  const value = values.value[rkey]!
  if (next === undefined || next === '')
    delete value[name]
  else
    value[name] = next
}

async function runMigration() {
  busy.value = true
  message.value = ''
  try {
    const result = await $fetch<StudioMigrationReport>(`/api/studio/${collectionName.value}/migration`, {
      method: 'POST',
      body: { values: values.value },
    })
    message.value = `Migration complete. ${result.changed} records updated.`
    await navigateTo(`/${collectionName.value}`)
  }
  catch (error) {
    const detail = error as { data?: { message?: string, data?: StudioMigrationReport } }
    if (detail.data?.data)
      report.value = detail.data.data
    message.value = detail.data?.message ?? 'Could not run the migration.'
  }
  finally {
    busy.value = false
  }
}

useSeoMeta({ title: () => `Migrate ${collectionName.value} · airspace studio` })
</script>

<template>
  <StudioFrame v-if="studio?.account && collection && migration" :studio="studio" :selected-name="collectionName">
    <section class="workspace migration-workspace">
      <header class="workspace-header">
        <div><p class="eyebrow">{{ collection.nsid }}</p><h1>Migrate {{ collection.name }}</h1><p>Review schema mismatches before rewriting records in your PDS.</p></div>
        <NuxtLink class="button" :to="`/${collectionName}`">Cancel</NuxtLink>
      </header>

      <div v-if="!migration.needed" class="migration-complete">
        <h2>No migration needed</h2>
        <p>All {{ migration.report.scanned }} records match the current schema.</p>
      </div>

      <template v-else>
        <div class="migration-summary">
          <span><strong>{{ migration.report.scanned }}</strong> scanned</span>
          <span><strong>{{ migration.report.changed }}</strong> automatic updates</span>
          <span><strong>{{ Object.keys(migration.report.failed).length }}</strong> need attention</span>
        </div>

        <section v-for="record in migration.records" :key="record.rkey" class="migration-record">
          <header>
            <div><h2>{{ record.rkey }}</h2><code>{{ record.uri }}</code></div>
            <p v-if="record.removedFields?.length" class="removed-fields">Removed fields: <code>{{ record.removedFields.join(', ') }}</code></p>
          </header>
          <StudioField
            v-for="(field, name) in collection.fields"
            :key="name"
            :name="name"
            :input-name="`${collection.name}.${record.rkey}.${name}`"
            :schema="field"
            :required="collection.required.includes(name)"
            :model-value="values[record.rkey]?.[name]"
            :issue="report?.failed[record.rkey]?.find(issue => issue.path.replace(/^\.?/, '').split('.')[0] === name)?.message"
            @update:model-value="updateField(record.rkey, name, $event)"
          />
        </section>

        <footer class="migration-actions">
          <button class="primary-action" :disabled="busy" @click="runMigration">{{ busy ? 'Migrating…' : 'Run migration' }}</button>
          <p v-if="message" class="form-message error" role="status">{{ message }}</p>
        </footer>
      </template>
    </section>
  </StudioFrame>
</template>