import type { Ref } from 'vue'

interface Reminder {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  dueDate: string | null
  categoryId: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

interface ReminderStats {
  total: number
  pending: number
  completed: number
  snoozed: number
  cancelled: number
  overdue: number
  dueToday: number
  byPriority: Record<string, number>
}

interface Category {
  id: string
  name: string
  color: string
  icon: string | null
  createdAt: string
}

interface ListRemindersResponse {
  reminders: Reminder[]
  total: number
  page: number
  limit: number
}

interface StatsResponse {
  stats: ReminderStats
}

interface CategoriesResponse {
  categories: Category[]
}

interface ReminderQueryParams {
  page: number
  limit: number
  status?: string
  priority?: string
  categoryId?: string
  search?: string
}

export function useReminders(queryParams: Ref<ReminderQueryParams>) {
  return useAsyncData(
    'reminders-list',
    () => $fetch<ListRemindersResponse>('/api/reminders', { query: queryParams.value }),
    { watch: [queryParams] },
  )
}

export function useReminderStats() {
  return useAsyncData('reminders-stats', () => $fetch<StatsResponse>('/api/reminders/stats'))
}

export function useCategories() {
  return useAsyncData('categories-list', () => $fetch<CategoriesResponse>('/api/categories'))
}

export async function useToggleReminder(id: string) {
  await $fetch(`/api/reminders/${id}/toggle`, { method: 'POST' })
}

export async function useCreateReminder(body: {
  title: string
  description?: string
  priority?: string
  dueDate?: string
  categoryId?: string
}) {
  return $fetch('/api/reminders', { method: 'POST', body })
}
