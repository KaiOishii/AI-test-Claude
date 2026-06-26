import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import db from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { Task, RawTask } from '@/lib/types'
import { normalizeTask } from '@/lib/types'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get('project_id')
  const todoOnly = req.nextUrl.searchParams.get('todo') === '1'
  const today = req.nextUrl.searchParams.get('today')

  let query = `SELECT t.*, p.name as project_name FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.user_id = ?`
  const args: unknown[] = [session.userId]

  if (projectId) { query += ' AND t.project_id = ?'; args.push(projectId) }
  if (todoOnly) { query += ' AND t.is_todo_visible = 1' }
  if (today) { query += ' AND (t.todo_date = ? OR t.due_date = ?)'; args.push(today, today) }

  query += ' ORDER BY t.sort_order ASC, t.created_at ASC'

  const rows = db.prepare(query).all(...args) as RawTask[]
  const tasks = rows.map(normalizeTask)

  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    project_id, parent_task_id, title, description,
    start_date, due_date, estimated_hours, actual_hours,
    progress, status, priority, sort_order, is_todo_visible, todo_date
  } = body

  if (!project_id || !title) {
    return NextResponse.json({ error: 'プロジェクトとタスク名は必須です' }, { status: 400 })
  }

  const id = randomUUID()
  db.prepare(`
    INSERT INTO tasks (
      id, user_id, project_id, parent_task_id, title, description,
      start_date, due_date, estimated_hours, actual_hours,
      progress, status, priority, sort_order, is_todo_visible, todo_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, session.userId, project_id, parent_task_id || null, title, description || null,
    start_date || null, due_date || null, estimated_hours ?? null, actual_hours ?? null,
    progress ?? 0, status ?? 'open', priority ?? 'medium', sort_order ?? 0,
    is_todo_visible ? 1 : 0, todo_date || null
  )

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as RawTask
  return NextResponse.json(normalizeTask(task), { status: 201 })
}
