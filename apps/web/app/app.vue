<script setup lang="ts">
const route = useRoute()
const { loggedIn } = useUserSession()

const appName = useRuntimeConfig().public.appName || 'Reminders'

const loggedOutLinks = [
  { label: 'Features', to: '/#features', icon: 'i-lucide-sparkles' },
  { label: 'Sign In', to: '/login', icon: 'i-lucide-log-in' },
  { label: 'Sign Up', to: '/register', icon: 'i-lucide-user-plus' },
]

const loggedInLinks = [{ label: 'Dashboard', to: '/dashboard', icon: 'i-lucide-layout-dashboard' }]

const navLinks = computed(() => (loggedIn.value ? loggedInLinks : loggedOutLinks))
</script>

<template>
  <LayerAppShell>
    <template #header>
      <LayerAppHeader :app-name="appName" logo-text="✓" :nav-links="navLinks">
        <template #actions>
          <AppUserMenu v-if="loggedIn" />
        </template>
      </LayerAppHeader>
    </template>

    <div
      :class="[
        'flex-1',
        route.meta.layout === 'landing' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full',
      ]"
    >
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>

    <template #footer>
      <LayerAppFooter :app-name="appName" />
    </template>
  </LayerAppShell>
</template>
