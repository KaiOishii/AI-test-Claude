'use client'
import type { Todo, Category, Priority, Recurring } from '@/lib/types'

interface Props {
  editing: Todo | null
  categories: Category[]
  dark: boolean
  onSave: (data: Partial<Todo>) => void
  onClose: () => void
}

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'none',   label: 'なし',   color: '' },
  { value: 'low',    label: '低',     color: 'text-blue-500' },
  { value: 'medium', label: '中',     color: 'text-yellow-500' },
  { value: 'high',   label: '高',     color: 'text-red-500' },
]

const RECURRINGS: { value: Recurring; label: string }[] = [
  { value: 'none',    label: 'なし' },
  { value: 'daily',   label: '毎日' },
  { value: 'weekly',  label: '毎週' },
  { value: 'monthly', label: '毎月' },
]

export default function TodoForm({ editing, categories, dark, onSave, onClose }: Props) {
  const inp = `w-full border px-3 py-2 text-sm outline-none focus:ring-1 ${
    dark ? 'bg-gray-800 border-gray-600 text-white focus:ring-gray-400' : 'bg-white border-black text-black focus:ring-black'
  }`

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    onSave({
      title:       (fd.get('title') as string).trim(),
      memo:        (fd.get('memo') as string) || null,
      category_id: (fd.get('category_id') as string) || null,
      due_date:    (fd.get('due_date') as string) || null,
      priority:    (fd.get('priority') as Priority) || 'none',
      recurring:   (fd.get('recurring') as Recurring) || 'none',
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className={`border w-full max-w-md p-6 ${dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-black'}`}>
        <h3 className="font-semibold mb-4">{editing ? 'ToDoを編集' : 'ToDoを追加'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">タイトル <span className="text-gray-400">*</span></label>
            <input name="title" required defaultValue={editing?.title} className={inp} />
          </div>
          <div>
            <label className="block text-sm mb-1">メモ</label>
            <textarea name="memo" rows={2} defaultValue={editing?.memo ?? ''} className={`${inp} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">カテゴリ</label>
              <select name="category_id" defaultValue={editing?.category_id ?? ''} className={`${inp} ${dark ? '' : 'bg-white'}`}>
                <option value="">なし</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">日付</label>
              <input type="date" name="due_date" defaultValue={editing?.due_date ?? ''} className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">優先度</label>
              <select name="priority" defaultValue={editing?.priority ?? 'none'} className={`${inp} ${dark ? '' : 'bg-white'}`}>
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">繰り返し</label>
              <select name="recurring" defaultValue={editing?.recurring ?? 'none'} className={`${inp} ${dark ? '' : 'bg-white'}`}>
                {RECURRINGS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 bg-black text-white dark:bg-white dark:text-black py-2 text-sm hover:opacity-80 transition-opacity">
              {editing ? '保存' : '追加'}
            </button>
            <button type="button" onClick={onClose}
              className={`flex-1 border py-2 text-sm hover:opacity-80 transition-opacity ${dark ? 'border-gray-600' : 'border-black'}`}>
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
