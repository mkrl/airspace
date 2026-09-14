<script setup lang="ts">
import type { NuxtError } from 'nuxt/app'

const props = defineProps<{ error: NuxtError }>()

const missing = props.error.statusCode === 404
const title = computed(() => `${props.error.statusCode || 500} · Airspace Studio`)

useSeoMeta({
  title,
  description: missing ? 'That page does not exist in Airspace Studio.' : 'Something went wrong.',
  robots: 'noindex',
})
</script>

<template>
  <SiteShell>
    <div class="error">
    <p class="rubric">
      {{ error.statusCode || 500 }}
    </p>
    <h1>{{ missing ? 'that page does not exist.' : 'something went wrong.' }}</h1>

    <p v-if="missing" class="lede">
      Nothing is served at <code>{{ useRequestURL().pathname }}</code>.
    </p>
    <p v-else class="lede">
      Try again, or open an issue if it keeps happening.
    </p>

    <p class="cta">
      <NuxtLink to="/" class="button">
        Back to studio
      </NuxtLink>
    </p>
    </div>
  </SiteShell>
</template>

<style scoped>
.error {
  max-width: var(--measure);
  margin-block: var(--space-2xl);
}

.rubric {
  margin: 0 0 var(--space-2xs);
  color: var(--color-ink-2);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

h1 {
  font-size: var(--text-3xl);
  margin: 0 0 var(--space-sm);
}

.lede {
  color: var(--color-ink-2);
  margin: 0 0 var(--space-lg);
}

.cta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
  margin: 0 0 var(--space-xl);
}

</style>
