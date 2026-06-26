'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { User, Project, ProjectStatus } from '@/lib/types'
import { PROJECT_STATUS_LABEL } from '@/lib/types'
import ProjectForm from '@/app/components/ProjectForm'

interface Props { user: User; initialProjects: Project[] }

const today = new Date().toISOString().slice(0, 10)

function isOverdue(due: string | null, status: ProjectStatus) {
  return !!due && due < today && status !== 'completed' && status !== 'cancelled'
}

function fmtDate(d: string | null) {
  if (!d) return null
  const [, m, day] = d.split('-')
  return `${m}/${day}`
}

export default function ProjectsClient({ initialProjects }: Props) {
  const [projects, setProjects] = useState(initialProjects)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [filter, setFilter] = useState<'all' | ProjectStatus>('all')

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter)

  async function saveProject(data: Partial<Project>) {
    if (editing) {
      const res = await fetch(`/api/projects/${editing.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      const updated = await res.json() as Project
      setProjects(prev => prev.map(p => p.id === updated.id ? { ...updated, task_count: p.task_count, completed_task_count: p.completed_task_count, total_estimated_hours: p.total_estimated_hours, total_actual_hours: p.total_actual_hours } : p))
    } else {
      const res = await fetch('/api/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      const created = await res.json() as Project
      setProjects(prev => [created, ...prev])
    }
    setShowForm(false)
    setEditing(null)
  }

  async function deleteProject(id: string) {
    if (!confirm('プロジェクトを削除しますか？配下のタスクもすべて削除されます。')) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="px-5 md:px-8 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold">プロジェクト</h1>
        <button onClick={() => { setEditing(null); setShowForm(true) }}
          className="bg-black text-white px-4 py-1.5 text-sm hover:opacity-80">
          + 新規
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-4 text-sm overflow-x-auto pb-1">
        {(['all', 'active', 'completed', 'on_hold', 'cancelled'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 border shrink-0 ${filter === f ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-500 hover:border-black'}`}>
            {f === 'all' ? 'すべて' : PROJECT_STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">プロジェクトがありません</p>
        </div>
      ) : (
        <div className="border border-gray-200 overflow-x-auto">
          {/* Desktop table header */}
          <div className="hidden md:grid grid-cols-[1fr_80px_90px_90px_70px_80px_80px] gap-2 px-4 py-2 bg-gray-50 text-xs text-gray-400 uppercase tracking-wider border-b border-gray-200">
            <span>プロジェクト名</span>
            <span>ステータス</span>
            <span className="text-right">期限</span>
            <span className="text-right">工数(予/実)</span>
            <span className="text-right">進捗</span>
            <span className="text-right">タスク</span>
            <span />
          </div>

          {filtered.map(p => {
            const overdue = isOverdue(p.due_date, p.status)
            return (
              <div key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 group">
                {/* Mobile card */}
                <div className="md:hidden px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/projects/${p.id}`} className="font-medium text-sm hover:underline">{p.name}</Link>
                    <span className="text-xs text-gray-400 shrink-0">{PROJECT_STATUS_LABEL[p.status]}</span>
                  </div>
                  {p.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{p.description}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    {p.due_date && <span className={`text-xs ${overdue ? 'text-red-500' : 'text-gray-400'}`}>{overdue ? '⚠ ' : ''}{fmtDate(p.due_date)}</span>}
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 h-1"><div className="bg-black h-1" style={{ width: `${p.progress}%` }} /></div>
                      <span className="text-xs text-gray-400">{p.progress}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => { setEditing(p); setShowForm(true) }} className="text-xs text-gray-400 hover:text-black">編集</button>
                    <button onClick={() => deleteProject(p.id)} className="text-xs text-gray-400 hover:text-red-500">削除</button>
                  </div>
                </div>

                {/* Desktop row */}
                <div className="hidden md:grid grid-cols-[1fr_80px_90px_90px_70px_80px_80px] gap-2 items-center px-4 py-3">
                  <div className="min-w-0">
                    <Link href={`/projects/${p.id}`} className="text-sm font-medium hover:underline truncate block">{p.name}</Link>
                    {p.description && <p className="text-xs text-gray-400 truncate">{p.description}</p>}
                  </div>
                  <span className="text-xs text-gray-500">{PROJECT_STATUS_LABEL[p.status]}</span>
                  <span className={`text-xs text-right ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                    {overdue ? '⚠ ' : ''}{fmtDate(p.due_date) ?? '—'}
                  </span>
                  <span className="text-xs text-right text-gray-400">
                    {p.total_estimated_hours ?? 0}h / {p.total_actual_hours ?? 0}h
                  </span>
                  <div className="flex items-center gap-1 justify-end">
                    <div className="w-12 bg-gray-100 h-1.5"><div className="bg-black h-1.5" style={{ width: `${p.progress}%` }} /></div>
                    <span className="text-xs text-gray-400 w-8 text-right">{p.progress}%</span>
                  </div>
                  <span className="text-xs text-right text-gray-400">{p.completed_task_count ?? 0}/{p.task_count ?? 0}</span>
                  <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(p); setShowForm(true) }} className="text-xs text-gray-400 hover:text-black">編集</button>
                    <button onClick={() => deleteProject(p.id)} className="text-xs text-gray-400 hover:text-red-500">削除</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <ProjectForm
          editing={editing}
          onSave={saveProject}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
