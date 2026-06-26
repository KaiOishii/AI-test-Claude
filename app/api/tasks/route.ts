import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import sql from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { Task } from '@/lib/types'

function normalizeTask(t: Record<string, unknown>): Task {
  return { ...t, is_todo_visible: !!t.is_todo_visible } as Task
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get('project_id')
  const todoOnly  = req.nextUrl.searchParams.get('todo') === '1'
  const today     = req.nextUrl.searchParams.get('today')

  let rows: Record<string, unknown>[]

  if (projectId && today) {
    rows = await sql`
      SELECT t.*, p.name as project_name FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.user_id = ${session.userId} AND t.project_id = ${projectId}
        AND (t.todo_date = ${today} OR t.due_date = ${today})
      ORDER BY t.sort_order ASC, t.created_at ASC
    `
  } else if (projectId && todoOnly) {
    rows = await sql`
      SELECT t.*, p.name as project_name FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.user_id = ${session.userId} AND t.project_id = ${projectId}
        AND t.is_todo_visible = true
      ORDER BY t.sort_order ASC, t.created_at ASC
    `
  } else if (projectId) {
    rows = await sql`
      SELECT t.*, p.name as project_name FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.user_id = ${session.userId} AND t.project_id = ${projectId}
      ORDER BY t.sort_order ASC, t.created_at ASC
    `
  } else if (todoOnly && today) {
    rows = await sql`
      SELECT t.*, p.name as project_name FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.user_id = ${session.userId} AND t.is_todo_visible = true
        AND (t.todo_date = ${today} OR t.due_date = ${today})
      ORDER BY t.sort_order ASC, t.created_at ASC
    `
  } else if (todoOnly) {
    rows = await sql`
      SELECT t.*, p.name as project_name FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.user_id = ${session.userId} AND t.is_todo_visible = true
      ORDER BY t.sort_order ASC, t.created_at ASC
    `
  } else if (today) {
    rows = await sql`
      SELECT t.*, p.name as project_name FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.user_id = ${session.userId}
        AND (t.todo_date = ${today} OR t.due_date = ${today})
      ORDER BY t.sort_order ASC, t.created_at ASC
    `
  } else {
    rows = await sql`
      SELECT t.*, p.name as project_name FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.user_id = ${session.userId}
      ORDER BY t.sort_order ASC, t.created_at ASC
    `
  }

  return NextResponse.json(rows.map(normalizeTask))
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
  const now = new Date().toISOString()
  const [task] = await sql`
    INSERT INTO tasks (
      id, user_id, project_id, parent_task_id, title, description,
      start_date, due_date, estimated_hours, actual_hours,
      progress, status, priority, sort_order, is_todo_visible, todo_date,
      created_at, updated_at
    ) VALUES (
      ${id}, ${session.userId}, ${project_id}, ${parent_task_id || null}, ${title}, ${description || null},
      ${start_date || null}, ${due_date || null}, ${estimated_hours ?? null}, ${actual_hours ?? null},
      ${progress ?? 0}, ${status ?? 'open'}, ${priority ?? 'medium'}, ${sort_order ?? 0},
      ${!!is_todo_visible}, ${todo_date || null},
      ${now}, ${now}
    ) RETURNING *
  `

  return NextResponse.json(normalizeTask(task as Record<string, unknown>), { status: 201 })
}
