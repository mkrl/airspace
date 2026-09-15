<script setup lang="ts">
import type { StudioMigrationStatus } from '#shared/studio'

const props = defineProps<{ collectionName: string }>()
const { data: migration } = await useFetch<StudioMigrationStatus>(() => `/api/studio/${props.collectionName}/migration`)
</script>

<template>
  <aside v-if="migration?.needed" class="migration-notice">
    <div>
      <strong>Schema migration needed</strong>
      <p>{{ Object.keys(migration.report.failed).length }} invalid, {{ migration.report.changed }} ready to update.</p>
    </div>
    <NuxtLink class="button" :to="`/${collectionName}/migrate`">Review migration</NuxtLink>
  </aside>
</template>