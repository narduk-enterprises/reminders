<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const config = useRuntimeConfig()
const appName = config.public.appName || 'Reminders'

useSeo({
  title: `${appName} — Never Forget What Matters`,
  description:
    'Reminders is a free online reminder app that helps you create, manage, and track tasks with smart due dates, priority levels, and categories. The simple reminder manager for busy people.',
  keywords: [
    'online reminder app',
    'free task reminders',
    'simple reminder manager',
    'task management',
    'due date tracker',
  ],
  ogImage: {
    title: 'Never Forget What Matters',
    description: 'Smart reminders with due dates, priorities, and categories.',
    icon: 'i-lucide-bell-ring',
  },
})
useWebPageSchema({
  name: `${appName} — Never Forget What Matters`,
  description:
    'Reminders is a free online reminder app that helps you create, manage, and track tasks with smart due dates, priority levels, and categories.',
})

const features = [
  {
    icon: 'i-lucide-calendar-clock',
    title: 'Smart Due Dates',
    description:
      "Set precise due dates and never miss a deadline. See what's due today, upcoming, and overdue at a glance.",
  },
  {
    icon: 'i-lucide-signal',
    title: 'Priority Levels',
    description:
      'Organize by low, medium, or high priority so you always focus on what matters most.',
  },
  {
    icon: 'i-lucide-tags',
    title: 'Categories',
    description:
      'Group reminders by category — work, personal, shopping, health — to keep everything sorted.',
  },
  {
    icon: 'i-lucide-zap',
    title: 'Lightning Fast',
    description: 'Deployed on the edge with Cloudflare Workers for sub-50ms responses worldwide.',
  },
]
</script>

<template>
  <UPage>
    <UPageHero
      title="Never Forget What Matters"
      description="The simple, free online reminder app that helps you stay on top of tasks, deadlines, and everything in between."
      :ui="{ title: 'text-5xl sm:text-6xl', description: 'text-xl text-muted max-w-2xl' }"
    >
      <template #links>
        <UButton to="/login" label="Get Started" icon="i-lucide-arrow-right" size="xl" trailing />
        <UButton
          to="/register"
          label="Create Account"
          color="neutral"
          variant="outline"
          size="xl"
          icon="i-lucide-user-plus"
        />
      </template>
    </UPageHero>

    <UPageSection
      title="Everything You Need to Stay Organized"
      description="Powerful features wrapped in a clean, distraction-free interface."
    >
      <UPageGrid>
        <UPageCard
          v-for="feature in features"
          :key="feature.title"
          :icon="feature.icon"
          :title="feature.title"
          :description="feature.description"
        />
      </UPageGrid>
    </UPageSection>

    <UPageCTA
      title="Ready to Take Control of Your Day?"
      description="Sign up in seconds. No credit card required. Start organizing your life with smart reminders."
    >
      <template #links>
        <UButton
          to="/register"
          label="Create Free Account"
          icon="i-lucide-check-circle"
          size="xl"
        />
        <UButton to="/login" label="Sign In" color="neutral" variant="ghost" size="xl" />
      </template>
    </UPageCTA>
  </UPage>
</template>
