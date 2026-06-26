'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { User, Task, TaskStatus } from '@/lib/types'
import { TASK_STATUS_LABEL, TASK_PRIORITY_LABEL } from '@/lib/types'

interface Props { user: User; initialTasks: Task[]; today: string }

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  open: 'in_progress', in_progress: 'completed', completed: 'open', on_hold: 'in_progress', cancelled: 'open',
}
const PRIORITY_COLOR = { low: 'text-gray-400', medium: 'text-gray-600', high: 'text-orange-500', urgent: 'text-red-600 font-bold' }

function fmtDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${y}年${m}月${day}日`
}

export default function TodayClient({ initialTasks, today }: Props) {
  const [tasks, setTasks] = useState(initialTasks)

  async function advanceStatus(task: Task) {
    const next = STATUS_CYCLE[task.status]
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    const updated = await res.json() as Task
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t))
  }

  async function removeFromToday(task: Task) {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_todo_visible: false, todo_date: null }),
    })
    setTasks(prev => prev.filter(t => t.id !== task.id || t.due_date === today))
  }

  async function sendToTomorrow(task: Task) {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().slice(0, 10)
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todo_date: tomorrowStr }),
    })
    setTasks(prev => prev.filter(t => t.id !== task.id))
  }

  const pending = tasks.filter(t => t.status !== 'completed')
  const done = tasks.filter(t => t.status === 'completed')

  return (
    <div className="px-5 md:px-8 py-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">今日のタスク</h1>
        <p className="text-sm text-gray-400 mt-0.5">{fmtDate(today)} · {pending.length} 件未完了</p>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200">
          <p className="text-sm text-gray-400 mb-3">今日のタスクはありません</p>
          <Link href="/projects" className="text-sm underline text-gray-500">プロジェクトからタスクを追加</Link>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-3">未完了 ({pending.length})</h2>
              <div className="border border-gray-200 divide-y divide-gray-100">
                {pending.map(t => {
                  const overdue = t.due_date && t.due_date < today
                  return (
                    <div key={t.id} className="group flex items-start gap-3 px-4 py-3 hover:bg-gray-50">
                      {/* Status advance button */}
                      <button onClick={() => advanceStatus(t)}
                        className={`mt-0.5 shrink-0 w-5 h-5 border flex items-center justify-center text-xs transition-colors ${
                          t.status === 'in_progress' ? 'border-blue-400 text-blue-400' : 'border-gray-300 text-transparent hover:border-gray-400'
                        }`} title={`→ ${TASK_STATUS_LABEL[STATUS_CYCLE[t.status]]}`}>
                        {t.status === 'in_progress' ? '▷' : ''}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm">{t.title}</span>
                          <span className={`text-xs ${PRIORITY_COLOR[t.priority]}`}>{TASK_PRIORITY_LABEL[t.priority]}</span>
                          {overdue && <span className="text-xs text-red-500 font-medium">⚠ 期限切れ</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-400">
                            <Link href={`/projects/${t.project_id}`} className="hover:underline">{t.project_name}</Link>
                          </span>
                          <span className="text-xs text-gray-400">{TASK_STATUS_LABEL[t.status]}</span>
                          {t.estimated_hours && <span className="text-xs text-gray-400">予定 {t.estimated_hours}h</span>}
                        </div>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => sendToTomorrow(t)} className="text-xs text-gray-400 hover:text-black px-1" title="明日に送る">→明日</button>
                        <button onClick={() => removeFromToday(t)} className="text-xs text-gray-400 hover:text-black px-1">外す</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {done.length > 0 && (
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-3">完了 ({done.length})</h2>
              <div className="border border-gray-100 divide-y divide-gray-50">
                {done.map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 opacity-50">
                    <span className="w-5 h-5 border border-gray-300 flex items-center justify-center text-xs text-gray-400">✓</span>
                    <span className="flex-1 text-sm line-through text-gray-400">{t.title}</span>
                    <span className="text-xs text-gray-400">{t.project_name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
