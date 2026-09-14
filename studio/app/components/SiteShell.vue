<template>
  <div class="shell">
    <header class="masthead">
      <div class="masthead-inner">
        <p class="brand">
          <NuxtLink to="/" class="wordmark">
            <span>
              airspace studio
              <svg class="contrail" viewBox="0 0 120 24" aria-hidden="true" preserveAspectRatio="none">
                <path d="M2 20 C 26 12, 54 22, 82 13 S 112 3, 120 1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 5" vector-effect="non-scaling-stroke" />
              </svg>
            </span>
            <svg class="plane" viewBox="0 0 32 32" aria-hidden="true">
              <path d="M6 22 26 8l-6 16-5-5-4 4v-6z" fill="currentColor" />
            </svg>
          </NuxtLink>
        </p>
        <nav>
          <a href="https://getair.space/docs">airspace docs</a>
        </nav>
      </div>
    </header>

    <main class="wide">
      <slot />
    </main>

    <footer class="site-footer">
      <p>content stays in your atproto PDS.</p>
    </footer>
  </div>
</template>
