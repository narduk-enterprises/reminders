<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

useSeo({
  title: 'Dashboard — Reminders',
  description:
    'View and manage all your reminders. Create tasks, set due dates, and track your progress.',
  ogImage: {
    title: 'Your Reminder Dashboard',
    description: 'Manage all your reminders in one place.',
    icon: 'i-lucide-layout-dashboard',
  },
})
useWebPageSchema({
  name: 'Dashboard — Reminders',
  description:
    'View and manage all your reminders. Create tasks, set due dates, and track your progress.',
})

const { reminders, pending, createReminder, updateReminder, deleteReminder } = useReminders()

const showCreateModal = ref(false)
const activeFilter = ref<'all' | 'today' | 'upcoming' | 'completed'>('all')

const formState = ref({
  title: '',
  description: '',
  dueAt: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
  category: '',
})

function resetForm() {
  formState.value = {
    title: '',
    description: '',
    dueAt: '',
    priority: 'medium',
    category: '',
  }
}

const filterTabs = [
  { label: 'All', value: 'all' as const, icon: 'i-lucide-list' },
  { label: 'Today', value: 'today' as const, icon: 'i-lucide-calendar' },
  { label: 'Upcoming', value: 'upcoming' as const, icon: 'i-lucide-calendar-clock' },
  { label: 'Completed', value: 'completed' as const, icon: 'i-lucide-check-circle' },
]

function isToday(dateStr: string | null) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function isUpcoming(dateStr: string | null) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return d > now
}

const filteredReminders = computed(() => {
  const list = reminders.value ?? []
  switch (activeFilter.value) {
    case 'today':
      return list.filter((r) => !r.isCompleted && isToday(r.dueAt))
    case 'upcoming':
      return list.filter((r) => !r.isCompleted && isUpcoming(r.dueAt))
    case 'completed':
      return list.filter((r) => r.isCompleted)
    default:
      return list
  }
})

const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
]

function priorityColor(priority: string) {
  switch (priority) {
    case 'high':
      return 'error' as const
    case 'medium':
      return 'warning' as const
    case 'low':
      return 'success' as const
    default:
      return 'neutral' as const
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

async function handleCreate() {
  const data = {
    title: formState.value.title,
    description: formState.value.description || undefined,
    dueAt: formState.value.dueAt ? new Date(formState.value.dueAt).toISOString() : undefined,
    priority: formState.value.priority,
    category: formState.value.category || undefined,
  }
  await createReminder(data)
  showCreateModal.value = false
  resetForm()
}

async function toggleComplete(id: number, current: boolean) {
  await updateReminder(id, { isCompleted: !current })
}

async function handleDelete(id: number) {
  await deleteReminder(id)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-default">My Reminders</h1>
        <p class="text-muted mt-1">Stay on top of everything that matters.</p>
      </div>
      <UButton icon="i-lucide-plus" label="Add Reminder" @click="showCreateModal = true" />
    </div>

    <div class="mb-6">
      <UTabs v-model="activeFilter" :items="filterTabs" />
    </div>

    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-muted" />
    </div>

    <div v-else-if="filteredReminders.length === 0">
      <AppEmptyState
        icon="i-lucide-bell-off"
        title="No reminders here"
        :description="
          activeFilter === 'all'
            ? 'Create your first reminder to get started.'
            : `No ${activeFilter} reminders found.`
        "
      >
        <UButton
          v-if="activeFilter === 'all'"
          icon="i-lucide-plus"
          label="Add Reminder"
          @click="showCreateModal = true"
        />
      </AppEmptyState>
    </div>

    <div v-else class="space-y-3">
      <UCard v-for="reminder in filteredReminders" :key="reminder.id">
        <div class="flex items-start gap-3">
          <UCheckbox
            :model-value="reminder.isCompleted"
            class="mt-1"
            @update:model-value="toggleComplete(reminder.id, reminder.isCompleted)"
          />
          <div class="flex-1 min-w-0">
            <NuxtLink :to="`/reminders/${reminder.id}`" class="block">
              <h3
                class="font-semibold text-default"
                :class="{ 'line-through text-muted': reminder.isCompleted }"
              >
                {{ reminder.title }}
              </h3>
            </NuxtLink>
            <p v-if="reminder.description" class="text-sm text-muted mt-0.5 truncate">
              {{ reminder.description }}
            </p>
            <div class="flex items-center gap-2 mt-2 flex-wrap">
              <UBadge
                v-if="reminder.dueAt"
                color="neutral"
                variant="subtle"
                size="sm"
                :label="formatDate(reminder.dueAt)"
                icon="i-lucide-calendar"
              />
              <UBadge
                :color="priorityColor(reminder.priority)"
                variant="subtle"
                size="sm"
                :label="reminder.priority"
              />
              <UBadge
                v-if="reminder.category"
                color="neutral"
                variant="outline"
                size="sm"
                :label="reminder.category"
                icon="i-lucide-tag"
              />
            </div>
          </div>
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            @click="handleDelete(reminder.id)"
          />
        </div>
      </UCard>
    </div>

    <UModal v-model:open="showCreateModal">
      <template #header>
        <h2 class="text-lg font-semibold text-default">New Reminder</h2>
      </template>

      <template #body>
        <UForm :state="formState" class="space-y-4" @submit="handleCreate">
          <UFormField label="Title" name="title" required>
            <UInput
              v-model="formState.title"
              placeholder="What do you need to remember?"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Description" name="description">
            <UTextarea
              v-model="formState.description"
              placeholder="Add more details (optional)"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Due Date" name="dueAt">
            <UInput v-model="formState.dueAt" type="datetime-local" class="w-full" />
          </UFormField>

          <UFormField label="Priority" name="priority">
            <USelect v-model="formState.priority" :items="priorityOptions" class="w-full" />
          </UFormField>

          <UFormField label="Category" name="category">
            <UInput
              v-model="formState.category"
              placeholder="e.g. Work, Personal, Shopping"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              @click="showCreateModal = false"
            />
            <UButton
              type="submit"
              label="Create Reminder"
              icon="i-lucide-plus"
              :disabled="!formState.title"
            />
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
