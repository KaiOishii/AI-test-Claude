'use client'
import { useState } from 'react'
import type { Todo, Category } from '@/lib/types'

interface Props {
  todo: Todo
  categories: Category[]
  dark: boolean
  onToggle: (id: string, completed: boolean) => void
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
  onAddSubtask: (parentId: string) => void
  onReorder: (id: string, direction: 'up' | 'down') => void
}

const PRIORITY_BADGE: Record<string, string> = {
  high:   'border-red-500 text-red-500',
  medium: 'border-yellow-500 text-yellow-500',
  low:    'border-blue-500 text-blue-500',
  none:   '',
}

const PRIORITY_LABEL: Record<string, string> = {
  high: '高', medium: '中', low: '低', none: '',
}

const RECURRING_ICON: Record<string, string> = {
  daily: '↻日', weekly: '↻週', monthly: '↻月', none: '',
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return dueDate < new Date().toISOString().slice(0, 10)
}

function isToday(dueDate: string | null): boolean {
  if (!dueDate) return false
  return dueDate === new Date().toISOString().slice(0, 10)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

export default function TodoItem({ todo, categories: _c, dark, onToggle, onEdit, onDelete, onAddSubtask, onReorder }: Props) {
  const [expanded, setExpanded] = useState(false)

  const overdue = !todo.completed && isOverdue(todo.due_date)
  const today   = !todo.completed && isToday(todo.due_date)
  const subtasks = todo.subtasks ?? []

  const completedSubs = subtasks.filter(s => s.completed).length
  const borderClass = dark ? 'border-gray-700' : 'border-gray-100'
  const mutedClass  = dark ? 'text-gray-400' : 'text-gray-500'

  return (
    <li className={`border-b ${borderClass}`}>
      <div className="flex items-start gap-3 py-3 group">
        {/* Drag handle / reorder */}
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 shrink-0 mt-1">
          <button onClick={() => onReorder(todo.id, 'up')} className={`text-xs ${mutedClass} hover:text-current leading-none`}>▴</button>
          <button onClick={() => onReorder(todo.id, 'down')} className={`text-xs ${mutedClass} hover:text-current leading-none`}>▾</button>
        </div>

        {/* Checkbox */}
        <button onClick={() => onToggle(todo.id, todo.completed)} className="mt-0.5 shrink-0">
          <span className={`block w-4 h-4 border transition-colors ${
            todo.completed
              ? (dark ? 'bg-white border-white' : 'bg-black border-black')
              : (dark ? 'border-gray-400' : 'border-black')
          }`} />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm ${todo.completed ? `line-through ${mutedClass}` : ''} ${overdue ? 'text-red-500' : ''}`}>
              {todo.title}
            </p>
            {todo.priority !== 'none' && (
              <span className={`text-xs border px-1 ${PRIORITY_BADGE[todo.priority]}`}>{PRIORITY_LABEL[todo.priority]}</span>
            )}
            {todo.recurring !== 'none' && (
              <span className={`text-xs ${mutedClass}`}>{RECURRING_ICON[todo.recurring]}</span>
            )}
          </div>
          {todo.memo && <p className={`text-xs mt-0.5 truncate ${mutedClass}`}>{todo.memo}</p>}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {todo.category_name && (
              <span className={`text-xs border px-1.5 py-0.5 ${dark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
                {todo.category_name}
              </span>
            )}
            {todo.due_date && (
              <span className={`text-xs ${
                overdue ? 'text-red-500 font-medium' :
                today   ? 'font-medium' :
                mutedClass
              }`}>
                {overdue ? '⚠ ' : ''}{formatDate(todo.due_date)}
              </span>
            )}
            {subtasks.length > 0 && (
              <button onClick={() => setExpanded(v => !v)} className={`text-xs ${mutedClass} hover:text-current`}>
                {expanded ? '▾' : '▸'} {completedSubs}/{subtasks.length}
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onAddSubtask(todo.id)} className={`text-xs ${mutedClass} hover:text-current`} title="サブタスク追加">＋</button>
          <button onClick={() => onEdit(todo)} className={`text-xs ${mutedClass} hover:text-current`}>編集</button>
          <button onClick={() => onDelete(todo.id)} className={`text-xs ${mutedClass} hover:text-current`}>削除</button>
        </div>
      </div>

      {/* Subtasks */}
      {expanded && subtasks.length > 0 && (
        <ul className={`ml-8 border-l-2 pl-3 mb-2 ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
          {subtasks.map(sub => (
            <li key={sub.id} className="flex items-center gap-2 py-1.5 group">
              <button onClick={() => onToggle(sub.id, sub.completed)} className="shrink-0">
                <span className={`block w-3 h-3 border ${sub.completed ? (dark ? 'bg-white border-white' : 'bg-black border-black') : (dark ? 'border-gray-400' : 'border-black')}`} />
              </button>
              <span className={`text-sm flex-1 ${sub.completed ? `line-through ${mutedClass}` : ''}`}>{sub.title}</span>
              <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                <button onClick={() => onEdit(sub)} className={`text-xs ${mutedClass} hover:text-current`}>編集</button>
                <button onClick={() => onDelete(sub.id)} className={`text-xs ${mutedClass} hover:text-current`}>削除</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
