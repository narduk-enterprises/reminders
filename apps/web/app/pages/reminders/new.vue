<script setup lang="ts">
const config = useRuntimeConfig()
const appName = config.public.appName || 'Reminders'
const router = useRouter()

useSeo({
  title: `New Reminder — ${appName}`,
  description: 'Create a new reminder to stay on track.',
})
useWebPageSchema({
  name: `New Reminder — ${appName}`,
  description: 'Create a new reminder to stay on track.',
})

const title = ref('')
const description = ref('')
const priority = ref('medium')
const dueDate = ref('')
const selectedCategoryId = ref<string | undefined>()
const isSubmitting = ref(false)
const errorMessage = ref('')

const { data: categoriesData } = useCategories()

const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
]

async function handleSubmit() {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    await useCreateReminder({
      title: title.value,
      description: description.value || undefined,
      priority: priority.value,
      dueDate: dueDate.value ? new Date(dueDate.value).toISOString() : undefined,
      categoryId: selectedCategoryId.value || undefined,
    })
    await router.push('/reminders')
  } catch (err: unknown) {
    const error = err as { data?: { message?: string } }
    errorMessage.value = error?.data?.message || 'Failed to create reminder.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UPage>
    <UPageHeader
      title="New Reminder"
      description="Fill in the details below to create a new reminder."
      :ui="{ title: 'text-3xl sm:text-4xl' }"
    >
      <template #links>
        <UButton to="/reminders" icon="i-lucide-arrow-left" label="Back" variant="ghost" />
      </template>
    </UPageHeader>

    <UPageSection :ui="{ wrapper: 'py-8 max-w-2xl mx-auto' }">
      <UForm class="space-y-6" @submit="handleSubmit">
        <UFormField label="Title" required>
          <UInput
            v-model="title"
            placeholder="What do you need to remember?"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField label="Description">
          <UTextarea
            v-model="description"
            placeholder="Add more details (optional)"
            class="w-full"
            :rows="3"
          />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Priority">
            <USelectMenu
              v-model="priority"
              :items="priorityOptions"
              value-key="value"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Due Date">
            <UInput v-model="dueDate" type="datetime-local" class="w-full" />
          </UFormField>
        </div>

        <UFormField v-if="categoriesData?.categories?.length" label="Category">
          <USelectMenu
            v-model="selectedCategoryId"
            :items="categoriesData.categories.map((c) => ({ label: c.name, value: c.id }))"
            placeholder="Select a category"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <div v-if="errorMessage" class="text-error text-sm">
          {{ errorMessage }}
        </div>

        <div class="flex gap-3">
          <UButton
            type="submit"
            label="Create Reminder"
            icon="i-lucide-plus"
            color="primary"
            :loading="isSubmitting"
          />
          <UButton to="/reminders" label="Cancel" variant="ghost" />
        </div>
      </UForm>
    </UPageSection>
  </UPage>
</template>
