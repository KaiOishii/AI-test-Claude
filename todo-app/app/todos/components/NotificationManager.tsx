'use client'
import { useEffect } from 'react'
import type { Todo } from '@/lib/types'

interface Props { todos: Todo[] }

export default function NotificationManager({ todos }: Props) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const today = new Date().toISOString().slice(0, 10)
    const overdue = todos.filter(t => !t.completed && t.due_date && t.due_date < today)
    const dueToday = todos.filter(t => !t.completed && t.due_date === today)

    if (overdue.length > 0) {
      new Notification('期限切れのタスクがあります', {
        body: overdue.map(t => t.title).join('、'),
        icon: '/favicon.ico',
      })
    }
    if (dueToday.length > 0) {
      new Notification('今日が期限のタスクがあります', {
        body: dueToday.map(t => t.title).join('、'),
        icon: '/favicon.ico',
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todos.length])

  return null
}
