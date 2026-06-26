'use client'
import type { Todo, Category, Priority, Recurring } from '@/lib/types'

interface Props {
  editing: Todo | null
  categories: Category[]
  dark: boolean
  onSave: (data: Partial<Todo>) => void
  onClose: () => void
}

export default function TodoForm({ editing, categories, dark, onSave, onClose }: Props) {
  const inp = `w-full bg-transparent border-b pb-1.5 text-sm outline-none transition-colors ${
    dark
      ? 'border-[#333] text-[#eee] focus:border-[#888]'
      : 'border-[#e0e0e0] text-[#111] focus:border-[#666]'
  }`
  const sel = `${inp} ${dark ? 'bg-[#0f0f0f]' : 'bg-[#f5f5f4]'}`
  const muted = dark ? 'text-[#666]' : 'text-[#aaa]'

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
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 px-4">
      <div className={`w-full max-w-sm p-8 ${dark ? 'bg-[#0f0f0f]' : 'bg-[#f5f5f4]'}`}>
        <p className={`text-xs ${muted} mb-6`}>{editing ? 'edit' : 'add'}</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input name="title" required defaultValue={editing?.title} placeholder="title" className={inp} />
          <input name="memo" defaultValue={editing?.memo ?? ''} placeholder="note" className={inp} />
          <div className="grid grid-cols-2 gap-4">
            <select name="category_id" defaultValue={editing?.category_id ?? ''} className={sel}>
              <option value="">no category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="date" name="due_date" defaultValue={editing?.due_date ?? ''} className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select name="priority" defaultValue={editing?.priority ?? 'none'} className={sel}>
              <option value="none">— priority</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
            <select name="recurring" defaultValue={editing?.recurring ?? 'none'} className={sel}>
              <option value="none">— repeat</option>
              <option value="daily">daily</option>
              <option value="weekly">weekly</option>
              <option value="monthly">monthly</option>
            </select>
          </div>
          <div className="flex gap-6 pt-2">
            <button type="submit" className={`text-sm hover:opacity-50 transition-opacity`}>
              {editing ? 'save' : 'add'}
            </button>
            <button type="button" onClick={onClose} className={`text-sm ${muted} hover:opacity-50 transition-opacity`}>
              cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
