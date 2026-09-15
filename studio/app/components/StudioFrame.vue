<script setup lang="ts">
import type { StudioState } from '#shared/studio'

defineProps<{ studio: StudioState, selectedName?: string }>()

async function signOut() {
  await $fetch('/api/studio/session', { method: 'DELETE' })
  await navigateTo('/')
}
</script>

<template>
  <div class="studio-layout">
    <aside class="studio-sidebar">
      <div class="account">
        <span class="account-mark">{{ studio.account!.handle.slice(0, 1) }}</span>
        <span><strong>{{ studio.account!.handle }}</strong><small>{{ studio.account!.service }}</small></span>
      </div>
      <nav aria-label="Collections">
        <NuxtLink v-for="collection in studio.collections" :key="collection.name" :to="`/${collection.name}`" :class="{ active: selectedName === collection.name }">
          <span>{{ collection.name }}</span><small>{{ collection.nsid }}</small>
        </NuxtLink>
      </nav>
      <button class="signout" @click="signOut">Sign out</button>
    </aside>
    <slot />
  </div>
</template>