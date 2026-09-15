<script setup lang="ts">
import type { StudioState } from '#shared/studio'

const { data: studio, refresh: refreshStudio } = await useFetch<StudioState>('/api/studio')
const busy = ref(false)
const message = ref('')

if (studio.value?.account && studio.value.collections[0])
  await navigateTo(`/${studio.value.collections[0].name}`)

function errorMessage(error: unknown) {
  return (error as { data?: { message?: string } }).data?.message ?? (error as Error).message ?? 'something went wrong'
}

async function signIn(event: Event) {
  busy.value = true
  message.value = ''
  const form = new FormData(event.target as HTMLFormElement)
  try {
    await $fetch('/api/studio/session', {
      method: 'POST',
      body: { service: form.get('service'), identifier: form.get('identifier'), password: form.get('password') },
    })
    await refreshStudio()
    if (studio.value?.collections[0])
      await navigateTo(`/${studio.value.collections[0].name}`)
  }
  catch (error) {
    message.value = errorMessage(error)
  }
  finally {
    busy.value = false
  }
}

useSeoMeta({ title: 'airspace studio', description: 'Edit typed content in your Atproto PDS.' })
</script>

<template>
  <section v-if="studio && !studio.configured" class="setup">
    <span class="setup-mark" aria-hidden="true">{ }</span>
    <h1>Add your content model</h1>
    <p>Studio looks for <code>studio/lexicons.ts</code>. Export the same airspace lexicons your application uses, then restart the development server.</p>
    <pre><code>import { defineLexicons, field } from 'airspace/lexicon'

export default defineLexicons('dev.example', {
  note: {
    title: field.text({ max: 120 }),
    body: field.markdown(),
    published: field.boolean().optional(),
  },
})</code></pre>
    <p class="setup-note">Already have a model elsewhere? Re-export it: <code>export { default } from '../src/lexicons.ts'</code></p>
  </section>

  <section v-else-if="studio && !studio.account" class="signin">
    <div>
      <h1>Your lexicon, with an editing desk.</h1>
      <p>Sign in with an app password to manage records in your PDS.</p>
    </div>
    <form @submit.prevent="signIn">
      <label>Service <input name="service" type="url" value="https://bsky.social" required></label>
      <label>Handle or email <input name="identifier" autocomplete="username" required></label>
      <label>App password <input name="password" type="password" autocomplete="current-password" required></label>
      <button class="primary-action" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
      <p v-if="message" class="form-message error" role="alert">{{ message }}</p>
    </form>
  </section>
</template>