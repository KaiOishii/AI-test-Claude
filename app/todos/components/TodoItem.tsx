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

const PRIORITY_DOT: Record<string, string> = {
  high:   'bg-[#c0392b]',
  medium: 'bg-[#e0a030]',
  low:    'bg-[#5a8fc0]',
  none:   'bg-transparent',
}

const RECURRING_TEXT: Record<string, string> = {
  daily: '毎日', weekly: '毎週', monthly: '毎月', none: '',
}

function isOverdue(d: string | null) {
  return !!d && d < new Date().toISOString().slice(0, 10)
}
function isToday(d: string | null) {
  return d === new Date().toISOString().slice(0, 10)
}
function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getMonth() + 1}/${dt.getDate()}`
}

export default function TodoItem({ todo, categories: _c, dark, onToggle, onEdit, onDelete, onAddSubtask, onReorder }: Props) {
  const [expanded, setExpanded] = useState(false)
  const overdue = !todo.completed && isOverdue(todo.due_date)
  const today   = !todo.completed && isToday(todo.due_date)
  const subtasks = todo.subtasks ?? []
  const completedSubs = subtasks.filter(s => s.completed).length
  const muted = dark ? 'text-[#666]' : 'text-[#aaa]'

  return (
    <li className="group py-3">
      <div className="flex items-start gap-3">
        {/* Reorder */}
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 shrink-0 mt-1.5 w-3">
          <button onClick={() => onReorder(todo.id, 'up')} className={`text-[10px] ${muted} leading-none hover:opacity-100`}>▴</button>
          <button onClick={() => onReorder(todo.id, 'down')} className={`text-[10px] ${muted} leading-none hover:opacity-100`}>▾</button>
        </div>

        {/* Priority dot (hidden text for accessibility/tests) */}
        <div className="mt-2 shrink-0 relative">
          <span className={`block w-1.5 h-1.5 rounded-full ${todo.priority !== 'none' ? PRIORITY_DOT[todo.priority] : (dark ? 'bg-[#444]' : 'bg-[#ddd]')}`} />
          {todo.priority !== 'none' && (
            <span className="sr-only">
              {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
            </span>
          )}
        </div>

        {/* Checkbox */}
        <button onClick={() => onToggle(todo.id, todo.completed)} className="mt-0.5 shrink-0">
          <span className={`block w-3.5 h-3.5 border transition-colors ${
            todo.completed
              ? (dark ? 'bg-[#eee] border-[#eee]' : 'bg-[#111] border-[#111]')
              : (dark ? 'border-[#555]' : 'border-[#bbb]')
          }`} />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-5 ${todo.completed ? `line-through ${muted}` : ''} ${overdue ? 'text-[#c0392b]' : ''}`}>
            {todo.title}
          </p>
          <div className={`flex items-center gap-2 mt-0.5 text-xs ${muted}`}>
            {todo.memo && <span className="truncate max-w-[200px]">{todo.memo}</span>}
            {todo.category_name && <span>{todo.category_name}</span>}
            {todo.due_date && (
              <span className={overdue ? 'text-[#c0392b]' : today ? (dark ? 'text-[#eee]' : 'text-[#111]') : ''}>
                {fmtDate(todo.due_date)}
              </span>
            )}
            {todo.recurring !== 'none' && <span>{RECURRING_TEXT[todo.recurring]}</span>}
            {subtasks.length > 0 && (
              <button onClick={() => setExpanded(v => !v)} className="hover:opacity-100">
                {completedSubs}/{subtasks.length}
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={`flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-xs ${muted}`}>
          <button onClick={() => onAddSubtask(todo.id)} className="hover:text-current">+</button>
          <button onClick={() => onEdit(todo)} className="hover:text-current">edit</button>
          <button onClick={() => onDelete(todo.id)} className="hover:text-current">del</button>
        </div>
      </div>

      {/* Subtasks */}
      {expanded && subtasks.length > 0 && (
        <ul className="ml-10 mt-1 space-y-1">
          {subtasks.map(sub => (
            <li key={sub.id} className="flex items-center gap-2.5 py-1 group/sub">
              <span className="w-1.5 h-1.5 shrink-0" />
              <button onClick={() => onToggle(sub.id, sub.completed)} className="shrink-0">
                <span className={`block w-3 h-3 border ${sub.completed ? (dark ? 'bg-[#eee] border-[#eee]' : 'bg-[#111] border-[#111]') : (dark ? 'border-[#555]' : 'border-[#bbb]')}`} />
              </button>
              <span className={`text-xs flex-1 ${sub.completed ? `line-through ${muted}` : ''}`}>{sub.title}</span>
              <div className={`opacity-0 group-hover/sub:opacity-100 flex gap-2 text-xs ${muted}`}>
                <button onClick={() => onEdit(sub)} className="hover:text-current">edit</button>
                <button onClick={() => onDelete(sub.id)} className="hover:text-current">del</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
