'use client'
import { useState } from 'react'
import type { Task, TaskStatus, TaskPriority } from '@/lib/types'

interface Props {
  task: Task
  level: number
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onAddChild: (parentId: string) => void
  onToggleTodo: (task: Task) => void
}

const STATUS_STYLES: Record<TaskStatus, string> = {
  open:        'border-gray-400 text-gray-500',
  in_progress: 'border-blue-500 text-blue-600',
  completed:   'border-green-500 text-green-600',
  on_hold:     'border-yellow-500 text-yellow-600',
  cancelled:   'border-red-400 text-red-500',
}
const STATUS_LABEL: Record<TaskStatus, string> = {
  open: '未着手', in_progress: '進行中', completed: '完了', on_hold: '保留', cancelled: '中止',
}
const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: 'text-gray-400', medium: 'text-gray-600', high: 'text-orange-500 font-medium', urgent: 'text-red-600 font-bold',
}
const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: '低', medium: '中', high: '高', urgent: '緊急',
}

function fmt(d: string | null) {
  if (!d) return null
  const [, m, day] = d.split('-')
  return `${m}/${day}`
}

function isOverdue(due: string | null, status: TaskStatus) {
  if (!due || status === 'completed' || status === 'cancelled') return false
  return due < new Date().toISOString().slice(0, 10)
}

export default function WbsRow({ task, level, onEdit, onDelete, onAddChild, onToggleTodo }: Props) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = (task.children?.length ?? 0) > 0
  const overdue = isOverdue(task.due_date, task.status)
  const indent = level * 20

  return (
    <>
      <div className={`group flex items-center gap-2 px-3 py-2 hover:bg-gray-50 border-b border-gray-100 text-sm ${
        task.status === 'completed' ? 'opacity-60' : ''
      }`}>
        {/* indent + expand */}
        <div className="shrink-0 flex items-center gap-1" style={{ paddingLeft: indent }}>
          {hasChildren ? (
            <button onClick={() => setExpanded(v => !v)} className="w-4 text-gray-400 hover:text-black text-xs">
              {expanded ? '▾' : '▸'}
            </button>
          ) : (
            <span className="w-4" />
          )}
        </div>

        {/* title */}
        <span className={`flex-1 min-w-0 truncate ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
          {task.title}
        </span>

        {/* status badge */}
        <span className={`hidden sm:inline-block shrink-0 text-xs border px-1.5 py-0.5 ${STATUS_STYLES[task.status]}`}>
          {STATUS_LABEL[task.status]}
        </span>

        {/* priority */}
        <span className={`hidden sm:inline-block shrink-0 text-xs w-6 text-center ${PRIORITY_STYLES[task.priority]}`}>
          {PRIORITY_LABEL[task.priority]}
        </span>

        {/* due date */}
        <span className={`hidden md:inline-block shrink-0 text-xs w-12 text-right ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
          {overdue && '⚠'}{fmt(task.due_date) ?? '—'}
        </span>

        {/* hours */}
        <span className="hidden lg:inline-block shrink-0 text-xs w-20 text-right text-gray-400">
          {task.estimated_hours ?? '—'}h / {task.actual_hours ?? '—'}h
        </span>

        {/* progress */}
        <div className="hidden md:flex shrink-0 items-center gap-1 w-16">
          <div className="flex-1 bg-gray-200 h-1.5">
            <div className="bg-black h-1.5" style={{ width: `${task.progress}%` }} />
          </div>
          <span className="text-xs text-gray-400 w-7 text-right">{task.progress}%</span>
        </div>

        {/* todo toggle */}
        <button onClick={() => onToggleTodo(task)}
          className={`shrink-0 text-xs px-1 opacity-0 group-hover:opacity-100 transition-opacity ${
            task.is_todo_visible ? 'text-black' : 'text-gray-300'
          }`} title="今日のタスクに追加">
          ☑
        </button>

        {/* actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onAddChild(task.id)} className="text-xs text-gray-400 hover:text-black px-1" title="子タスク追加">＋</button>
          <button onClick={() => onEdit(task)} className="text-xs text-gray-400 hover:text-black px-1">編集</button>
          <button onClick={() => onDelete(task.id)} className="text-xs text-gray-400 hover:text-red-500 px-1">削除</button>
        </div>
      </div>

      {expanded && task.children?.map(child => (
        <WbsRow
          key={child.id}
          task={child}
          level={level + 1}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
          onToggleTodo={onToggleTodo}
        />
      ))}
    </>
  )
}
