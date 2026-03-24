<script setup lang="ts">
const config = useRuntimeConfig()
const appName = config.public.appName || 'Reminders'

useSeo({
  title: `My Reminders — ${appName}`,
  description: `Manage your reminders, categories, and stay on top of what matters.`,
})
useWebPageSchema({
  name: `My Reminders — ${appName}`,
  description: `Manage your reminders, categories, and stay on top of what matters.`,
})

const selectedStatus = ref<string | undefined>()
const selectedPriority = ref<string | undefined>()
const searchQuery = ref('')
const currentPage = ref(1)

const queryParams = computed(() => ({
  page: currentPage.value,
  limit: 20,
  ...(selectedStatus.value && { status: selectedStatus.value }),
  ...(selectedPriority.value && { priority: selectedPriority.value }),
  ...(searchQuery.value && { search: searchQuery.value }),
}))

const { data: remindersData, refresh: refreshReminders } = useReminders(queryParams)
const { data: statsData, refresh: refreshStats } = useReminderStats()

const statusOptions = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
  { label: 'Snoozed', value: 'snoozed' },
  { label: 'Cancelled', value: 'cancelled' },
]

const priorityOptions = [
  { label: 'All', value: undefined },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
]

const priorityColors: Record<string, string> = {
  low: 'text-neutral-400',
  medium: 'text-primary',
  high: 'text-warning',
  urgent: 'text-error',
}

const statusIcons: Record<string, string> = {
  pending: 'i-lucide-clock',
  completed: 'i-lucide-check-circle',
  snoozed: 'i-lucide-moon',
  cancelled: 'i-lucide-x-circle',
}

async function handleToggle(id: string) {
  await useToggleReminder(id)
  await Promise.all([refreshReminders(), refreshStats()])
}

function setFilter(status?: string, priority?: string) {
  selectedStatus.value = status
  selectedPriority.value = priority
  currentPage.value = 1
}
</script>

<template>
  <UPage>
    <UPageHeader
      title="My Reminders"
      description="Stay organized and never miss a thing."
      :ui="{ title: 'text-3xl sm:text-4xl' }"
    >
      <template #links>
        <UButton to="/reminders/new" icon="i-lucide-plus" label="New Reminder" color="primary" />
      </template>
    </UPageHeader>

    <!-- Stats Cards -->
    <UPageGrid v-if="statsData?.stats">
      <UPageCard
        icon="i-lucide-list-todo"
        title="Pending"
        :description="String(statsData.stats.pending)"
        class="cursor-pointer"
        @click="setFilter('pending')"
      />
      <UPageCard
        icon="i-lucide-check-circle"
        title="Completed"
        :description="String(statsData.stats.completed)"
        class="cursor-pointer"
        @click="setFilter('completed')"
      />
      <UPageCard
        icon="i-lucide-alert-triangle"
        title="Overdue"
        :description="String(statsData.stats.overdue)"
        class="cursor-pointer"
        @click="setFilter('pending')"
      />
      <UPageCard
        icon="i-lucide-calendar"
        title="Due Today"
        :description="String(statsData.stats.dueToday)"
        class="cursor-pointer"
        @click="setFilter('pending')"
      />
    </UPageGrid>

    <!-- Filters -->
    <UPageSection :ui="{ wrapper: 'py-4' }">
      <div class="flex flex-wrap items-center gap-3">
        <UInput
          v-model="searchQuery"
          placeholder="Search reminders..."
          icon="i-lucide-search"
          class="w-full sm:w-64"
        />
        <USelectMenu
          v-model="selectedStatus"
          :items="statusOptions"
          placeholder="Status"
          value-key="value"
          class="w-40"
        />
        <USelectMenu
          v-model="selectedPriority"
          :items="priorityOptions"
          placeholder="Priority"
          value-key="value"
          class="w-40"
        />
      </div>
    </UPageSection>

    <!-- Reminders List -->
    <UPageSection :ui="{ wrapper: 'py-4' }">
      <div v-if="!remindersData?.reminders?.length" class="text-center py-12">
        <UIcon name="i-lucide-inbox" class="text-4xl text-muted mb-4" />
        <p class="text-lg text-muted">No reminders found.</p>
        <UButton
          to="/reminders/new"
          label="Create your first reminder"
          variant="soft"
          class="mt-4"
        />
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="reminder in remindersData.reminders"
          :key="reminder.id"
          class="flex items-center gap-3 p-4 rounded-lg border border-default hover:bg-elevated transition-colors"
        >
          <UButton
            :icon="reminder.status === 'completed' ? 'i-lucide-check-circle' : 'i-lucide-circle'"
            variant="ghost"
            :color="reminder.status === 'completed' ? 'success' : 'neutral'"
            size="sm"
            @click="handleToggle(reminder.id)"
          />

          <div class="flex-1 min-w-0">
            <NuxtLink
              :to="`/reminders/${reminder.id}`"
              class="font-medium truncate block"
              :class="{ 'line-through text-muted': reminder.status === 'completed' }"
            >
              {{ reminder.title }}
            </NuxtLink>
            <div class="flex items-center gap-2 mt-1 text-sm text-muted">
              <UIcon :name="statusIcons[reminder.status] || 'i-lucide-clock'" class="text-xs" />
              <span class="capitalize">{{ reminder.status }}</span>
              <span :class="priorityColors[reminder.priority]" class="capitalize">
                {{ reminder.priority }}
              </span>
              <span v-if="reminder.dueDate">
                · {{ new Date(reminder.dueDate).toLocaleDateString() }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="remindersData && remindersData.total > remindersData.limit"
        class="flex justify-center mt-6"
      >
        <UPagination
          v-model="currentPage"
          :total="remindersData.total"
          :items-per-page="remindersData.limit"
        />
      </div>
    </UPageSection>
  </UPage>
</template>
