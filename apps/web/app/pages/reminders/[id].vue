<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const id = Number(route.params.id)
const csrfFetch = useCsrfFetch()

useSeo({
  title: 'Edit Reminder — Reminders',
  description: 'View and edit your reminder details.',
  ogImage: {
    title: 'Edit Reminder',
    description: 'Update your reminder details.',
    icon: 'i-lucide-edit',
  },
})
useWebPageSchema({
  name: 'Edit Reminder — Reminders',
  description: 'View and edit your reminder details.',
})

const { data: reminders } = useFetch<
  Array<{
    id: number
    userId: string
    title: string
    description: string | null
    dueAt: string | null
    priority: 'low' | 'medium' | 'high'
    category: string | null
    isCompleted: boolean
    createdAt: string
    updatedAt: string
  }>
>('/api/reminders')

const reminder = computed(() => (reminders.value ?? []).find((r) => r.id === id))

const formState = ref({
  title: '',
  description: '',
  dueAt: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
  category: '',
  isCompleted: false,
})

watch(
  reminder,
  (r) => {
    if (r) {
      formState.value = {
        title: r.title,
        description: r.description ?? '',
        dueAt: r.dueAt ? r.dueAt.slice(0, 16) : '',
        priority: r.priority,
        category: r.category ?? '',
        isCompleted: r.isCompleted,
      }
    }
  },
  { immediate: true },
)

const showDeleteModal = ref(false)
const saving = ref(false)

const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
]

const breadcrumbItems = computed(() => [
  { label: 'Dashboard', to: '/dashboard', icon: 'i-lucide-layout-dashboard' },
  { label: reminder.value?.title ?? 'Reminder' },
])

async function handleSave() {
  saving.value = true
  try {
    const data: Record<string, unknown> = {
      title: formState.value.title,
      priority: formState.value.priority,
      isCompleted: formState.value.isCompleted,
    }
    if (formState.value.description) data.description = formState.value.description
    if (formState.value.dueAt) data.dueAt = new Date(formState.value.dueAt).toISOString()
    if (formState.value.category) data.category = formState.value.category

    await csrfFetch(`/api/reminders/${id}`, {
      method: 'PATCH',
      body: data,
    })
    await navigateTo('/dashboard')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  await csrfFetch(`/api/reminders/${id}`, { method: 'DELETE' })
  showDeleteModal.value = false
  await navigateTo('/dashboard')
}
</script>

<template>
  <div>
    <UBreadcrumb :items="breadcrumbItems" class="mb-6" />

    <div v-if="!reminder" class="py-12">
      <AppEmptyState
        icon="i-lucide-search-x"
        title="Reminder not found"
        description="This reminder may have been deleted."
      >
        <UButton to="/dashboard" label="Back to Dashboard" icon="i-lucide-arrow-left" />
      </AppEmptyState>
    </div>

    <template v-else>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-default">Edit Reminder</h1>
        <UButton
          icon="i-lucide-trash-2"
          label="Delete"
          color="error"
          variant="outline"
          @click="showDeleteModal = true"
        />
      </div>

      <UCard>
        <UForm :state="formState" class="space-y-4" @submit="handleSave">
          <UFormField label="Title" name="title" required>
            <UInput v-model="formState.title" placeholder="Reminder title" class="w-full" />
          </UFormField>

          <UFormField label="Description" name="description">
            <UTextarea
              v-model="formState.description"
              placeholder="Add more details"
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
            <UInput v-model="formState.category" placeholder="e.g. Work, Personal" class="w-full" />
          </UFormField>

          <UFormField label="Completed" name="isCompleted">
            <UCheckbox v-model="formState.isCompleted" label="Mark as completed" />
          </UFormField>

          <div class="flex justify-end gap-2 pt-4">
            <UButton to="/dashboard" label="Cancel" color="neutral" variant="ghost" />
            <UButton type="submit" label="Save Changes" icon="i-lucide-save" :loading="saving" />
          </div>
        </UForm>
      </UCard>
    </template>

    <UModal v-model:open="showDeleteModal">
      <template #header>
        <h2 class="text-lg font-semibold text-default">Delete Reminder</h2>
      </template>
      <template #body>
        <p class="text-muted">
          Are you sure you want to delete &ldquo;{{ reminder?.title }}&rdquo;? This action cannot be
          undone.
        </p>
        <div class="flex justify-end gap-2 mt-6">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            @click="showDeleteModal = false"
          />
          <UButton label="Delete" color="error" icon="i-lucide-trash-2" @click="handleDelete" />
        </div>
      </template>
    </UModal>
  </div>
</template>
