'use client'
import { useState } from 'react'
import type { Project, ProjectStatus } from '@/lib/types'

interface Props {
  editing?: Project | null
  onSave: (data: Partial<Project>) => Promise<void>
  onClose: () => void
}

const STATUSES: ProjectStatus[] = ['active', 'completed', 'on_hold', 'cancelled']
const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: '進行中', completed: '完了', on_hold: '保留', cancelled: '中止',
}

export default function ProjectForm({ editing, onSave, onClose }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    await onSave({
      name: fd.get('name') as string,
      description: (fd.get('description') as string) || null,
      start_date: (fd.get('start_date') as string) || null,
      due_date: (fd.get('due_date') as string) || null,
      status: (fd.get('status') as ProjectStatus) || 'active',
      progress: fd.get('progress') ? Number(fd.get('progress')) : 0,
    })
    setLoading(false)
  }

  const inp = 'w-full border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-black'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
      <div className="bg-white w-full max-w-md shadow-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-sm">{editing ? 'プロジェクトを編集' : 'プロジェクトを追加'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">プロジェクト名 *</label>
            <input name="name" required defaultValue={editing?.name} className={inp} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">説明</label>
            <textarea name="description" rows={2} defaultValue={editing?.description ?? ''}
              className={inp + ' resize-none'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">開始日</label>
              <input name="start_date" type="date" defaultValue={editing?.start_date ?? ''} className={inp} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">終了予定日</label>
              <input name="due_date" type="date" defaultValue={editing?.due_date ?? ''} className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">ステータス</label>
              <select name="status" defaultValue={editing?.status ?? 'active'} className={inp}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">進捗率(%)</label>
              <input name="progress" type="number" min="0" max="100"
                defaultValue={editing?.progress ?? 0} className={inp} />
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
