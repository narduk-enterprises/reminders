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
    data: rawReminders,
    pending,
    refresh,
  } = useFetch<Reminder[]>('/api/reminders', {
    default: () => [] as Reminder[],
  })

  const reminders = rawReminders as Ref<Reminder[]>

  function setReminders(value: Reminder[]) {
    reminders.value = value
  }

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

    setReminders([...reminders.value, optimistic])

    try {
      const created = await csrfFetch<Reminder>('/api/reminders', {
        method: 'POST',
        body: data,
      })
      setReminders(reminders.value.map((r) => (r.id === optimistic.id ? created : r)))
      return created
    } catch (error) {
      setReminders(reminders.value.filter((r) => r.id !== optimistic.id))
      throw error
    }
  }

  async function updateReminder(id: number, data: UpdateReminderData) {
    const previous = reminders.value.find((r) => r.id === id)
    if (!previous) return

    setReminders(
      reminders.value.map((r) =>
        r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r,
      ),
    )

    try {
      const updated = await csrfFetch<Reminder>(`/api/reminders/${id}`, {
        method: 'PATCH',
        body: data,
      })
      setReminders(reminders.value.map((r) => (r.id === id ? updated : r)))
      return updated
    } catch (error) {
      setReminders(reminders.value.map((r) => (r.id === id ? previous : r)))
      throw error
    }
  }

  async function deleteReminder(id: number) {
    const previous = reminders.value.find((r) => r.id === id)
    setReminders(reminders.value.filter((r) => r.id !== id))

    try {
      await csrfFetch(`/api/reminders/${id}`, { method: 'DELETE' })
    } catch (error) {
      if (previous) {
        setReminders([...reminders.value, previous])
      }
      throw error
    }
  }

  return {
    reminders,
    pending,
    refresh,
    createReminder,
    updateReminder,
    deleteReminder,
  }
}
