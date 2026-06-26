'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { User, Project, Task } from '@/lib/types'
import { PROJECT_STATUS_LABEL } from '@/lib/types'
import TaskForm from '@/app/components/TaskForm'
import ProjectForm from '@/app/components/ProjectForm'
import WbsRow from '@/app/components/WbsRow'

interface Props {
  user: User
  initialProject: Project
  initialTasks: Task[]
}

type ViewMode = 'wbs' | 'table'

function buildTree(tasks: Task[]): Task[] {
  const roots = tasks.filter(t => !t.parent_task_id)
  function attachChildren(t: Task): Task {
    return { ...t, children: tasks.filter(c => c.parent_task_id === t.id).map(attachChildren) }
  }
  return roots.map(attachChildren)
}

function today() { return new Date().toISOString().slice(0, 10) }

const STATUS_LABELS = { open: '未着手', in_progress: '進行中', completed: '完了', on_hold: '保留', cancelled: '中止' }
const PRIORITY_LABELS = { low: '低', medium: '中', high: '高', urgent: '緊急' }

export default function ProjectDetailClient({ initialProject, initialTasks }: Props) {
  const [project, setProject] = useState(initialProject)
  const [tasks, setTasks] = useState(initialTasks)
  const [view, setView] = useState<ViewMode>('wbs')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [parentTaskId, setParentTaskId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const tree = useMemo(() => buildTree(tasks), [tasks])
  const filtered = statusFilter === 'all' ? tree : tree.filter(t => t.status === statusFilter)

  async function refreshTasks() {
    const res = await fetch(`/api/tasks?project_id=${project.id}`)
    const fresh = await res.json() as Task[]
    setTasks(fresh)
  }

  async function refreshProject() {
    const res = await fetch(`/api/projects/${project.id}`)
    const p = await res.json() as Project
    setProject(p)
  }

  async function saveTask(data: Partial<Task>) {
    if (editingTask) {
      await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
    } else {
      await fetch('/api/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, project_id: project.id, parent_task_id: parentTaskId }),
      })
    }
    await refreshTasks()
    setShowTaskForm(false)
    setEditingTask(null)
    setParentTaskId(null)
  }

  async function deleteTask(id: string) {
    if (!confirm('タスクを削除しますか？子タスクもすべて削除されます。')) return
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    await refreshTasks()
  }

  async function toggleTodo(task: Task) {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_todo_visible: !task.is_todo_visible, todo_date: !task.is_todo_visible ? today() : null }),
    })
    await refreshTasks()
  }

  async function saveProject(data: Partial<Project>) {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    const updated = await res.json() as Project
    setProject(updated)
    setShowProjectForm(false)
  }

  const td = today()
  const overdueCount = tasks.filter(t => t.due_date && t.due_date < td && t.status !== 'completed' && t.status !== 'cancelled').length

  return (
    <div className="px-5 md:px-8 py-6">
      {/* Breadcrumb */}
      <p className="text-xs text-gray-400 mb-4">
        <Link href="/projects" className="hover:text-black">プロジェクト</Link>
        {' / '}{project.name}
      </p>

      {/* Project header */}
      <div className="border border-gray-200 p-4 mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold">{project.name}</h1>
            {project.description && <p className="text-sm text-gray-500 mt-0.5">{project.description}</p>}
          </div>
          <button onClick={() => setShowProjectForm(true)}
            className="text-xs text-gray-400 hover:text-black shrink-0">編集</button>
        </div>

        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
          <span>ステータス: <strong>{PROJECT_STATUS_LABEL[project.status]}</strong></span>
          {project.start_date && <span>開始: <strong>{project.start_date}</strong></span>}
          {project.due_date && <span>締切: <strong>{project.due_date}</strong></span>}
          <span>予定: <strong>{project.total_estimated_hours ?? 0}h</strong></span>
          <span>実績: <strong>{project.total_actual_hours ?? 0}h</strong></span>
          {overdueCount > 0 && <span className="text-red-500">遅延タスク: <strong>{overdueCount}</strong></span>}
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 h-2">
              <div className="bg-black h-2 transition-all" style={{ width: `${project.progress}%` }} />
            </div>
            <span className="text-xs text-gray-500 w-12 text-right">{project.progress}%</span>
            <span className="text-xs text-gray-400">({project.completed_task_count ?? 0}/{project.task_count ?? 0})</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-1">
          <button onClick={() => setView('wbs')}
            className={`px-3 py-1 text-sm border ${view === 'wbs' ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-500 hover:border-black'}`}>
            WBSリスト
          </button>
          <button onClick={() => setView('table')}
            className={`px-3 py-1 text-sm border ${view === 'table' ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-500 hover:border-black'}`}>
            テーブル
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-300 px-2 py-1 outline-none">
            <option value="all">すべて</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button onClick={() => { setEditingTask(null); setParentTaskId(null); setShowTaskForm(true) }}
            className="bg-black text-white px-4 py-1.5 text-sm hover:opacity-80">
            + タスク追加
          </button>
        </div>
      </div>

      {/* WBS / Table view */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200 text-sm text-gray-400">
          タスクがありません
        </div>
      ) : view === 'wbs' ? (
        <div className="border border-gray-200">
          {/* Column headers */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wider">
            <span className="flex-1">タスク名</span>
            <span className="w-16 text-center">ステータス</span>
            <span className="w-6 text-center">優先</span>
            <span className="w-12 text-right">期限</span>
            <span className="w-20 text-right">工数(予/実)</span>
            <span className="w-24 text-right">進捗</span>
            <span className="w-24" />
          </div>
          {filtered.map(t => (
            <WbsRow
              key={t.id}
              task={t}
              level={0}
              onEdit={task => { setEditingTask(task); setParentTaskId(null); setShowTaskForm(true) }}
              onDelete={deleteTask}
              onAddChild={pid => { setEditingTask(null); setParentTaskId(pid); setShowTaskForm(true) }}
              onToggleTodo={toggleTodo}
            />
          ))}
        </div>
      ) : (
        /* Table view — flat list with all tasks */
        <div className="border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-3 py-2 font-normal">タスク名</th>
                <th className="text-left px-3 py-2 font-normal">ステータス</th>
                <th className="text-left px-3 py-2 font-normal">優先度</th>
                <th className="text-left px-3 py-2 font-normal">期限</th>
                <th className="text-right px-3 py-2 font-normal">予定工数</th>
                <th className="text-right px-3 py-2 font-normal">実績工数</th>
                <th className="text-right px-3 py-2 font-normal">進捗</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {tasks.filter(t => statusFilter === 'all' || t.status === statusFilter).map(t => {
                const overdue = t.due_date && t.due_date < td && t.status !== 'completed' && t.status !== 'cancelled'
                return (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 group">
                    <td className="px-3 py-2">
                      <span className={t.status === 'completed' ? 'line-through text-gray-400' : ''}>{t.title}</span>
                      {t.parent_task_id && <span className="ml-1 text-xs text-gray-300">↳</span>}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">{STATUS_LABELS[t.status]}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{PRIORITY_LABELS[t.priority]}</td>
                    <td className={`px-3 py-2 text-xs ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                      {t.due_date ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-right text-gray-400">{t.estimated_hours ?? '—'}h</td>
                    <td className="px-3 py-2 text-xs text-right text-gray-400">{t.actual_hours ?? '—'}h</td>
                    <td className="px-3 py-2 text-xs text-right text-gray-400">{t.progress}%</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingTask(t); setParentTaskId(null); setShowTaskForm(true) }}
                          className="text-xs text-gray-400 hover:text-black">編集</button>
                        <button onClick={() => deleteTask(t.id)}
                          className="text-xs text-gray-400 hover:text-red-500">削除</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showTaskForm && (
        <TaskForm
          projectId={project.id}
          parentTaskId={parentTaskId}
          editing={editingTask}
          onSave={saveTask}
          onClose={() => { setShowTaskForm(false); setEditingTask(null); setParentTaskId(null) }}
        />
      )}

      {showProjectForm && (
        <ProjectForm
          editing={project}
          onSave={data => saveProject(data).then(() => refreshProject())}
          onClose={() => setShowProjectForm(false)}
        />
      )}
    </div>
  )
}
