import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { Task } from '@/lib/types'
import { normalizeTask } from '@/lib/types'

type RawTask = Omit<Task, 'is_todo_visible'> & { is_todo_visible: number }

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const task = db.prepare(`
    SELECT t.*, p.name as project_name FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.id = ? AND t.user_id = ?
  `).get(id, session.userId) as RawTask | undefined

  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(normalizeTask(task))
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, session.userId) as RawTask | undefined
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const {
    title, description, parent_task_id,
    start_date, due_date, actual_start_date, actual_end_date,
    estimated_hours, actual_hours, progress, status, priority,
    sort_order, is_todo_visible, todo_date
  } = body

  const completedAt = status === 'completed' && task.status !== 'completed'
    ? "datetime('now')" : status !== 'completed' ? 'NULL' : null

  db.prepare(`
    UPDATE tasks SET
      title             = COALESCE(?, title),
      description       = COALESCE(?, description),
      parent_task_id    = COALESCE(?, parent_task_id),
      start_date        = COALESCE(?, start_date),
      due_date          = COALESCE(?, due_date),
      actual_start_date = COALESCE(?, actual_start_date),
      actual_end_date   = COALESCE(?, actual_end_date),
      estimated_hours   = COALESCE(?, estimated_hours),
      actual_hours      = COALESCE(?, actual_hours),
      progress          = COALESCE(?, progress),
      status            = COALESCE(?, status),
      priority          = COALESCE(?, priority),
      sort_order        = COALESCE(?, sort_order),
      is_todo_visible   = COALESCE(?, is_todo_visible),
      todo_date         = COALESCE(?, todo_date),
      completed_at      = ${completedAt !== null ? completedAt : 'completed_at'},
      updated_at        = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(
    title ?? null,
    description !== undefined ? (description || null) : null,
    parent_task_id !== undefined ? (parent_task_id || null) : null,
    start_date !== undefined ? (start_date || null) : null,
    due_date !== undefined ? (due_date || null) : null,
    actual_start_date !== undefined ? (actual_start_date || null) : null,
    actual_end_date !== undefined ? (actual_end_date || null) : null,
    estimated_hours ?? null,
    actual_hours ?? null,
    progress ?? null,
    status ?? null,
    priority ?? null,
    sort_order ?? null,
    is_todo_visible !== undefined ? (is_todo_visible ? 1 : 0) : null,
    todo_date !== undefined ? (todo_date || null) : null,
    id, session.userId
  )

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as RawTask
  return NextResponse.json(normalizeTask(updated))
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  db.prepare('DELETE FROM tasks WHERE parent_task_id = ? AND user_id = ?').run(id, session.userId)
  const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(id, session.userId)
  if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
