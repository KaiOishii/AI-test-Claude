'use client'
import { useState } from 'react'
import type { Task, Project, TaskStatus, TaskPriority } from '@/lib/types'

interface Props {
  projectId: string
  projects?: Project[]
  parentTaskId?: string | null
  editing?: Task | null
  onSave: (data: Partial<Task>) => Promise<void>
  onClose: () => void
}

const STATUSES: TaskStatus[] = ['open', 'in_progress', 'completed', 'on_hold', 'cancelled']
const STATUS_LABELS: Record<TaskStatus, string> = {
  open: '未着手', in_progress: '進行中', completed: '完了', on_hold: '保留', cancelled: '中止',
}
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']
const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: '低', medium: '中', high: '高', urgent: '緊急',
}

export default function TaskForm({ projectId, parentTaskId, editing, onSave, onClose }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const data: Partial<Task> = {
      project_id: projectId,
      parent_task_id: parentTaskId ?? null,
      title: fd.get('title') as string,
      description: (fd.get('description') as string) || null,
      start_date: (fd.get('start_date') as string) || null,
      due_date: (fd.get('due_date') as string) || null,
      estimated_hours: fd.get('estimated_hours') ? Number(fd.get('estimated_hours')) : null,
      actual_hours: fd.get('actual_hours') ? Number(fd.get('actual_hours')) : null,
      progress: fd.get('progress') ? Number(fd.get('progress')) : 0,
      status: (fd.get('status') as TaskStatus) || 'open',
      priority: (fd.get('priority') as TaskPriority) || 'medium',
      is_todo_visible: fd.get('is_todo_visible') === 'on',
      todo_date: (fd.get('todo_date') as string) || null,
    }
    await onSave(data)
    setLoading(false)
  }

  const inp = 'w-full border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-black'
  const sel = inp

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 px-4 z-50 overflow-y-auto">
      <div className="bg-white w-full max-w-lg shadow-lg mb-8">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-sm">{editing ? 'タスクを編集' : 'タスクを追加'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">タスク名 *</label>
            <input name="title" required defaultValue={editing?.title}
              className={inp} placeholder="タスク名を入力" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">説明</label>
            <textarea name="description" rows={2} defaultValue={editing?.description ?? ''}
              className={inp + ' resize-none'} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">ステータス</label>
              <select name="status" defaultValue={editing?.status ?? 'open'} className={sel}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">優先度</label>
              <select name="priority" defaultValue={editing?.priority ?? 'medium'} className={sel}>
                {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">開始日</label>
              <input name="start_date" type="date" defaultValue={editing?.start_date ?? ''} className={inp} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">期限</label>
              <input name="due_date" type="date" defaultValue={editing?.due_date ?? ''} className={inp} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">予定工数(h)</label>
              <input name="estimated_hours" type="number" min="0" step="0.5"
                defaultValue={editing?.estimated_hours ?? ''}
                className={inp} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">実績工数(h)</label>
              <input name="actual_hours" type="number" min="0" step="0.5"
                defaultValue={editing?.actual_hours ?? ''}
                className={inp} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">進捗率(%)</label>
              <input name="progress" type="number" min="0" max="100"
                defaultValue={editing?.progress ?? 0}
                className={inp} />
            </div>
          </div>

          <div className="border-t pt-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input name="is_todo_visible" type="checkbox" defaultChecked={editing?.is_todo_visible}
                className="w-4 h-4" />
              今日のタスクに表示する
            </label>
            <div className="mt-2">
              <label className="block text-xs text-gray-500 mb-1">実施予定日</label>
              <input name="todo_date" type="date" defaultValue={editing?.todo_date ?? ''}
                className={inp + ' max-w-40'} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-1.5 text-sm border border-gray-300 hover:bg-gray-50">
              キャンセル
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-1.5 text-sm bg-black text-white hover:opacity-80 disabled:opacity-50">
              {loading ? '...' : (editing ? '保存' : '追加')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
