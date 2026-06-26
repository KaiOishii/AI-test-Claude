import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { Task } from '@/lib/types'

function normalizeTask(t: Record<string, unknown>): Task {
  return { ...t, is_todo_visible: !!t.is_todo_visible } as Task
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const rows = await sql`
    SELECT t.*, p.name as project_name FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.id = ${id} AND t.user_id = ${session.userId}
  `
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(normalizeTask(rows[0] as Record<string, unknown>))
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await sql`SELECT * FROM tasks WHERE id = ${id} AND user_id = ${session.userId}`
  const task = existing[0] as Task | undefined
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const {
    title, description, parent_task_id,
    start_date, due_date, actual_start_date, actual_end_date,
    estimated_hours, actual_hours, progress, status, priority,
    sort_order, is_todo_visible, todo_date
  } = body

  const now = new Date().toISOString()
  const newStatus = status !== undefined ? status : task.status

  let newCompletedAt: string | null
  if (status === 'completed' && task.status !== 'completed') {
    newCompletedAt = now
  } else if (status !== undefined && status !== 'completed') {
    newCompletedAt = null
  } else {
    newCompletedAt = task.completed_at ?? null
  }

  const patch = {
    title:             title             !== undefined ? title                       : task.title,
    description:       description       !== undefined ? (description || null)       : task.description,
    parent_task_id:    parent_task_id    !== undefined ? (parent_task_id || null)    : task.parent_task_id,
    start_date:        start_date        !== undefined ? (start_date || null)        : task.start_date,
    due_date:          due_date          !== undefined ? (due_date || null)          : task.due_date,
    actual_start_date: actual_start_date !== undefined ? (actual_start_date || null) : task.actual_start_date,
    actual_end_date:   actual_end_date   !== undefined ? (actual_end_date || null)   : task.actual_end_date,
    estimated_hours:   estimated_hours   !== undefined ? (estimated_hours ?? null)   : task.estimated_hours,
    actual_hours:      actual_hours      !== undefined ? (actual_hours ?? null)      : task.actual_hours,
    progress:          progress          !== undefined ? progress                    : task.progress,
    status:            newStatus,
    priority:          priority          !== undefined ? priority                    : task.priority,
    sort_order:        sort_order        !== undefined ? sort_order                  : task.sort_order,
    is_todo_visible:   is_todo_visible   !== undefined ? !!is_todo_visible           : task.is_todo_visible,
    todo_date:         todo_date         !== undefined ? (todo_date || null)         : task.todo_date,
    completed_at:      newCompletedAt,
  }

  const [updated] = await sql`
    UPDATE tasks SET
      title             = ${patch.title},
      description       = ${patch.description},
      parent_task_id    = ${patch.parent_task_id},
      start_date        = ${patch.start_date},
      due_date          = ${patch.due_date},
      actual_start_date = ${patch.actual_start_date},
      actual_end_date   = ${patch.actual_end_date},
      estimated_hours   = ${patch.estimated_hours},
      actual_hours      = ${patch.actual_hours},
      progress          = ${patch.progress},
      status            = ${patch.status},
      priority          = ${patch.priority},
      sort_order        = ${patch.sort_order},
      is_todo_visible   = ${patch.is_todo_visible},
      todo_date         = ${patch.todo_date},
      completed_at      = ${patch.completed_at},
      updated_at        = ${now}
    WHERE id = ${id} AND user_id = ${session.userId}
    RETURNING *
  `

  return NextResponse.json(normalizeTask(updated as Record<string, unknown>))
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await sql`DELETE FROM tasks WHERE parent_task_id = ${id} AND user_id = ${session.userId}`
  const deleted = await sql`DELETE FROM tasks WHERE id = ${id} AND user_id = ${session.userId} RETURNING id`
  if (deleted.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
