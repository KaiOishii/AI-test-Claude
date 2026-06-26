import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import db from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { Todo } from '@/lib/types'

function nextDueDate(date: string, recurring: string): string {
  const d = new Date(date)
  if (recurring === 'daily')   d.setDate(d.getDate() + 1)
  if (recurring === 'weekly')  d.setDate(d.getDate() + 7)
  if (recurring === 'monthly') d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const todo = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?').get(id, session.userId) as Todo | undefined
  if (!todo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { title, memo, completed, category_id, due_date, priority, recurring, sort_order, parent_id } = body

  db.prepare(`
    UPDATE todos SET
      title      = COALESCE(?, title),
      memo       = COALESCE(?, memo),
      completed  = COALESCE(?, completed),
      category_id = COALESCE(?, category_id),
      due_date   = COALESCE(?, due_date),
      priority   = COALESCE(?, priority),
      recurring  = COALESCE(?, recurring),
      sort_order = COALESCE(?, sort_order),
      parent_id  = COALESCE(?, parent_id),
      updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(
    title ?? null,
    memo !== undefined ? (memo || null) : null,
    completed !== undefined ? (completed ? 1 : 0) : null,
    category_id !== undefined ? (category_id || null) : null,
    due_date !== undefined ? (due_date || null) : null,
    priority ?? null,
    recurring ?? null,
    sort_order ?? null,
    parent_id !== undefined ? (parent_id || null) : null,
    id, session.userId
  )

  // When completing a recurring todo, auto-create the next occurrence
  if (completed === true && todo.recurring !== 'none' && todo.due_date) {
    const nextDate = nextDueDate(todo.due_date, todo.recurring)
    const nextId = randomUUID()
    db.prepare(`
      INSERT INTO todos (id, title, memo, user_id, category_id, due_date, priority, recurring, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(nextId, todo.title, todo.memo, session.userId, todo.category_id, nextDate, todo.priority, todo.recurring)
  }

  const updated = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as Todo
  return NextResponse.json({ ...updated, completed: !!updated.completed })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  // Delete subtasks first
  db.prepare('DELETE FROM todos WHERE parent_id = ? AND user_id = ?').run(id, session.userId)
  const result = db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?').run(id, session.userId)
  if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ success: true })
}
