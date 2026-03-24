import type { Ref } from 'vue'

interface Reminder {
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
}

interface CreateReminderData {
  title: string
  description?: string
  dueAt?: string
  priority?: 'low' | 'medium' | 'high'
  category?: string
}

interface UpdateReminderData {
  title?: string
  description?: string
  dueAt?: string
  priority?: 'low' | 'medium' | 'high'
  category?: string
  isCompleted?: boolean
}

export function useReminders() {
  const csrfFetch = useCsrfFetch()

  const {
    data: reminders,
    pending,
    refresh,
  } = useFetch<Reminder[]>('/api/reminders', {
    default: () => [] as Reminder[],
  })

  async function createReminder(data: CreateReminderData) {
    const optimistic: Reminder = {
      id: -Date.now(),
      userId: '',
      title: data.title,
      description: data.description ?? null,
      dueAt: data.dueAt ?? null,
      priority: data.priority ?? 'medium',
      category: data.category ?? null,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    ;(reminders as Ref<Reminder[]>).value = [...(reminders.value ?? []), optimistic]

    try {
      const created = await csrfFetch<Reminder>('/api/reminders', {
        method: 'POST',
        body: data,
      })
      ;(reminders as Ref<Reminder[]>).value = (reminders.value ?? []).map((r) =>
        r.id === optimistic.id ? created : r,
      )
      return created
    } catch (error) {
      ;(reminders as Ref<Reminder[]>).value = (reminders.value ?? []).filter(
        (r) => r.id !== optimistic.id,
      )
      throw error
    }
  }

  async function updateReminder(id: number, data: UpdateReminderData) {
    const previous = (reminders.value ?? []).find((r) => r.id === id)
    if (!previous) return
    ;(reminders as Ref<Reminder[]>).value = (reminders.value ?? []).map((r) =>
      r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r,
    )

    try {
      const updated = await csrfFetch<Reminder>(`/api/reminders/${id}`, {
        method: 'PATCH',
        body: data,
      })
      ;(reminders as Ref<Reminder[]>).value = (reminders.value ?? []).map((r) =>
        r.id === id ? updated : r,
      )
      return updated
    } catch (error) {
      ;(reminders as Ref<Reminder[]>).value = (reminders.value ?? []).map((r) =>
        r.id === id ? previous : r,
      )
      throw error
    }
  }

  async function deleteReminder(id: number) {
    const previous = (reminders.value ?? []).find((r) => r.id === id)
    ;(reminders as Ref<Reminder[]>).value = (reminders.value ?? []).filter((r) => r.id !== id)

    try {
      await csrfFetch(`/api/reminders/${id}`, { method: 'DELETE' })
    } catch (error) {
      if (previous) {
        ;(reminders as Ref<Reminder[]>).value = [...(reminders.value ?? []), previous]
      }
      throw error
    }
  }

  return {
    reminders: reminders as Ref<Reminder[]>,
    pending,
    refresh,
    createReminder,
    updateReminder,
    deleteReminder,
  }
}
